import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';

import { KenchiMessageRouter } from '@kenchi/commands';
import Result from '@kenchi/shared/lib/Result';

import { DomainSettings } from '../../pageContext/domainSettings/DomainSettingsController';
import { PageData } from '../../pageContext/pageData/PageDataController';
import { VariableMap } from '../useVariable';

export type RunLog = {
  stepIndex: number;
  name: string;
  timestamp: number;
  snapshot?: { location: string; html: string };
};

export type ToolRunFailure = {
  message: string;
  runLog?: RunLog[];
};

export interface ToolConfig {
  getIcon(): IconDefinition;
  needsExtension(): boolean;
  getPreview(
    configuration: Record<string, any>,
    variableMap: VariableMap
  ): React.ReactNode;
  execute(
    messageRouter: KenchiMessageRouter<'app' | 'hud'>,
    pageDataController: PageData,
    domainSettings: DomainSettings | null,
    variableMap: VariableMap,
    configuration: Record<string, unknown>
  ): Promise<Result<boolean, ToolRunFailure>>;
}
