// Localstorage isn't persisting within a test and I'm not sure why.

import debounce from 'lodash/debounce';

import DomainSettings from './DomainSettings';
import SessionTracker, {
  RawSessionEntry,
  SESSION_DATA_KEY,
  SessionEntry,
} from './SessionTracker';

jest.mock('lodash/debounce');
const mockDebounce = debounce as unknown as jest.Mock<typeof debounce>;

jest.mock('./DomainSettings');
const getDomainSettings = () => {
  const ds = new DomainSettings(() => {}) as jest.Mocked<DomainSettings>;
  ds.getForHost.mockImplementation((domain) => {
    return {
      inject: null,
      injectHud: null,
      injectSidebar: null,
      isGmail: null,
      sidebarOpen: null,
      session: domain === 'tracked',
    };
  });
  return ds;
};

const getTracker = () => {
  const tracker = new SessionTracker(getDomainSettings());
  // @ts-ignore
  tracker.sendEntries = jest.fn();
  return tracker;
};

let globalTimestampIndex = 1;

const expectSessionData = () => {
  const val = window.localStorage.getItem(SESSION_DATA_KEY);
  if (val) {
    return expect(JSON.parse(val));
  } else {
    return expect(val);
  }
};

beforeEach(() => {
  mockDebounce.mockImplementation((fn) => {
    fn.flush = jest.fn();
    return fn;
  });

  window.localStorage.removeItem(SESSION_DATA_KEY);
});

type EntryTestInput = Omit<RawSessionEntry, 'timestamp' | 'data'> & {
  data?: RawSessionEntry['data'];
};
function entryTest(
  name: string,
  input: EntryTestInput[],
  expected: Partial<SessionEntry>[]
) {
  it(`[single instance] ${name}`, async () => {
    const tracker = getTracker();

    for (var i = 0; i < input.length; i++) {
      const entry = input[i];
      await tracker.handleEntry({
        timestamp: globalTimestampIndex++,
        data: {},
        ...entry,
      });
    }
    // @ts-ignore
    const producedEntries = tracker.pendingEntries;
    expect(producedEntries).toStrictEqual(
      expected.map((expectedEntry) => expect.objectContaining(expectedEntry))
    );
  });

  it(`[multiple instances] ${name}`, async () => {
    let allProducedEntries: SessionEntry[] = [];
    for (var i = 0; i < input.length; i++) {
      const entry = input[i];
      const tracker = getTracker();

      await tracker.handleEntry({
        timestamp: globalTimestampIndex++,
        data: {},
        ...entry,
      });

      // @ts-ignore
      const producedEntries = tracker.pendingEntries;
      allProducedEntries.push(...producedEntries);
    }
    expect(allProducedEntries).toStrictEqual(
      expected.map((expectedEntry) => expect.objectContaining(expectedEntry))
    );
  });
}

it('sets and clears local storage', async () => {
  const tracker = new SessionTracker(getDomainSettings());

  await tracker.handleEntry({
    timestamp: globalTimestampIndex++,
    action: 'windowFocus',
    windowId: 1,
    data: {},
  });
  expectSessionData().not.toBe(null);
  await tracker.handleEntry({
    timestamp: globalTimestampIndex++,
    action: 'startup',
    data: {},
  });
  expectSessionData().toBe(null);
});

entryTest(
  'ignores untracked events',
  [
    { action: 'startup' },
    { action: 'windowFocus', windowId: 1 },
    { action: 'tabCreate', windowId: 1, tabId: 1 },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://nottracked/', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://nottracked2/', active: true },
    },
    { action: 'tabCreate', windowId: 1, tabId: 2 },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 2,
      data: { url: 'http://nottracked3/', active: true },
    },
    { action: 'tabActivate', windowId: 1, tabId: 1 },
  ],
  []
);

entryTest(
  'tracks basic tracked urls',
  [
    { action: 'startup' },
    { action: 'tabCreate', windowId: 1, tabId: 1 },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/abc', active: true },
    },
  ],
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/abc', active: true },
    },
  ]
);

entryTest(
  'collapses untracked urls',
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://nottracked/2', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://nottracked/3', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/4', active: true },
    },
  ],
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: '<NOTTRACKED>', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/4', active: true },
    },
  ]
);

entryTest(
  'collapses untracked tabs',
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 2,
      data: { url: 'http://nottracked/2', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 3,
      data: { url: 'http://nottracked/3', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 4,
      data: { url: 'http://tracked/4', active: true },
    },
    { action: 'tabActivate', windowId: 1, tabId: 3 },
    { action: 'tabActivate', windowId: 1, tabId: 2 },
    { action: 'tabActivate', windowId: 1, tabId: 1 },
  ],
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: -1,
      data: { url: '<NOTTRACKED>', active: true },
    },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 4,
      data: { url: 'http://tracked/4', active: true },
    },
    { action: 'tabActivate', windowId: 1, tabId: -1 },
    { action: 'tabActivate', windowId: 1, tabId: 1 },
  ]
);

entryTest(
  'collapses untracked windows',
  [
    { action: 'windowFocus', windowId: 1 },
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 2,
      tabId: 2,
      data: { url: 'http://nottracked/2', active: true },
    },
    {
      action: 'urlChange',
      windowId: 3,
      tabId: 3,
      data: { url: 'http://nottracked/3', active: true },
    },
    {
      action: 'urlChange',
      windowId: 4,
      tabId: 4,
      data: { url: 'http://tracked/4', active: true },
    },
    { action: 'windowFocus', windowId: 3 },
    { action: 'windowFocus', windowId: 2 },
    { action: 'windowFocus', windowId: 1 },
  ],
  [
    {
      action: 'urlChange',
      windowId: 1,
      tabId: 1,
      data: { url: 'http://tracked/1', active: true },
    },
    {
      action: 'urlChange',
      windowId: 4,
      tabId: 4,
      data: { url: 'http://tracked/4', active: true },
    },
    { action: 'windowFocus', windowId: -1 },
    { action: 'windowFocus', windowId: 1 },
  ]
);
