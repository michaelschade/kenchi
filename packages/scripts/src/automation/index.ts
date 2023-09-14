/* eslint-disable no-throw-literal */
// TODO: fix this lint disable. Throughout this file we throw object literals
// instead of Error objects.
import wait from 'waait';

import getMessageRouter from '../getMessageRouter';

const router = getMessageRouter();

const BLINK_DATA_ATTR = 'data-kenchi-em';

const boxShadow = async (elem: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const origTransition = elem.style.transition;
    const origBoxShadow = elem.style.boxShadow;
    const removeShadow = (e: TransitionEvent) => {
      if (e.propertyName === 'box-shadow') {
        if (elem.hasAttribute(BLINK_DATA_ATTR)) {
          elem.removeAttribute(BLINK_DATA_ATTR);
          if (origBoxShadow) {
            elem.style.boxShadow = origBoxShadow;
          } else {
            elem.style.removeProperty('box-shadow');
          }
        } else {
          elem.removeEventListener('transitionend', removeShadow);
          if (origTransition) {
            elem.style.transition = origTransition;
          } else {
            elem.style.removeProperty('transition');
          }
          resolve();
        }
      }
    };
    elem.setAttribute(BLINK_DATA_ATTR, 'true');
    elem.addEventListener('transitionend', removeShadow);
    elem.style.transition = 'box-shadow 0.5s';
    elem.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,.25)';
  });
};

const detectChanges = async (run: () => void) => {
  let changes = false;
  const observer = new MutationObserver((_mutationsList, observer) => {
    changes = true;
    observer.disconnect();
  });
  observer.observe(document.body, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
  run();
  await wait();
  observer.disconnect();
  return changes;
};

const evaluateElementXPath = (xpath: string): HTMLElement | null => {
  try {
    const res = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    if (res) {
      return res as HTMLElement;
    } else {
      return null;
    }
  } catch (e) {
    if (!(e instanceof Error)) {
      throw e;
    } else if (
      e.name === 'SyntaxError' &&
      e.message.indexOf('not a valid XPath expression') !== -1
    ) {
      throw { error: 'invalidXPath' };
    } else {
      throw { error: 'unexpectedError', message: e.message };
    }
  }
};

// https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
const isVisible = (elem: HTMLElement) => {
  return !!(
    elem.offsetWidth ||
    elem.offsetHeight ||
    elem.getClientRects().length
  );
};

const waitForImpl = (
  xpath: string,
  timeout: number,
  onRemove: boolean
): Promise<{ success: boolean }> => {
  const start = Date.now();
  let interval: number;
  return new Promise<{ success: boolean }>((resolve, reject) => {
    const check = () => {
      const res = evaluateElementXPath(xpath);
      if (Date.now() - timeout > start) {
        reject({ error: 'timeout' });
      }

      let success = false;
      if (onRemove) {
        if (!res || !isVisible(res)) {
          success = true;
        }
      } else {
        if (res && isVisible(res)) {
          success = true;
        }
      }
      if (success) {
        resolve({ success });
      }
      return success;
    };
    if (!check()) {
      interval = window.setInterval(check, 100);
    }
  })
    .then((res) => {
      if (interval) {
        window.clearInterval(interval);
      }
      return res;
    })
    .catch((e) => {
      if (interval) {
        window.clearInterval(interval);
      }
      if (e instanceof Error) {
        throw { error: 'unexpectedError', message: e.message };
      } else {
        throw e;
      }
    });
};

const waitFor = (
  xpath: string,
  timeout: number,
  async: boolean | undefined,
  id: string | undefined,
  onRemove: boolean
): Promise<{ success: boolean }> => {
  if (async) {
    const responseCommand = `automation:waitFor${
      onRemove ? 'Removed' : ''
    }Response` as const;
    waitForImpl(xpath, timeout, onRemove)
      .then(({ success }) => {
        router.sendCommand('app', responseCommand, { success, id });
      })
      .catch((error) => {
        router.sendCommand('app', responseCommand, {
          success: false,
          id,
          error,
        });
      });
    return Promise.resolve({ success: true });
  } else {
    return waitForImpl(xpath, timeout, onRemove);
  }
};

router.addCommandHandler('app', 'automation:focus', async ({ xpath }) => {
  const elem = evaluateElementXPath(xpath);
  if (!elem) {
    throw { error: 'elementNotFound' };
  }

  elem.focus();

  // Do not wait for the box shadow transition to complete
  boxShadow(elem);

  return { success: true };
});

router.addCommandHandler(
  'app',
  'automation:waitForRemoved',
  ({ xpath, timeout, async, id }) => {
    // Old versions aren't async
    return waitFor(xpath, timeout, async, id, true);
  }
);

router.addCommandHandler(
  'app',
  'automation:waitFor',
  ({ xpath, timeout, async, id }) => {
    return waitFor(xpath, timeout, async, id, false);
  }
);

router.addCommandHandler('app', 'automation:click', async ({ xpath }) => {
  const elem = evaluateElementXPath(xpath);
  if (!elem) {
    throw { error: 'elementNotFound' };
  }

  const hasChanges = await detectChanges(() => elem.click());

  // Do not wait for the box shadow transition to complete
  boxShadow(elem);

  return { success: true, hasChanges };
});

router.addCommandHandler(
  'app',
  'automation:checkboxCheck',
  async ({ xpath }) => {
    const elem = evaluateElementXPath(xpath) as HTMLInputElement;
    if (!elem) {
      throw { error: 'elementNotFound' };
    } else if (elem.type !== 'checkbox') {
      throw { error: 'invalidElementType' };
    }

    const hasChanges = await detectChanges(() => {
      if (elem.checked === false) {
        elem.click();
      }
    });

    // Do not wait for the box shadow transition to complete
    boxShadow(elem);

    return { success: true, hasChanges };
  }
);

router.addCommandHandler(
  'app',
  'automation:checkboxUncheck',
  async ({ xpath }) => {
    const elem = evaluateElementXPath(xpath) as HTMLInputElement;
    if (!elem) {
      throw { error: 'elementNotFound' };
    } else if (elem.type !== 'checkbox') {
      throw { error: 'invalidElementType' };
    }

    const hasChanges = await detectChanges(() => {
      if (elem.checked) {
        elem.click();
      }
    });

    // Do not wait for the box shadow transition to complete
    boxShadow(elem);

    return { success: true, hasChanges };
  }
);
