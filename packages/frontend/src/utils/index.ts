import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { MessageRouterError } from '@michaelschade/kenchi-message-router';

export * from './extension';

export function isTest() {
  return process.env.REACT_APP_ENV === 'test';
}

export function isDevelopment() {
  return process.env.REACT_APP_ENV === 'development';
}

export function safeURL(url: string): URL | null {
  try {
    return new URL(url);
  } catch {}
  return null;
}

export function isMessageRouterErrorType(error: unknown, type: string) {
  // TODO: consolidate on error.details.type when everyone's on message-router v0.0.12
  if (!(error instanceof MessageRouterError)) {
    return false;
  }
  return (
    (error?.details?.error || error?.details?.type || error?.message) === type
  );
}

// We could use tldjs to properly get the tld, but that involved importing a
// 150KB list of TLDs. Let's be naive for now since there's no real security
// risk in our use.
export function getDomain(host: string) {
  const parts = host.split('.');
  parts.shift();
  // Don't return "com"
  if (parts.length <= 1) {
    return host;
  } else {
    return parts.join('.');
  }
}

function throwUnlessSecurityError(e: unknown) {
  if (!(e instanceof Error) || e.name !== 'SecurityError') {
    throw e;
  }
}

export function forgivingSessionSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch (e) {
    throwUnlessSecurityError(e);
  }
}

export function forgivingSessionGet(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch (e) {
    throwUnlessSecurityError(e);
  }
  return null;
}

export function forgivingLocalSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    throwUnlessSecurityError(e);
  }
}

export function forgivingLocalGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    throwUnlessSecurityError(e);
  }
  return null;
}

export function pluralize(num: number, word: string, plural?: string) {
  if (num === 1) {
    return `${num} ${word}`;
  } else {
    plural = plural || `${word}s`;
    return `${formatNumber(num)} ${plural}`;
  }
}

export function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function randomString(length: number) {
  let str = '';
  for (let i = 0; i < length; i += 11) {
    str += Math.random()
      .toString(36)
      .substring(2, length - i + 2);
  }
  return str;
}

export function filterNullOrUndefined<T>(
  v: T
): v is Exclude<T, null | undefined> {
  return v !== null && v !== undefined;
}

export const faKenchiCity: IconDefinition = {
  prefix: 'fas',
  iconName: 'file-invoice',
  icon: [
    640,
    512,
    [],
    'f570',
    'M616 192H480V24C480 10.74 469.26 0 456 0H312C298.74 0 288 10.74 288 24V96H24C10.74 96 0 106.74 0 120V480C0 497.67 14.33 512 32 512H480H608C625.67 512 640 497.67 640 480V216C640 202.74 629.25 192 616 192ZM128 404C128 410.63 122.63 416 116 416H76C69.37 416 64 410.63 64 404V364C64 357.37 69.37 352 76 352H116C122.63 352 128 357.37 128 364V404ZM128 308C128 314.63 122.63 320 116 320H76C69.37 320 64 314.63 64 308V268C64 261.37 69.37 256 76 256H116C122.63 256 128 261.37 128 268V308ZM128 212C128 218.63 122.63 224 116 224H76C69.37 224 64 218.63 64 212V172C64 165.37 69.37 160 76 160H116C122.63 160 128 165.37 128 172V212ZM256 404C256 410.63 250.63 416 244 416H204C197.37 416 192 410.63 192 404V364C192 357.37 197.37 352 204 352H244C250.63 352 256 357.37 256 364V404ZM256 308C256 314.63 250.63 320 244 320H204C197.37 320 192 314.63 192 308V268C192 261.37 197.37 256 204 256H244C250.63 256 256 261.37 256 268V308ZM256 212C256 218.63 250.63 224 244 224H204C197.37 224 192 218.63 192 212V172C192 165.37 197.37 160 204 160H244C250.63 160 256 165.37 256 172V212ZM409 508H359C359 508 359 452.63 359 446C359 439.37 364.37 434 371 434H397C403.63 434 409 439.37 409 446V508ZM416 212C416 218.63 410.63 224 404 224H364C357.37 224 352 218.63 352 212V172C352 165.37 357.37 160 364 160H404C410.63 160 416 165.37 416 172V212ZM416 116C416 122.63 410.63 128 404 128H364C357.37 128 352 122.63 352 116V76C352 69.37 357.37 64 364 64H404C410.63 64 416 69.37 416 76V116ZM576 404C576 410.63 570.63 416 564 416H524C517.37 416 512 410.63 512 404V364C512 357.37 517.37 352 524 352H564C570.63 352 576 357.37 576 364V404ZM576 308C576 314.63 570.63 320 564 320H524C517.37 320 512 314.63 512 308V268C512 261.37 517.37 256 524 256H564C570.63 256 576 261.37 576 268V308Z',
  ],
};

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
