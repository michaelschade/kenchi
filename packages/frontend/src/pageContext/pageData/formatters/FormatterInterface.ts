import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';

import { VariableMap } from '../../../tool/useVariable';

export default interface FormatterInterface {
  formatRich(
    config: SlateConfig,
    variableMap: VariableMap
  ): { text: string; html: string };

  formatText(config: SlateConfig, variableMap: VariableMap): string;
}
