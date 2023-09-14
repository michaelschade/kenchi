import getMessageRouter from '../getMessageRouter';
import { injectStylesheet } from '../utils';
import {
  compileAllSegments,
  getSearchTime,
  getXPathSegments,
  minimizeSegments,
} from './xpath';

const router = getMessageRouter();

injectStylesheet(`
  .kenchi-selected {
    box-shadow: 0 0 0 0.2rem rgba(220,53,69,.5) !important;
    transition: none !important;
    cursor: crosshair !important;
  }

  .kenchi-focus {
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25) !important;
  }

  .kenchi-focus-transition {
    transition: box-shadow 0.15s ease-in-out !important;
  }
`);

const ignoreElement = (elem: HTMLElement) => elem.closest('#kenchi-iframe');

const onMouseOver = (e: MouseEvent) => {
  const elem = e.target as HTMLElement;
  if (ignoreElement(elem)) {
    return;
  }

  elem.classList.add('kenchi-selected');
};

const onMouseOut = (e: MouseEvent) => {
  const elem = e.target as HTMLElement;
  if (ignoreElement(elem)) {
    return;
  }

  elem.classList.remove('kenchi-selected');
};

router.addCommandHandler(
  'app',
  'domPicker:focus',
  async ({ xpath }: { xpath: string }) => {
    const res = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE
    ).singleNodeValue;
    if (res) {
      const elem = res as HTMLElement;
      elem.classList.add('kenchi-focus', 'kenchi-focus-transition');
    }
  }
);

router.addCommandHandler('app', 'domPicker:cancelFocus', async ({ xpath }) => {
  const res = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
  if (res) {
    const elem = res as HTMLElement;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'box-shadow') {
        elem.classList.remove('kenchi-focus-transition');
        elem.removeEventListener('transitionend', onEnd);
      }
    };
    elem.addEventListener('transitionend', onEnd);
    elem.classList.remove('kenchi-focus');
  }
});

const onClick = async (e: MouseEvent) => {
  const elem = e.target as HTMLElement;
  if (ignoreElement(elem)) {
    return;
  }

  e.preventDefault();
  e.stopImmediatePropagation();
  onMouseOut(e);
  unregisterListeners();

  const segments = getXPathSegments(elem);
  const fullXPath = compileAllSegments(segments);
  const searchTime = getSearchTime(segments);

  router.sendCommand('app', 'domPickerSelected', { fullXPath, searchTime });
  const minimizedXPath = await minimizeSegments(segments, searchTime);
  router.sendCommand('app', 'domPickerFinished', { minimizedXPath });
};

const block = (e: Event) => {
  e.preventDefault();
  e.stopImmediatePropagation();
};

const unregisterListeners = () => {
  window.removeEventListener('mouseover', onMouseOver);
  window.removeEventListener('mouseout', onMouseOut);
  window.removeEventListener('click', onClick, { capture: true });
  window.removeEventListener('submit', block, { capture: true });
};

router.addCommandHandler('app', 'domPicker:start', async () => {
  window.addEventListener('mouseover', onMouseOver);
  window.addEventListener('mouseout', onMouseOut);
  window.addEventListener('click', onClick, { capture: true });
  window.addEventListener('submit', block, { capture: true });
});

router.addCommandHandler('app', 'domPicker:cancel', async () => {
  unregisterListeners();
});
