import { CommandDetails } from '@michaelschade/kenchi-message-router';
import Result from '@kenchi/shared/lib/Result';

import { IntercomTag } from '../sharedTypes';
import { AutomationResp, AutomationWithTimeoutArgs, Conforms } from './types';

interface Automation extends CommandDetails {
  origin: 'app';
  args: { xpath: string };
  resp: AutomationResp;
}

interface AutomationWithTimeout extends CommandDetails {
  origin: 'app';
  args: AutomationWithTimeoutArgs;
  resp: AutomationResp;
}

type ZendeskTag = { count: number; name: string };
interface ZendeskMutateTags extends CommandDetails {
  origin: 'app' | 'hud';
  args: { tags: string[] };
  resp: Result<string[], string>;
}
type PageScript = Conforms<{
  'automation:waitForRemoved': AutomationWithTimeout;
  'automation:waitFor': AutomationWithTimeout;
  'automation:focus': Automation;
  'automation:click': Automation;
  'automation:checkboxCheck': Automation;
  'automation:checkboxUncheck': Automation;

  'domPicker:start': { origin: 'app'; args: {}; resp: void };
  'domPicker:cancel': { origin: 'app'; args: {}; resp: void };
  'domPicker:focus': { origin: 'app'; args: { xpath: string }; resp: void };
  'domPicker:cancelFocus': {
    origin: 'app';
    args: { xpath: string };
    resp: void;
  };

  domReaderClear: { origin: 'app'; args: {}; resp: void };
  domReaderListen: {
    origin: 'app';
    args: {
      id: string;
      xpath: string;
      resultType: 'number' | 'string' | 'boolean';
    };
    resp: void;
  };

  domSnapshotCapture: {
    origin: 'app';
    args: {};
    resp: {
      location: string;
      html: string;
      styles?: {
        disabled: boolean;
        href: string | null;
        media: string[];
        rules: string[];
      }[];
      error?: string;
    };
  };

  emberCommand: {
    origin: 'app' | 'hud';
    args: Record<string, unknown>;
    resp: void;
  };

  frontInit: { origin: 'app' | 'hud'; args: {}; resp: void };

  'hud:hide': { origin: 'hud'; args: {}; resp: void };
  'hud:prepareRun': { origin: 'hud'; args: {}; resp: void };
  'hud:hideAfterRun': { origin: 'hud'; args: {}; resp: void };
  'hud:updateHeight': { origin: 'hud'; args: { height: number }; resp: void };

  intercomApplyTags: {
    origin: 'app' | 'hud';
    args: { adminId: string; conversationPartId: string; tagIds: string[] };
    resp: { success: boolean };
  };

  intercomFetch: {
    origin: 'app' | 'hud';
    args: {
      resource: RequestInfo;
      init?: RequestInit | undefined;
    };
    resp: Result<Record<string, unknown>, string>;
  };

  intercomAddTagsToCurrentConversation: {
    origin: 'app' | 'hud';
    args: { tagData: IntercomTag[] };
    resp: Result<IntercomTag[], string>;
  };

  prepareForInsertion: { origin: 'app' | 'hud'; args: {}; resp: void };

  zendeskGetMacros: {
    origin: 'app' | 'hud';
    args: {};
    resp: Result<any[], { message: string; partial: any[] }>;
  };

  zendeskAssignMe: {
    origin: 'app' | 'hud';
    args: {};
    resp: Result<
      { group: Record<string, unknown>; user: Record<string, unknown> | null },
      string
    >;
  };

  zendeskGetActive: {
    origin: 'app' | 'hud';
    args: {};
    resp: {
      currentUser?: Record<string, any>;
      ticket?: Record<string, any>;
    };
  };

  zendeskExtractTags: {
    origin: 'app';
    args: {};
    resp: Result<ZendeskTag[], { message: string; partial?: ZendeskTag[] }>;
  };

  zendeskAddTags: ZendeskMutateTags;
  zendeskRemoveTags: ZendeskMutateTags;
  zendeskSetTags: ZendeskMutateTags;
  zendeskSetTicketStatus: {
    origin: 'app' | 'hud';
    args: { ticketStatus: string };
    resp: Result<string, string>;
  };
}>;

export default PageScript;
