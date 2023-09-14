import spaceFactory from '../test/factories/space';
import {
  DEFAULT_STORAGE_KEY,
  getSavedSpaceId,
  getSpaceUrl,
  saveSpaceId,
} from './spaceUrl';

const localStorage = global.localStorage;
beforeEach(() => localStorage.clear());

describe('getting the space URL', () => {
  it('returns the URL for specified ID', () => {
    const space = spaceFactory.build();
    expect(getSpaceUrl(space.staticId)).toEqual(`/spaces/${space.staticId}`);
  });

  it('returns the ID from storage when no ID is specified', () => {
    const space = spaceFactory.build();
    localStorage.setItem(DEFAULT_STORAGE_KEY, space.staticId);
    expect(getSpaceUrl(null)).toEqual(`/spaces/${space.staticId}`);
    expect(getSpaceUrl()).toEqual(`/spaces/${space.staticId}`);
  });

  it('returns the all spaces URL when no ID is saved', () => {
    expect(getSpaceUrl(null)).toEqual(`/spaces/all`);
  });

  it('can use a non-default storage key', () => {
    const space = spaceFactory.build();
    localStorage.setItem('differentStorageKey', space.staticId);
    expect(getSpaceUrl(null, 'differentStorageKey')).toEqual(
      `/spaces/${space.staticId}`
    );
  });

  it('returns the all spaces URL for the all spaces magic key', () => {
    expect(getSpaceUrl('__ALL__')).toEqual(`/spaces/all`);
  });

  it('returns the private space URL for the private space magic key', () => {
    expect(getSpaceUrl('__PRIVATE__')).toEqual(`/spaces/private`);
  });
});

describe('getting saved space ID', () => {
  it('returns the ID from storage', () => {
    const space = spaceFactory.build();
    localStorage.setItem(DEFAULT_STORAGE_KEY, space.staticId);
    expect(getSavedSpaceId()).toEqual(space.staticId);
  });

  it('returns all when no ID is saved', () => {
    expect(getSavedSpaceId()).toEqual('__ALL__');
  });

  it('can read from a non-default storage key', () => {
    const space = spaceFactory.build();
    localStorage.setItem('differentStorageKey', space.staticId);
    expect(getSavedSpaceId('differentStorageKey')).toEqual(space.staticId);
  });
});

describe('saving space ID', () => {
  it('saves the ID to a default key', () => {
    const space = spaceFactory.build();
    saveSpaceId(space.staticId);
    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toEqual(space.staticId);
  });

  it('allows specifying the storage key', () => {
    const space = spaceFactory.build();
    saveSpaceId(space.staticId, 'differentStorageKey');
    expect(localStorage.getItem('differentStorageKey')).toEqual(space.staticId);
  });
});
