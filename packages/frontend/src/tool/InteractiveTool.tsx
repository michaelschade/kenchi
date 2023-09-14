import { useCallback, useState } from 'react';

import styled from '@emotion/styled';
import {
  faCheckCircle,
  faInfoCircle,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { Input } from '@kenchi/ui/lib/Form';

import ErrorAlert from '../components/ErrorAlert';
import { ToolListItemFragment } from '../graphql/generated';
import { usePageVariables } from '../pageContext/pageData/usePageVariables';
import { isExtension } from '../utils';
import { getKey } from './getRenderedConfiguration';
import { ToolContentsPreview } from './ToolContentsPreview';
import useRunTool, { ToolRunStatus } from './useRunTool';
import { VariableMap } from './useVariable';

type Props = {
  tool: ToolListItemFragment;
  inEditMode: boolean;
  trackAction: (name: 'run' | 'error_run') => void;
  onBeforeRun?: () => Promise<void>;
  onRun?: (success: boolean) => void;
  shouldHideActionButton?: boolean;
};

const Grid = styled.div`
  display: grid;
  gap: 1rem;
`;

export default function InteractiveTool({
  tool,
  inEditMode,
  trackAction,
  onBeforeRun,
  onRun,
  shouldHideActionButton,
}: Props) {
  const pageVariables = usePageVariables();
  const [variableInputs, setVariableInputs] = useState<VariableMap>({});

  const [runTool, { getPreview, canRun, status, error, resetError }] =
    useRunTool(tool, variableInputs);

  const run = useCallback(async () => {
    if (!canRun) {
      return;
    }
    if (status === ToolRunStatus.error) {
      resetError();
    } else {
      if (onBeforeRun) {
        await onBeforeRun();
      }
      const success = await runTool();
      if (success) {
        trackAction('run');
      } else {
        trackAction('error_run');
      }
      onRun?.(success);
    }
  }, [canRun, resetError, runTool, onBeforeRun, onRun, status, trackAction]);

  let primaryActionLabel: React.ReactNode = inEditMode ? 'Test' : 'Run';
  if (status === ToolRunStatus.running) {
    primaryActionLabel = <>Running&hellip;</>;
  } else if (status === ToolRunStatus.justRan) {
    primaryActionLabel = (
      <>
        <FontAwesomeIcon icon={faCheckCircle} /> Ran!
      </>
    );
  }

  const previewContents = getPreview();

  const allValues = {
    ...pageVariables,
    ...variableInputs,
  };

  const renderedInputs = tool.inputs.map((input, i) => {
    let tooltip: string | undefined = undefined;
    let iconType: IconDefinition | undefined = undefined;
    if (input.source === 'page') {
      iconType = faInfoCircle;
      if (pageVariables[input.id]) {
        tooltip = `${input.placeholder} autofilled from info on this page.`;
        iconType = faCheckCircle;
      } else if (inEditMode) {
        tooltip = `${input.placeholder} will be autofilled in tools like Intercom and Zendesk.`;
      } else if (!isExtension()) {
        tooltip = `${input.placeholder} will be autofilled in tools like Intercom and Zendesk when you're using the Kenchi Chrome extension.`;
      } else {
        tooltip = `${input.placeholder} would usually be autofilled, but could not be found on this page.`;
      }
    }
    const key = getKey(input);
    return (
      <Input
        icon={iconType}
        tooltip={tooltip}
        key={key}
        type="text"
        autoFocus={i === 0 && !inEditMode}
        placeholder={input.placeholder}
        value={allValues[key] || ''}
        onChange={(event) => {
          const value = event.target.value;
          setVariableInputs((prevInputs) => ({
            ...prevInputs,
            [key]: value === '' ? undefined : value,
          }));
        }}
      />
    );
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <Grid>
        {renderedInputs}
        {!shouldHideActionButton && (
          <PrimaryButton
            type="submit"
            autoFocus={!inEditMode && tool.inputs.length === 0}
            disabled={!canRun || status === 'running'}
            title={
              canRun
                ? undefined
                : 'Snippet can only be run from the Kenchi extension'
            }
          >
            {primaryActionLabel}
          </PrimaryButton>
        )}
        {error && (
          <ErrorAlert title="Error running snippet" error={<>{error}</>} />
        )}
        {previewContents ? (
          <ToolContentsPreview>{previewContents}</ToolContentsPreview>
        ) : null}
      </Grid>
    </form>
  );
}
