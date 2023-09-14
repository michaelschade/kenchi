import { SlateConfig, ToolInput } from '@kenchi/slate-tools/lib/tool/types';

import FormatterInterface from '../pageContext/pageData/formatters/FormatterInterface';
import { VariableMap } from './useVariable';

export type RichSlateConfig = Omit<SlateConfig, 'rich'> & { rich: true };
export type PlainTextSlateConfig = Omit<SlateConfig, 'rich'> & { rich: false };

const isSlateConfig = (obj: any): obj is SlateConfig => {
  return obj && typeof obj === 'object' && obj.slate;
};

export const isRichSlateConfig = (obj: any): obj is RichSlateConfig =>
  isSlateConfig(obj) && obj.rich;

export const isPlainTextSlateConfig = (obj: any): obj is PlainTextSlateConfig =>
  isSlateConfig(obj) && !obj.rich;

export const getKey = (input: ToolInput) => {
  return `${input.source}:${input.id}`;
};

export const renderSlateConfig = (
  toolConfig: SlateConfig,
  variableMap: VariableMap,
  formatter: FormatterInterface
): { html: string; text: string } | string => {
  if (toolConfig.rich) {
    return formatter.formatRich(toolConfig, variableMap);
  } else {
    return formatter.formatText(toolConfig, variableMap);
  }
};

export const renderRichSlateConfig = (
  toolConfig: RichSlateConfig,
  variableMap: VariableMap,
  formatter: FormatterInterface
): { html: string; text: string } => {
  return formatter.formatRich(toolConfig, variableMap);
};

export const renderPlainTextSlateConfig = (
  toolConfig: PlainTextSlateConfig,
  variableMap: VariableMap,
  formatter: FormatterInterface
): string => {
  return formatter.formatText(toolConfig, variableMap);
};
