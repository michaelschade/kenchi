export type App = Record<string, unknown>;
export type Runtime = {
  location: string;
  isActive: boolean;
  launchApp: (installation: any) => Promise<{ app: App }>;
  [key: string]: unknown;
};

// Totally non-exhaustive, but this sketches out a little of the shape of the Zendesk API objects we use
export type Assignee = {
  group: Group;
  user: User | null;
};
export type Group = { id: number; name: string };
export type User = { id: number; groups: Group[] };
export type Ticket = {
  assignee: Assignee;
  tags: string[];
};
