import { InsertionPath, KenchiMessageRouter } from '@kenchi/commands';

export interface HostInterfaceConstructor {
  new (messageRouter: KenchiMessageRouter<'contentScript'>): HostInterface;
}

export default interface HostInterface {
  init(sidebarEl: HTMLIFrameElement): Promise<boolean>; // Return true if injected
  open(): Promise<void>;
  close(): Promise<void>;
  insertText(
    data: { text: string; html?: string },
    lastFocus: HTMLElement | null,
    refocusContentEditable: (() => Promise<void>) | null,
    xpath: InsertionPath | null,
    useSelection: boolean
  ): Promise<boolean>;
}
