export const DEFAULT_STORAGE_KEY = 'defaultSpace';
export const magicSpaces: Record<string, { urlId: string; name: string }> = {
  __ALL__: { urlId: 'all', name: 'Show everything' },
  __PRIVATE__: { urlId: 'private', name: 'Private' },
};

export const getSpaceUrl = (
  id?: string | null,
  storageKey: string = DEFAULT_STORAGE_KEY
) => {
  const lookupId = id || getSavedSpaceId(storageKey);

  return `/spaces/${magicSpaces[lookupId]?.urlId || lookupId}`;
};

export const getSavedSpaceId = (storageKey: string = DEFAULT_STORAGE_KEY) => {
  return window.localStorage.getItem(storageKey) || '__ALL__';
};

export const saveSpaceId = (
  id: string,
  storageKey: string = DEFAULT_STORAGE_KEY
) => {
  window.localStorage.setItem(storageKey, id);
};
