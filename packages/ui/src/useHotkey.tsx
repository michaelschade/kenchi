import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import last from 'lodash/last';

const GLOBAL_REGION = 0;

type KeyboardCallback = (e: KeyboardEvent, key: string) => void;

type HotkeyContextType = {
  regionStack: number[];
  enterRegion: () => () => void;
  addHotkey: (
    key: string,
    callback: KeyboardCallback,
    region: number
  ) => () => void;
};

const HotkeyContext = createContext<HotkeyContextType | null>(null);

const classNameMap: Record<string, string> = {
  ArrowUp: 'hotkeys-allow-up',
  ArrowDown: 'hotkeys-allow-down',
  Enter: 'hotkeys-allow-enter',
};
function stopCallback(e: KeyboardEvent) {
  const key = e.key;
  const target = e.target;
  if (key === 'Escape') {
    return false;
  } else if (
    target instanceof HTMLElement &&
    key in classNameMap &&
    target.classList.contains(classNameMap[key])
  ) {
    return false;
  } else if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.tagName === 'BUTTON' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

export const HotkeyProvider = ({
  trackEvent,
  children,
}: {
  trackEvent?: (key: string) => void;
  children: React.ReactNode;
}) => {
  const nextRegion = useRef(GLOBAL_REGION + 2);
  const allHotkeys = useRef<Record<string, [KeyboardCallback, number][]>>({});
  const regionStack = useRef([GLOBAL_REGION + 1]);

  const exitRegion = useCallback((regionId: number) => {
    if (regionStack.current[0] !== regionId) {
      console.error('Trying to exit non-current region');
      return;
    }
    regionStack.current.shift();
  }, []);

  const enterRegion = useCallback(() => {
    const regionId = nextRegion.current++;
    regionStack.current.unshift(regionId);
    return () => exitRegion(regionId);
  }, [exitRegion]);

  const runHotkey = useCallback(
    (e: KeyboardEvent) => {
      if (stopCallback(e)) {
        return;
      }

      const currentRegion = regionStack.current[0];
      const callbacksInRegion = (key: string) =>
        allHotkeys.current[key]?.filter(([, region]) => {
          return region === GLOBAL_REGION || region === currentRegion;
        }) || [];

      let key = e.key;
      if (key.length === 1) {
        key = key.toLowerCase();
      }
      let callbacks: [KeyboardCallback, number][] = callbacksInRegion(key);

      // Shift key shortcuts take precident
      if (e.shiftKey) {
        const newKey = `shift+${key}`;
        const newCallbacks = callbacksInRegion(newKey);
        if (newCallbacks.length > 0) {
          callbacks = newCallbacks;
          key = newKey;
        }
      }

      if (callbacks.length > 0) {
        trackEvent?.(key);
        // Only running the last one is a drop sketchy because the order can
        // change depending on the last `useEffect` call/rendering dependencies.
        // But is good enough for now.
        const callback = last(callbacks)?.[0];
        callback?.(e, key);
      }
    },
    [trackEvent]
  );

  useEffect(() => {
    document.addEventListener('keydown', runHotkey);
    return () => document.removeEventListener('keydown', runHotkey);
  }, [runHotkey]);

  const addHotkey = useCallback(
    (key: string, callback: KeyboardCallback, region: number) => {
      if (!allHotkeys.current[key]) {
        allHotkeys.current[key] = [];
      }
      allHotkeys.current[key].push([callback, region]);
      return () => {
        const idx = allHotkeys.current[key].findIndex(
          (hk) => hk[0] === callback && hk[1] === region
        );
        if (idx >= 0) {
          allHotkeys.current[key].splice(idx, 1);
        } else {
          console.warn('Unable to remove hotkey');
        }
      };
    },
    []
  );

  const prevContext = useContext(HotkeyContext);
  if (prevContext) {
    throw new Error('Cannot have multiple HotkeysRegionProviders');
  }

  return (
    <HotkeyContext.Provider
      value={{
        regionStack: regionStack.current,
        enterRegion,
        addHotkey,
      }}
    >
      {children}
    </HotkeyContext.Provider>
  );
};

export function useGlobalHotkey(key: string, callback: KeyboardCallback) {
  const hotkeyContext = useContext(HotkeyContext);
  if (!hotkeyContext) {
    throw new Error('No HotkeyContext');
  }

  const addHotkey = hotkeyContext.addHotkey;

  useEffect(
    () => addHotkey(key, callback, GLOBAL_REGION),
    [addHotkey, key, callback]
  );
}

export default function useHotkey(
  keys: string | string[],
  callback: KeyboardCallback
) {
  const hotkeyContext = useContext(HotkeyContext);
  if (!hotkeyContext) {
    throw new Error('No HotkeyContext');
  }

  const [initialRegion] = useState(hotkeyContext.regionStack[0]);
  const addHotkey = hotkeyContext.addHotkey;

  useEffect(() => {
    const keysArr = Array.isArray(keys) ? keys : [keys];
    const removeCallbacks = keysArr.map((key) =>
      addHotkey(key, callback, initialRegion)
    );
    return () => removeCallbacks.forEach((cb) => cb());
  }, [addHotkey, keys, callback, initialRegion]);
}

export const useHotkeyRegion = () => {
  const hotkeyContext = useContext(HotkeyContext);
  if (!hotkeyContext) {
    throw new Error('No HotkeyContext');
  }
  return hotkeyContext.enterRegion;
};
