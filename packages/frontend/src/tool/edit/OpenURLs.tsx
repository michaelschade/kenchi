import { useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import isEqual from 'fast-deep-equal';

import { SlateConfig, ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';
import {
  deserialize as deserializeSlate,
  extractVariablesFromSlate,
  isSlateEmpty,
  newSlateBlob,
  serializeSlate,
} from '@kenchi/slate-tools/lib/utils';
import { baseFormControl, FormGroup } from '@kenchi/ui/lib/Form';

import Editor from '../../slate/Editor';
import { Tip, useAllPossibleVariables, useInputRecalculator } from './utils';

const LinksContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-gap: 0.5rem;
`;

type ConfigEditorProps = {
  configuration: null | { urls?: SlateConfig[] };
  inputs: ToolInput[];
  onChange: (config: { urls: SlateConfig[] }) => void;
  onInputsChange: (inputs: ToolInput[]) => void;
};

export default function OpenURLsConfigurationEditor({
  configuration,
  inputs,
  onChange,
  onInputsChange,
}: ConfigEditorProps) {
  const [lastValues, setLastValues] = useState<SlateNode[][]>([]);
  const allPossibleVariables = useAllPossibleVariables();

  const urls = useMemo(() => configuration?.urls ?? [], [configuration]);

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
      urls.forEach((value) => {
        extractVariablesFromSlate(value.children).forEach(
          (v) => (foundVariables[v.id] = v)
        );
      });
      return foundVariables;
    }, [urls]),
    inputs,
    onInputsChange
  );

  const updateURL = (i: number, url: SlateNode[]) => {
    // We get an onChange from Slate for every change, including selection. We
    // only want content changes so we don't recalculate everything (which
    // causes UI blinking and selection issues).
    if (isEqual(url, lastValues[i])) {
      return;
    }
    setLastValues((lastValues) => {
      lastValues[i] = url;
      return lastValues;
    });
    const newConfiguration = {
      ...configuration,
      urls: [...urls],
    };
    newConfiguration.urls[i] = serializeSlate(url, { singleLine: true });
    onChange(newConfiguration);
    recalculateInputs();
  };
  const maybeRemove = (i: number) => {
    if (isSlateEmpty(urls[i])) {
      const newConfiguration = {
        ...configuration,
        urls: [...urls],
      };
      newConfiguration.urls.splice(i, 1);
      onChange(newConfiguration);
      recalculateInputs();
    }
  };
  const makeURLControl = (url: SlateConfig, i: number) => {
    // TODO: Fix this so 1) id works to click into editor and 2) there's a :focus styling etc.
    return (
      <div css={baseFormControl} key={i}>
        <Editor
          singleLine
          variables={variables}
          value={deserializeSlate(url)}
          placeholder="URL"
          onBlur={() => maybeRemove(i)}
          onChange={(v) => updateURL(i, v)}
          size="small"
        />
      </div>
    );
  };
  // TODO: reorder grabber
  const urlControls = urls.map(makeURLControl);
  if (!isSlateEmpty(urls[urls.length - 1])) {
    urlControls.push(
      makeURLControl(newSlateBlob({ singleLine: true }), urls.length)
    );
  }
  return (
    <FormGroup label="Links to Open">
      <LinksContainer>{urlControls}</LinksContainer>
      <Tip>
        <strong>Tip:</strong> Press @ to add variables. Variables dynamically
        include info like user ID or email.
      </Tip>
    </FormGroup>
  );
}
