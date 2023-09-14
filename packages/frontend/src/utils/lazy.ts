import { lazy as reactLazy } from 'react';

import type { History } from 'history';

import { reloadWithLocation } from './history';

// Only use this in ChunkLoadErrors, for anything else use useHistory.
let historyForChunkLoadErrors: History<unknown> | null = null;

export function initLazy(history: History<unknown>) {
  historyForChunkLoadErrors = history;
}

// Wraps React.lazy in a reload if the chunk fails to load
export default function lazy<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  const safeImporter = async () => {
    try {
      const rtn = await importer();
      return rtn;
    } catch (e) {
      if (e instanceof Error && e.name === 'ChunkLoadError') {
        console.log(
          'Reload due to recently chunk error: another tab probably reloaded the service worker'
        );
        if (
          historyForChunkLoadErrors &&
          reloadWithLocation(historyForChunkLoadErrors?.location)
        ) {
          // Never returns, we're navigating the page anyway
          return new Promise(() => {}) as Promise<{ default: T }>;
        }
      }
      throw e;
    }
  };
  return reactLazy(safeImporter);
}
