export type RecordingNetworkRequest = {
  id: string;
  startedAt: number;
  completedAt: number;
  url: string;
  method: string;
  credentials: 'include' | 'omit';
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  originalStatus: number;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
};

export type InsertionPath =
  | { type: 'fallback'; commands: InsertionPath[] }
  | { type: 'nest'; commands: InsertionPath[] }
  | { type: 'xpath'; xpath: string }
  | { type: 'querySelector'; value: string }
  | { type: 'shadowRoot' | 'contentDocument' };

export type IntercomTag = { id: string; name: string };
