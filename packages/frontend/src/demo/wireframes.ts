import { GmailWireframe } from './GmailWireframe';
import { IntercomWireframe } from './IntercomWireframe';
import { ZendeskWireframe } from './ZendeskWireframe';

export type WireframeType = 'gmail' | 'intercom' | 'zendesk';
type Wireframe = {
  name: string;
  hostname: string;
  Component: React.FC;
};

export const wireframes: Record<WireframeType, Wireframe> = {
  gmail: {
    name: 'Gmail',
    hostname: 'mail.google.com',
    Component: GmailWireframe,
  },
  intercom: {
    name: 'Intercom',
    hostname: 'app.intercom.com',
    Component: IntercomWireframe,
  },
  zendesk: {
    name: 'Zendesk',
    hostname: 'company.zendesk.com',
    Component: ZendeskWireframe,
  },
};

export const wireframeTypes: WireframeType[] = Object.keys(
  wireframes
) as unknown as WireframeType[];
