import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { css } from '@emotion/react';
import {
  faGripVertical,
  faMinusCircle,
  faPlusCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';
import isEqual from 'fast-deep-equal';
import update from 'immutability-helper';
import { useDrag, useDrop } from 'react-dnd';

import { SlateConfig, ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import {
  deserialize as deserializeSlate,
  extractVariablesFromSlate,
  newSlateBlob,
  serializeSlate,
} from '@kenchi/slate-tools/lib/utils';
import {
  FormGroup,
  InputGroup,
  SelectGroup,
  Switch,
} from '@kenchi/ui/lib/Form';

import Editor from '../../slate/Editor';
import { isMessageRouterErrorType } from '../../utils';
import useMessageRouter from '../../utils/useMessageRouter';
import { useAllPossibleVariables, useInputRecalculator } from './utils';
import XPathInput, { XPathInputProvider } from './XPathInput';

type WithXPath = { xpath: string; label?: string };
type BaseStep = { id: string };

type InsertTextStep = BaseStep &
  WithXPath & {
    command: 'insertText';
    text: SlateConfig;
    overwrite: boolean;
  };
type FocusStep = BaseStep & WithXPath & { command: 'focus' };
type ClickStep = BaseStep & WithXPath & { command: 'click' };
type CheckboxCheckStep = BaseStep & WithXPath & { command: 'checkboxCheck' };
type CheckboxUnheckStep = BaseStep & WithXPath & { command: 'checkboxUncheck' };
type WaitForStep = BaseStep &
  WithXPath & { command: 'waitFor' | 'waitForRemoved'; timeout: number };
type WaitStep = BaseStep & { command: 'wait'; timeout: number };

export type Step =
  | InsertTextStep
  | FocusStep
  | ClickStep
  | CheckboxCheckStep
  | CheckboxUnheckStep
  | WaitForStep
  | WaitStep;
type Config = { steps: Step[] };

const stepStyle = css`
  position: relative;
  padding-left: 20px;

  &.isDragging {
    opacity: 0;
  }

  & .drag {
    position: absolute;
    opacity: 0.6;
    cursor: pointer;
    left: 0;
    top: 5px;

    &:hover,
    &:active {
      opacity: 1;
    }
  }
`;

export const describeStep = (step: Step): string => {
  if (step.command === 'wait') {
    const timeout = step.timeout / 1000.0;
    return `Wait ${timeout} ${timeout === 1 ? 'second' : 'seconds'}`;
  }
  const label = step.label ? `"${step.label}"` : 'an item on this page';
  switch (step.command) {
    case 'click':
      return `Click ${label}`;
    case 'checkboxCheck':
      return `Check ${label}`;
    case 'checkboxUncheck':
      return `Uncheck ${label}`;
    case 'focus':
      return `Focus ${label}`;
    case 'waitFor':
      return `Find ${label}`;
    case 'waitForRemoved':
      return `Wait for ${label} to disappear`;
    case 'insertText':
      return `Insert text into ${label}`;
  }
};

type StepEditorProps = {
  index: number;
  step: Step;
  onChange: (step: Step) => void;
  onRemove: () => void;
  moveStep: (drag: number, hover: number) => void;
  recalculateInputs: () => void;
  variables: ToolInput[];
};
type DragItem = {
  index: number;
};
function StepEditor({
  index,
  step,
  moveStep,
  onChange,
  onRemove,
  recalculateInputs,
  variables,
}: StepEditorProps) {
  const [lastValue, setLastValue] = useState<SlateNode[] | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<DragItem, unknown, unknown>({
    accept: 'step',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffsetY = monitor.getClientOffset()?.y || 0;

      // Get pixels to the top
      const hoverClientY = clientOffsetY - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveStep(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'step',
    item: { index } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const updateTimeout = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (
        step.command !== 'waitFor' &&
        step.command !== 'waitForRemoved' &&
        step.command !== 'wait'
      ) {
        return;
      }
      const value = e.target.value ? parseInt(e.target.value) : 0;
      if (isNaN(value) || value > 30000) {
        return;
      }
      onChange({
        ...step,
        timeout: value,
      });
    },
    [step, onChange]
  );

  const updateLabel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (step.command === 'wait') {
        return;
      }
      onChange({
        ...step,
        label: e.target.value,
      });
    },
    [step, onChange]
  );

  const updateStepText = useCallback(
    (text: SlateNode[]) => {
      // We get an onChange from Slate for every change, including selection. We
      // only want content changes so we don't recalculate everything (which
      // causes UI blinking and selection issues).
      if (step.command !== 'insertText' || isEqual(text, lastValue)) {
        return;
      }
      setLastValue(text);
      onChange({
        ...step,
        text: serializeSlate(text, { rich: true }),
      });
      recalculateInputs();
    },
    [step, lastValue, onChange, recalculateInputs]
  );

  const updateCommand = useCallback(
    (command: string) => {
      const oldStep = step as any;
      let newStep: Step;
      switch (command) {
        case 'click':
        case 'checkboxCheck':
        case 'checkboxUncheck':
        case 'focus':
          newStep = {
            id: oldStep.id,
            command,
            xpath: oldStep.xpath || '',
          };
          break;
        case 'wait':
          newStep = {
            id: oldStep.id,
            command,
            timeout: oldStep.timeout || 5000,
          };
          break;
        case 'waitFor':
        case 'waitForRemoved':
          newStep = {
            id: oldStep.id,
            command,
            xpath: oldStep.xpath || '',
            timeout: oldStep.timeout || 5000,
          };
          break;
        case 'insertText':
          newStep = {
            id: oldStep.id,
            command,
            xpath: oldStep.xpath || '',
            overwrite: false,
            text: newSlateBlob({ rich: true }),
          };
          break;
        default:
          throw new Error('Unexpect command type');
      }
      onChange(newStep);
    },
    [step, onChange]
  );

  drop(preview(ref));

  const commandOptions = [
    { value: 'click', label: 'Click' },
    { value: 'checkboxCheck', label: 'Checkbox: Check' },
    { value: 'checkboxUncheck', label: 'Checkbox: Uncheck' },
    { value: 'focus', label: 'Focus' },
    { value: 'wait', label: 'Wait an amount of time' },
    { value: 'waitFor', label: 'Wait to appear' },
    { value: 'waitForRemoved', label: 'Wait to disappear' },
    { value: 'insertText', label: 'Insert text' },
  ];
  return (
    <>
      <div ref={ref} css={stepStyle} className={classNames({ isDragging })}>
        <div ref={drag} className="drag">
          <FontAwesomeIcon icon={faGripVertical} />
        </div>
        <SelectGroup
          id={step.id}
          value={step.command}
          onSelect={updateCommand}
          options={commandOptions}
          size="small"
        />
        {step.command !== 'wait' && (
          <XPathInput
            id={step.id}
            value={step.xpath}
            onChange={(xpath) => onChange({ ...step, xpath })}
          />
        )}
        {(step.command === 'waitFor' ||
          step.command === 'waitForRemoved' ||
          step.command === 'wait') && (
          <InputGroup
            id={step.id}
            label="Max time (ms)"
            value={step.timeout}
            onChange={updateTimeout}
          />
        )}
        {step.command !== 'wait' && (
          <InputGroup
            id={step.id}
            value={step.label || ''}
            placeholder="Label"
            onChange={updateLabel}
          />
        )}
        {step.command === 'insertText' && (
          <>
            <FormGroup id={step.id}>
              <div
                style={{
                  border: '1px solid #ced4da',
                  borderRadius: '0.25rem',
                  background: '#fff',
                }}
              >
                <Editor
                  singleLine={false}
                  withFormattingForInsert
                  variables={variables}
                  value={deserializeSlate(step.text)}
                  placeholder="Text"
                  onChange={updateStepText}
                  size="small"
                  style={{ minHeight: '200px' }}
                />
              </div>
            </FormGroup>
            <Switch
              id={`${step.id}-overwrite`}
              label="Overwrite existing value"
              checked={step.overwrite}
              onCheckedChange={(overwrite) => {
                if (step.command === 'insertText') {
                  onChange({ ...step, overwrite });
                }
              }}
            />
          </>
        )}
        {index !== 0 && (
          <FontAwesomeIcon
            style={{ cursor: 'pointer' }}
            icon={faMinusCircle}
            onClick={onRemove}
          />
        )}
      </div>
      <hr />
    </>
  );
}

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function makeStepID() {
  let rtn = 'step_0';
  for (var i = 0; i < 9; i++) {
    rtn += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return rtn;
}

type ConfigEditorProps = {
  configuration: null | Config;
  inputs: ToolInput[];
  onChange: (config: Config) => void;
  onInputsChange: (inputs: ToolInput[]) => void;
};

export default function AutomationConfigurationEditor({
  configuration: maybeNullConfiguration,
  inputs,
  onChange,
  onInputsChange,
}: ConfigEditorProps) {
  const messageRouter = useMessageRouter();

  let steps: Step[] = useMemo(
    () =>
      maybeNullConfiguration?.steps ?? [
        { command: 'click', xpath: '', id: makeStepID() },
      ],
    [maybeNullConfiguration]
  );
  let configuration = maybeNullConfiguration || { steps };
  if (steps.some((s) => !('id' in s))) {
    // Backfill missing step IDs
    // TODO: migrate
    steps = steps.map((s) => ({ ...s, id: makeStepID() }));
    configuration = {
      ...configuration,
      steps,
    };
    onChange(configuration);
  }

  useEffect(() => {
    if (messageRouter) {
      messageRouter
        .sendCommand('contentScript', 'injectScript', { name: 'domPicker' })
        .catch((e) => {
          if (!isMessageRouterErrorType(e, 'alreadyInjected')) {
            throw e;
          }
        });
    }
  }, [messageRouter]);

  const allPossibleVariables = useAllPossibleVariables();

  const variables = useMemo(() => {
    // variables is a list of ToolInputs that each extractors notes, possibly
    // with a different placeholder. Just pick the first for now.
    const pageVariables: ToolInput[] = Object.values(
      allPossibleVariables || {}
    ).map(({ variables }) => ({ source: 'page', ...variables[0] }));
    return inputs.filter((i) => i.source === 'input').concat(pageVariables);
  }, [inputs, allPossibleVariables]);

  const recalculateInputs = useInputRecalculator(
    useCallback(() => {
      const foundVariables: Record<string, ToolInput> = {};
      steps.forEach((step) => {
        if (step.command === 'insertText') {
          extractVariablesFromSlate(step.text.children).forEach(
            (v) => (foundVariables[v.id] = v)
          );
        }
      });
      return foundVariables;
    }, [steps]),
    inputs,
    onInputsChange
  );

  const addNewStep = () => {
    onChange(
      update(configuration, {
        steps: { $push: [{ id: makeStepID(), command: 'click', xpath: '' }] },
      })
    );
  };

  const makeStep = (step: Step, i: number) => (
    <StepEditor
      key={step.id}
      index={i}
      step={step}
      recalculateInputs={recalculateInputs}
      variables={variables}
      onRemove={() => {
        onChange(update(configuration, { steps: { $splice: [[i, 1]] } }));
        recalculateInputs();
      }}
      onChange={(newStep) => {
        onChange(
          update(configuration, { steps: { $splice: [[i, 1, newStep]] } })
        );
      }}
      moveStep={(dragIndex, hoverIndex) => {
        const dragStep = steps[dragIndex];
        onChange(
          update(configuration, {
            steps: {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, dragStep],
              ],
            },
          })
        );
      }}
    />
  );

  return (
    <FormGroup label="Steps">
      <hr />
      <XPathInputProvider>{steps.map(makeStep)}</XPathInputProvider>
      <FontAwesomeIcon
        style={{ cursor: 'pointer' }}
        icon={faPlusCircle}
        onClick={addNewStep}
      />
    </FormGroup>
  );
}
