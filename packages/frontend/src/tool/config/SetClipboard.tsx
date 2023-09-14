import { faPaste } from '@fortawesome/pro-solid-svg-icons';

import { success } from '@kenchi/shared/lib/Result';

import { VariableMap } from '../useVariable';
import { ToolConfig } from './types';

export type SetClipboardConfig = {
  text: string;
};

const SetClipboard: ToolConfig = {
  getIcon() {
    return faPaste;
  },

  needsExtension() {
    return false;
  },

  getPreview({ text }: SetClipboardConfig, _variableMap: VariableMap) {
    return text;
  },

  async execute(
    _messageRouter: unknown,
    _pageContext: unknown,
    _domainSettings: unknown,
    _variableMap: VariableMap,
    { text }: SetClipboardConfig
  ) {
    navigator.clipboard.writeText(text);
    return success(true);
  },
};

export default SetClipboard;
