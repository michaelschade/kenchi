export function lighterLogger(
  level: 'log' | 'debug',
  msg: string,
  details?: {}
) {
  if (level === 'debug') {
    return;
  }
  if (details) {
    console.debug(msg, details);
  } else {
    console.debug(msg);
  }
}

export function injectStylesheet(contents?: string | null) {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  const styleParent = document.querySelector('head') || document.body;
  if (contents) {
    style.textContent = contents;
  }
  styleParent.appendChild(style);
  return style;
}

export function isEditable(node: HTMLElement | null) {
  if (!node) {
    return false;
  }

  return node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA';
}

// developer.mozilla.org/en-US/docs/Web/API/Event/Event
export function sendEvent(
  selector: string,
  eventName: string,
  options: { bubbles?: boolean; cancelable?: boolean; composed?: boolean } = {
    bubbles: true,
  }
): boolean {
  const element = document.querySelector(selector);
  if (!element) {
    return false;
  }
  return element.dispatchEvent(new Event(eventName, options));
}

// Derived from https://github.com/brockwhittaker/BitArray.js/blob/master/bits.js
//   bkrausz: Can you confirm that your BitArray is licensed in some permissive open source thingie?
//   brock: i can give you explicit permission if that works
//   brock: I don’t think it actually has a license
//   bkrausz: It doesn’t. Permission to use/derive/change without attribution or restriction?
//   brock: yep go for it
export class BitArray {
  // The BitArray is a simple bit flag implementation that utilizes standard arrays
  // (for expandability) and Uint32Array types for memory efficiency.
  // Every value is assumed either true or false (inclusive of uninitialized values),
  // however a warning is given if a particular block does not exist yet.
  private bin: Uint32Array;
  private binSize: number;

  constructor(entries: number) {
    this.binSize = Math.ceil(entries / 32);
    this.bin = new Uint32Array(this.binSize);
  }

  // get a flag by its ID.
  get(id: number) {
    // the actual Uint32Array the boolean exists within.
    // secondary array index.
    const slot = ~~(id / 32);

    // id & 31 is equivalent to id % 32
    // 1 << n is equal to 2 ^ x
    //
    // for any mod n where n = 2^i, modulo is simply keeping the lower order
    // bits 0 through i - 1
    //     00100100 | 36
    // AND 00011111 | 31
    // ==> 00000100 | 4
    return !!(this.bin[slot] & (1 << (id & 31)));
  }

  // set a Boolean value into an ID.
  set(id: number, val: boolean) {
    const slot = ~~(id / 32);

    if (val) {
      // if the value is truthy, use |= which will OR update the flag.
      //     01010001
      //  OR 00100000
      // ==> 01110001
      this.bin[slot] |= 1 << (id & 31);
    } else {
      // if the value is falsy, use &= ~FLAG to negate the flag.
      //     01010001
      // AND 11101111
      // ==> 01000001
      this.bin[slot] &= ~(1 << (id & 31));
    }
  }

  // flip a bit to the opposite of its current value.
  // this will initialize flags that don't exist yet and set them to "true".
  flip(id: number) {
    const slot = ~~(id / 32);

    // flip the particular flag.
    //      01000100
    // FLIP 00000100
    // ===> 01000000
    this.bin[slot] ^= 1 << (id & 31);

    return this.bin[slot];
  }

  count() {
    let count = 0;
    this.bin.forEach((n) => {
      n = n - ((n >> 1) & 0x55555555);
      n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
      count += (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
    });
    return count;
  }

  clone() {
    const rtn = new BitArray(this.binSize * 32);
    rtn.bin.set(this.bin);
    return rtn;
  }
}
