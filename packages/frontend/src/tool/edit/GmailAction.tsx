import { useCallback, useMemo, useState } from 'react';

import { css } from '@emotion/react';
import isEqual from 'fast-deep-equal';

import { SlateConfig, ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import {
  deserialize as deserializeSlate,
  extractVariablesFromSlate,
  newSlateBlob,
  serializeSlate,
} from '@kenchi/slate-tools/lib/utils';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { FormGroup } from '@kenchi/ui/lib/Form';

import { RecoveryEditor } from '../../slate/Editor/Recovery';
import { Tip, useAllPossibleVariables, useInputRecalculator } from './utils';

type GmailActionFormConfig = {
  data: SlateConfig;
  intercomTags?: string[];
};

type ConfigEditorProps = {
  configuration: null | GmailActionFormConfig;
  inputs: ToolInput[];
  onChange: (config: GmailActionFormConfig) => void;
  onInputsChange: (inputs: ToolInput[]) => void;
  disabled: boolean;
};
export default function GmailActionConfigurationEditor({
  configuration,
  inputs,
  onChange,
  onInputsChange,
  disabled,
}: ConfigEditorProps) {
  const [lastValue, setLastValue] = useState();

  const allPossibleVariables = useAllPossibleVariables();
  const data = configuration?.data ?? newSlateBlob({ rich: true });

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
      extractVariablesFromSlate(data.children).forEach(
        (v) => (foundVariables[v.id] = v)
      );
      return foundVariables;
    }, [data]),
    inputs,
    onInputsChange
  );

  const updateGmailText = useCallback(
    (value) => {
      // We get an onChange from Slate for every change, including selection. We
      // only want content changes so we don't recalculate everything (which
      // causes UI blinking and selection issues).
      if (!isEqual(lastValue, value)) {
        setLastValue(value);
        onChange({
          ...configuration,
          data: serializeSlate(value, { rich: true }),
        });
        recalculateInputs();
      }
    },
    [onChange, recalculateInputs, configuration, lastValue]
  );

  return (
    <FormGroup>
      <div
        css={({ colors }: KenchiTheme) => css`
          border: 1px solid ${colors.gray[7]};
          border-radius: 0.25rem;
          background-color: ${colors.gray[0]};
        `}
      >
        <RecoveryEditor
          recoveryKey="tool"
          variables={variables}
          withFormattingForInsert
          withImages
          withURLLinks
          singleLine={false}
          size="small"
          value={deserializeSlate(data)}
          onChange={updateGmailText}
          style={{ minHeight: '300px' }}
          disabled={disabled}
        />
      </div>
      <Tip>
        <strong>Tip:</strong> Press @ to add variables. Variables dynamically
        include info like the name of the person you're emailing or your
        signature.
      </Tip>
    </FormGroup>
  );
}
