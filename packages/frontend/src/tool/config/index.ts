import Automation from './Automation';
import CustomThingTemplate from './CustomThingTemplate';
import GmailAction from './GmailAction';
import OpenURLs from './OpenURLs';
import SetClipboard from './SetClipboard';
import { ToolConfig } from './types';

const config: Record<string, ToolConfig> = {
  Automation,
  OpenURLs,
  GmailAction,
  SetClipboard,
  CustomThingTemplate,
};

export default config;
