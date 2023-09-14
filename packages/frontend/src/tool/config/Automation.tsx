import { faListAlt } from '@fortawesome/pro-solid-svg-icons';
import { captureException, captureMessage, setExtra } from '@sentry/react';
import wait from 'waait';

import { Commands, KenchiMessageRouter } from '@kenchi/commands';
import { failure, success } from '@kenchi/shared/lib/Result';

import { DomainSettings } from '../../pageContext/domainSettings/DomainSettingsController';
import { PageData } from '../../pageContext/pageData/PageDataController';
import { isMessageRouterErrorType } from '../../utils';
import { parseXPath } from '../../utils/xpath';
import { describeStep, Step } from '../edit/Automation';
import {
  isRichSlateConfig,
  renderRichSlateConfig,
} from '../getRenderedConfiguration';
import { VariableMap, VariableMapProvider } from '../useVariable';
import { RunLog, ToolConfig } from './types';

export type AutomationConfig = {
  steps: Step[];
};

const PRE_ACTION_WAIT = 30 * 1000; // 30s

type WaitForCommandDetails = Commands['pageScript'][
  | 'automation:waitFor'
  | 'automation:waitForRemoved'];

const Automation: ToolConfig = {
  getIcon() {
    return faListAlt;
  },

  needsExtension() {
    return true;
  },

  getPreview({ steps }: AutomationConfig, variableMap: VariableMap) {
    if (!steps) {
      return null;
    }
    const stepsWithoutWaits = steps.filter((step: Step) => {
      return !['wait', 'waitFor', 'waitForRemoved'].includes(step.command);
    });

    return (
      <VariableMapProvider value={variableMap}>
        <ol>
          {stepsWithoutWaits.map((step, i) => (
            <li key={i}>{describeStep(step)}</li>
          ))}
        </ol>
      </VariableMapProvider>
    );
  },

  async execute(
    messageRouter: KenchiMessageRouter<'app'>,
    pageDataController: PageData,
    _domainSettings: DomainSettings,
    variableMap: VariableMap,
    config: AutomationConfig
  ) {
    const debug = true;

    const steps: Step[] = config.steps;

    const runLog: RunLog[] = [];
    let i: number = 0;

    const log = async (name: string) => {
      const entry: RunLog = {
        stepIndex: i,
        name,
        timestamp: new Date().getTime(),
      };
      if (debug) {
        try {
          entry.snapshot = await messageRouter.sendCommand(
            'pageScript',
            'domSnapshotCapture'
          );
        } catch (e) {}
      }
      runLog.push(entry);
    };

    console.log('Injecting snippet script');
    const injectPromises = [
      messageRouter.sendCommand('contentScript', 'injectScript', {
        name: 'automation',
      }),
    ];
    if (debug) {
      injectPromises.push(
        messageRouter.sendCommand('contentScript', 'injectScript', {
          name: 'domSnapshot',
        })
      );
    }
    const [automationInject] = await Promise.allSettled(injectPromises);
    if (automationInject.status === 'rejected') {
      if (
        isMessageRouterErrorType(automationInject.reason, 'alreadyInjected')
      ) {
        console.log('Already injected, continuing');
      } else {
        throw automationInject.reason;
      }
    }

    await log('init');
    const stepFailure = async () => {
      await log('failure');
      return failure({
        message: `Sorry, Kenchi was unable to ${describeStep(
          steps[i]
        ).toLowerCase()} (step ${i + 1}/${
          steps.length
        }). If you're sure this is the right Snippet for this page, tell us what went wrong in the feedback box below and we'll take a look.`,
        runLog,
      });
    };

    const handleStepError = (error: Error) => {
      if (
        isMessageRouterErrorType(error, 'timeout') ||
        isMessageRouterErrorType(error, 'elementNotFound') ||
        isMessageRouterErrorType(error, 'invalidElementType')
      ) {
        captureException(error);
        return stepFailure();
      } else {
        throw error;
      }
    };

    const asyncCommand = (
      command: 'waitFor' | 'waitForRemoved',
      request: WaitForCommandDetails['args']
    ): Promise<WaitForCommandDetails['resp']> => {
      const id = Math.random().toString();
      let response: (
        resp: WaitForCommandDetails['resp']
      ) => Promise<void> = () => {
        throw new Error('Impossible!');
      };
      const promise = new Promise<WaitForCommandDetails['resp']>(
        async (resolve) => {
          response = async (resp: WaitForCommandDetails['resp']) => {
            if (id !== resp.id) {
              captureMessage('Got a waitFor response for the wrong ID');
              resolve({ success: false });
            } else {
              if (resp.error) {
                captureException(resp.error);
              }
              resolve({ success: resp.success });
            }
          };
        }
      );
      messageRouter.addCommandHandler(
        'pageScript',
        `automation:${command}Response`,
        response
      );
      messageRouter.sendCommand('pageScript', `automation:${command}`, {
        ...request,
        id,
        async: true,
      });
      return promise.finally(() => {
        messageRouter.removeCommandHandler(
          'pageScript',
          `automation:${command}Response`,
          response
        );
      });
    };

    for (i = 0; i < steps.length; i++) {
      let res: { success: boolean };
      const step = { ...steps[i] };
      if ('xpath' in step) {
        step.xpath = parseXPath(step.xpath);
      }
      console.log(`Starting step ${i}: ${step.command}`, step);
      try {
        if (
          step.command === 'insertText' ||
          step.command === 'click' ||
          step.command === 'checkboxCheck' ||
          step.command === 'checkboxUncheck' ||
          step.command === 'focus'
        ) {
          console.log(
            `Giving ${step.command} element ${PRE_ACTION_WAIT}ms to appear`
          );
          try {
            const waitForRes = await asyncCommand('waitFor', {
              xpath: step.xpath,
              timeout: PRE_ACTION_WAIT,
            });
            if (!waitForRes?.success) {
              return stepFailure();
            }
          } catch (error) {
            console.log('Element failed to appear, stopping');
            if (error instanceof Error) {
              return handleStepError(error);
            } else {
              throw error;
            }
          }
          await log('beforeCommand');
        }
        switch (step.command) {
          case 'insertText':
            if (!isRichSlateConfig(step.text)) {
              setExtra('step', step);
              throw new Error('Invalid slate config for insertText step');
            }
            res = await messageRouter.sendCommand(
              'contentScript',
              'insertText',
              {
                data: renderRichSlateConfig(
                  step.text,
                  variableMap,
                  pageDataController.getFormatter()
                ),
                path: { type: 'xpath', xpath: parseXPath(step.xpath) },
                useSelection: !step.overwrite,
              }
            );
            break;
          case 'wait':
            await wait(step.timeout);
            res = { success: true };
            break;
          case 'click':
          case 'checkboxCheck':
          case 'checkboxUncheck':
            res = await messageRouter.sendCommand(
              'pageScript',
              `automation:${step.command}`,
              step
            );
            break;
          case 'waitFor':
          case 'waitForRemoved':
            res = await asyncCommand(step.command, step);
            break;
          case 'focus':
            res = await messageRouter.sendCommand(
              'pageScript',
              `automation:${step.command}`,
              step
            );
            break;
          default:
            // Will cause Typescript to enforce we never get here (i.e. the switch is exhaustive)
            ((step: never) => {
              throw new Error(`Unexpected command in step ${step}`);
            })(step);
        }
      } catch (error) {
        if (error instanceof Error) {
          return handleStepError(error);
        } else {
          throw error;
        }
      }
      if (res && res.success) {
        console.log(`Successfully finished command ${i}`, res);
      } else {
        console.log(`Soft failed command ${i}, stopping`, res);
        return stepFailure();
      }
      await log('after');
    }
    console.log('Finished snippet run');
    return success(true);
  },
};

export default Automation;
