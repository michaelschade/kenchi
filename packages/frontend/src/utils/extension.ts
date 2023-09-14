import { parse } from 'qs';

export function isExtension() {
  try {
    return window.self !== window.parent;
  } catch (e) {
    return true;
  }
}

const VERSION_REGEX = /^0\.\d\d$/;
// minVersion is inclusive, maxVersion is exclusive
export function isExtensionVersionRange(
  minVersion: string,
  maxVersion?: string
) {
  if (
    !minVersion.match(VERSION_REGEX) ||
    (maxVersion && !maxVersion.match(VERSION_REGEX))
  ) {
    throw new Error('Invalid version format');
  }
  const query = parse(window.location.search.substring(1));
  if (!query.version) {
    // Old versions of the background script don't pass this
    return false;
  }
  const version = query.version as string;
  if (minVersion > version) {
    return false;
  }
  if (maxVersion && maxVersion <= version) {
    return false;
  }
  return true;
}
