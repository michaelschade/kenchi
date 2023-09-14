import { useCallback, useEffect, useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import { captureMessage } from '@sentry/react';

import {
  SendToolRunLogMutation,
  SendToolRunLogMutationVariables,
  ToolListItemFragment,
} from '../graphql/generated';
import { useDomainSettings } from '../pageContext/domainSettings/useDomainSettings';
import { usePageDataController } from '../pageContext/pageData/usePageDataController';
import { usePageVariables } from '../pageContext/pageData/usePageVariables';
import { isExtension } from '../utils';
import useMessageRouter from '../utils/useMessageRouter';
import toolConfig from './config';
import { VariableMap } from './useVariable';

export enum ToolRunStatus {
  idle = 'idle',
  running = 'running',
  justRan = 'justRan',
  error = 'error',
}

const MUTATION = gql`
  mutation SendToolRunLogMutation($log: Json!, $toolId: ID!) {
    sendToolRunLog(log: $log, toolId: $toolId)
  }
`;

export enum InputFillStatus {
  noInput = 'noInput',
  alwaysPrompts = 'alwaysPrompts',
  filledFromPage = 'filledFromPage',
  failedToFill = 'failedToFill',
}

type RunToolTuple = [
  () => Promise<boolean>,
  {
    getPreview: () => React.ReactNode;
    canRun: boolean;
    inputFillStatus: InputFillStatus;
    status: ToolRunStatus;
    error: string | null;
    resetError: () => void;
  }
];

export default function useRunTool(
  tool: ToolListItemFragment,
  variableInputs: VariableMap
): RunToolTuple {
  const pageDataController = usePageDataController();
  const pageVariables = usePageVariables();
  const [domainSettings] = useDomainSettings();
  const messageRouter = useMessageRouter();

  const [sendRunLog] = useMutation<
    SendToolRunLogMutation,
    SendToolRunLogMutationVariables
  >(MUTATION);

  const [status, setStatus] = useState<ToolRunStatus>(ToolRunStatus.idle);
  const [error, setError] = useState<string | null>(null);

  const canRun: boolean =
    !toolConfig[tool.component].needsExtension() || isExtension();

  let inputFillStatus;
  if (tool.inputs.length === 0) {
    inputFillStatus = InputFillStatus.noInput;
  } else if (
    tool.inputs.every(
      (input) => input.source === 'page' && pageVariables[`page:${input.id}`]
    )
  ) {
    inputFillStatus = InputFillStatus.filledFromPage;
  } else if (tool.inputs.some((input) => input.source === 'input')) {
    inputFillStatus = InputFillStatus.alwaysPrompts;
  } else {
    inputFillStatus = InputFillStatus.failedToFill;
  }

  useEffect(() => {
    if (status === ToolRunStatus.justRan) {
      const timerHandler = window.setTimeout(
        () => setStatus(ToolRunStatus.idle),
        2000
      );
      return () => window.clearTimeout(timerHandler);
    }
  }, [status]);

  const run = useCallback(async () => {
    if (!canRun) {
      return false;
    }

    console.log(
      `Starting snippet run. static_id=${tool.staticId} component=${tool.component}`
    );
    try {
      const result = await toolConfig[tool.component].execute(
        messageRouter,
        pageDataController,
        domainSettings,
        { ...pageVariables, ...variableInputs },
        tool.configuration
      );
      setStatus(ToolRunStatus.justRan);
      if (!result.success) {
        captureMessage(`Snippet failed`);
        setStatus(ToolRunStatus.error);
        setError(result.error.message);
        if (result.error.runLog && tool.id !== '__generated__') {
          // Don't send error logs for tools in edit mode
          sendRunLog({
            variables: {
              log: result.error.runLog,
              toolId: tool.id,
            },
          });
        }
        return false;
      } else {
        return true;
      }
    } catch (error) {
      setStatus(ToolRunStatus.error);
      setError(
        "Sorry, something unexpected went wrong while running this snippet. We've been notified and will take a look."
      );
      throw error;
    }
  }, [
    canRun,
    tool,
    pageVariables,
    variableInputs,
    sendRunLog,
    pageDataController,
    domainSettings,
    messageRouter,
  ]);

  const getPreview = useCallback(() => {
    return toolConfig[tool.component].getPreview(tool.configuration || {}, {
      ...pageVariables,
      ...variableInputs,
    });
  }, [pageVariables, tool, variableInputs]);

  const resetError = useCallback(() => {
    if (status === ToolRunStatus.error) {
      setStatus(ToolRunStatus.idle);
      setError(null);
    }
  }, [status]);

  return [
    run,
    {
      getPreview,
      canRun,
      inputFillStatus,
      status,
      error,
      resetError,
    },
  ];
}
