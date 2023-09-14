import { faMailBulk } from '@fortawesome/pro-solid-svg-icons';

import { KenchiMessageRouter } from '@kenchi/commands';
import { SlateConfig } from '@kenchi/slate-tools/lib/tool/types';
import { deserialize as deserializeSlate } from '@kenchi/slate-tools/lib/utils';

import { GmailActionConfig } from '../../pageContext/actions/gmailAction';
import { DomainSettings } from '../../pageContext/domainSettings/DomainSettingsController';
import { PageData } from '../../pageContext/pageData/PageDataController';
import Renderer from '../../slate/Renderer';
import { VariableMap, VariableMapProvider } from '../useVariable';
import { ToolConfig } from './types';

const GmailAction: ToolConfig = {
  // We can't get rid of getIcon, needsExtension, and getPreview until we
  // have a replacement for them.
  getIcon() {
    return faMailBulk;
  },

  needsExtension() {
    return true;
  },

  getPreview({ data }: { data: SlateConfig }, variableMap: VariableMap) {
    if (!data) {
      return null;
    }
    return (
      <VariableMapProvider value={variableMap}>
        <Renderer contents={deserializeSlate(data)} />
      </VariableMapProvider>
    );
  },

  // TODO: Remove this level of indirection and have callers explicitly call runAction
  async execute(
    messageRouter: KenchiMessageRouter<'app' | 'hud'>,
    pageDataController: PageData,
    _domainSettings: DomainSettings | null,
    variableMap: VariableMap,
    configuration: GmailActionConfig
  ) {
    return pageDataController.runAction('gmailAction', {
      configuration: { ...configuration, variableMap },
    });
  },
};

export default GmailAction;
