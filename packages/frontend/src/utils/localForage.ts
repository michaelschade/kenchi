import localForage from 'localforage';

let instance: LocalForage | null = null;
export default function getLocalForage(): LocalForage {
  if (!instance) {
    instance = localForage.createInstance({
      storeName: 'kenchi',
      version: 2,
    });
    // @ts-ignore for debugging
    window.localForage = instance;
  }
  return instance;
}
