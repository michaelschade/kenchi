import debounce from 'lodash/debounce';

import getMessageRouter from '../getMessageRouter';

const RESULT_TYPE = {
  number: XPathResult.NUMBER_TYPE,
  string: XPathResult.STRING_TYPE,
  boolean: XPathResult.BOOLEAN_TYPE,
};

const RESULT_GETTER: Record<string, (r: XPathResult) => any> = {
  number: (r) => r.numberValue,
  string: (r) => r.stringValue?.trim(),
  boolean: (r) => r.booleanValue,
};

type WatchEntry = {
  id: string;
  xpath: string;
  resultType: 'number' | 'string' | 'boolean';
};

let watchedXPaths: Record<string, WatchEntry> = {};

const router = getMessageRouter();

const handler = debounce(
  () => {
    const changes: Record<string, any> = {};
    Object.values(watchedXPaths).forEach(({ id, xpath, resultType }) => {
      try {
        const result = document.evaluate(
          xpath,
          document,
          null,
          RESULT_TYPE[resultType]
        );
        changes[id] = RESULT_GETTER[resultType](result);
      } catch (e) {}
    });
    router.sendCommand('app', 'domReaderUpdate', changes);
  },
  50,
  { maxWait: 1000 }
);
const observer = new MutationObserver(handler);

router.addCommandHandler(
  'app',
  'domReaderListen',
  async (message: {
    id: string;
    xpath: string;
    resultType: 'number' | 'string' | 'boolean';
  }) => {
    if (message.id in watchedXPaths) {
      throw new Error('alreadyListening');
    }
    if (Object.keys(watchedXPaths).length === 0) {
      observer.observe(document.body, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
    }
    watchedXPaths[message.id] = {
      id: message.id,
      xpath: message.xpath,
      resultType: message.resultType,
    };
    handler();
  }
);

router.addCommandHandler('app', 'domReaderClear', async () => {
  observer.disconnect();
  watchedXPaths = {};
});
