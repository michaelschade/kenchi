// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// https://github.com/jsdom/jsdom/issues/1695
Element.prototype.scrollIntoView = () => {};

// Workaround because jsdom does not implement ResizeObserver
// https://github.com/radix-ui/primitives/issues/420#issuecomment-771615182
// We may be able to avoid this workaround entirely by moving to a full-featured headless
// browser rather than jsdom
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [
        {
          devicePixelContentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
          borderBoxSize: [{ inlineSize: 0, blockSize: 0 }],
          contentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
          contentRect: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => {},
          },
          target,
        },
      ],
      this
    );
  }
  unobserve() {}
  disconnect() {}
};

class FakeDOMRectImpl implements DOMRect {
  top: number = 0;
  left: number = 0;
  bottom: number = 0;
  right: number = 0;
  width: number = 0;
  height: number = 0;
  x: number = 0;
  y: number = 0;
  static fromRect(): DOMRect {
    return new FakeDOMRectImpl();
  }

  toJSON() {
    return JSON.stringify({
      top: this.top,
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
    });
  }
}

global.DOMRect = FakeDOMRectImpl;
// end workaround because jsdom does not implement ResizeObserver
