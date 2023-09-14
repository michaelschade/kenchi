import { useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { useDebouncedCallback } from 'use-debounce';

import type { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { useDomainSettingsQuery } from '../../pageContext/domainSettings/useDomainSettingsQuery';
import {
  AllPossibleVariables,
  getAllPossibleVariables,
} from '../../pageContext/pageData/variableExtractors';

export const Tip = styled.p`
  font-size: 0.8rem;
  margin-top: 15px;
  color: ${({ theme }) => theme.colors.gray[11]};
`;

export const computeIsUploading = (value: SlateNode[]) => {
  const check = (n: SlateNode) => {
    if (n.type === 'image') {
      return !!n.uploading;
    } else if (n.children) {
      return n.children.some(check);
    } else {
      return false;
    }
  };
  return value.some(check);
};

export function useInputRecalculator(
  foundVariableCalculator: () => { [id: string]: ToolInput },
  inputs: ToolInput[],
  onInputsChange: (value: ToolInput[]) => void
) {
  return useDebouncedCallback(
    useCallback(() => {
      const inputSet = new Set<string>();
      const foundVariables = foundVariableCalculator();
      inputs.forEach(({ id }: { id: string }) => inputSet.add(id));
      // Remove missing inputs
      const newInputs = inputs.filter(
        ({ id }: { id: string }) => foundVariables[id]
      );
      let changed = newInputs.length !== inputs.length;
      // Add new inputs
      Object.keys(foundVariables).forEach((id) => {
        if (!inputSet.has(id)) {
          const variable = foundVariables[id];
          newInputs.push({
            source: variable.source,
            id,
            placeholder: variable.placeholder || id,
          });
          changed = true;
        }
      });
      if (changed) {
        onInputsChange(newInputs);
      }
    }, [foundVariableCalculator, inputs, onInputsChange]),
    100
  );
}

export function useAllPossibleVariables(): AllPossibleVariables | null {
  const { data: settings } = useDomainSettingsQuery({
    fetchPolicy: 'cache-first',
  });
  return useMemo(() => {
    if (!settings) {
      return null;
    }
    return getAllPossibleVariables(settings);
  }, [settings]);
}
