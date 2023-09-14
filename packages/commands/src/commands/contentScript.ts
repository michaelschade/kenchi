import { InsertionPath } from '../sharedTypes';
import { Conforms, ProposeNewSnippetArgs } from './types';

type ContentScript = Conforms<{
  'system:ready': {
    origin: 'pageScript';
    args: {};
    resp: void;
  };

  insertText: {
    origin: 'hud' | 'app';
    args: {
      data: { html?: string; text: string };
      path: InsertionPath | null;
      useSelection: boolean;
    };
    resp: { success: boolean };
  };

  injectScript: {
    origin: 'hud' | 'app';
    args: {
      name: string;
    };
    resp: void;
  };

  applyStyles: {
    origin: 'app';
    args: {
      setBodyClasses?: string[];
      setIframeClasses?: string[];
      setStyle?: string;
    };
    resp: void;
  };

  ensureSidebarInjected: {
    origin: 'background';
    args: {};
    resp: void;
  };

  proposeNewSnippet: {
    origin: 'pageScript' | 'background';
    args: ProposeNewSnippetArgs;
    resp: void;
  };

  report: {
    origin: 'pageScript';
    args: { message: string; extra?: Record<string, unknown> };
    resp: void;
  };

  confetti: {
    origin: 'app';
    args: {};
    resp: void;
  };

  open: {
    origin: 'app';
    args: {};
    resp: void;
  };

  close: {
    origin: 'app';
    args: {};
    resp: void;
  };

  gmailGetActive: {
    origin: 'background';
    args: {};
    resp: Record<string, unknown>;
  };

  'gmail:requestVariables': {
    origin: 'app' | 'hud';
    args: {};
    resp: void;
  };

  'gmail:setSubject': {
    origin: 'app' | 'hud';
    args: { subject: string; onlyCompose: boolean };
    resp: { success: boolean | null };
  };

  'gmail:setRecipients': {
    origin: 'app' | 'hud';
    args: { to?: string[]; cc?: string[]; bcc?: string[] };
    resp: { success: boolean };
  };

  'gmail:addLabel': {
    origin: 'app' | 'hud';
    args: { label: string };
    resp: { success: boolean };
  };
}>;

export default ContentScript;
