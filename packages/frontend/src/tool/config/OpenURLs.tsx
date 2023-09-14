import { faWindowRestore } from '@fortawesome/pro-solid-svg-icons';

import { KenchiMessageRouter } from '@kenchi/commands';
import { success } from '@kenchi/shared/lib/Result';
import { deserialize as deserializeSlate } from '@kenchi/slate-tools/lib/utils';

import { DomainSettings } from '../../pageContext/domainSettings/DomainSettingsController';
import PageDataController from '../../pageContext/pageData/PageDataController';
import Renderer from '../../slate/Renderer';
import {
  PlainTextSlateConfig,
  renderPlainTextSlateConfig,
} from '../getRenderedConfiguration';
import { VariableMap, VariableMapProvider } from '../useVariable';
import { ToolConfig } from './types';

export type OpenURLsConfig = {
  urls: PlainTextSlateConfig[];
};

const OpenURLs: ToolConfig = {
  getIcon() {
    return faWindowRestore;
  },

  needsExtension() {
    return false;
  },

  getPreview({ urls }: OpenURLsConfig, variableMap: VariableMap) {
    if (!urls) {
      return null;
    }
    const deserializedUrls = urls.map(deserializeSlate);
    if (deserializedUrls.length === 1) {
      return (
        <VariableMapProvider value={variableMap}>
          <p>
            Open this page in a new tab:
            <br />
            <span className="url">
              <Renderer singleLine contents={deserializedUrls[0]} />
            </span>
          </p>
        </VariableMapProvider>
      );
    } else {
      return (
        <VariableMapProvider value={variableMap}>
          <p>Open these pages in new tabs:</p>
          <ul>
            {deserializedUrls.map((url, i) => (
              <li key={i}>
                <span className="url">
                  <Renderer singleLine contents={url} />
                </span>
              </li>
            ))}
          </ul>
        </VariableMapProvider>
      );
    }
  },

  async execute(
    _messageRouter: KenchiMessageRouter<'app' | 'hud'>,
    pageDataController: PageDataController,
    _domainSettings: DomainSettings | null,
    variableMap: VariableMap,
    { urls }: OpenURLsConfig
  ) {
    const formatter = pageDataController.getFormatter();
    urls.forEach((url: PlainTextSlateConfig) =>
      window.open(renderPlainTextSlateConfig(url, variableMap, formatter))
    );
    return success(true);
  },
};

export default OpenURLs;
