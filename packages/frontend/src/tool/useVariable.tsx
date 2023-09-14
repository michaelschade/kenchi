import { createContext, useContext } from 'react';

export type VariableMap = Record<string, string | undefined>;

const VariableMapContext = createContext<VariableMap | null>(null);

export const VariableMapProvider = VariableMapContext.Provider;

export default function useVariable(key: string) {
  const variableMap = useContext(VariableMapContext);
  if (variableMap) {
    return variableMap[key];
  }
  return null;
}
