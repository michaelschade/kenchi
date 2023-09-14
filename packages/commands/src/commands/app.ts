import { CommandDetails } from '@michaelschade/kenchi-message-router';

import AppAndHud from './appAndHud';
import { AutomationResp, Conforms, ProposeNewSnippetArgs } from './types';

interface AutomationResponse extends CommandDetails {
  origin: 'pageScript';
  args: AutomationResp;
  resp: void;
}

interface BackgroundActionCommand extends CommandDetails {
  origin: 'background';
  args: { url: string; start?: number };
  resp: void;
}

type App = Conforms<{
  togglePressed: BackgroundActionCommand;
  activatePressed: BackgroundActionCommand;
  hidePressed: BackgroundActionCommand;

  'automation:waitForRemovedResponse': AutomationResponse;
  'automation:waitForResponse': AutomationResponse;

  domPickerSelected: {
    origin: 'pageScript';
    args: { fullXPath: string; searchTime: number };
    resp: void;
  };
  domPickerFinished: {
    origin: 'pageScript';
    args: { minimizedXPath: string | null };
    resp: void;
  };

  domReaderUpdate: {
    origin: 'pageScript';
    args: Record<string, unknown>;
    resp: void;
  };

  proposeNewSnippet: {
    origin: 'contentScript';
    args: ProposeNewSnippetArgs;
    resp: void;
  };
}> &
  AppAndHud;

export default App;
