import { useLocalStorage } from '@rehooks/local-storage';

type PreparedImportState =
  | {
      state: 'pending';
      message?: string;
    }
  | { state: 'error'; message: string }
  | { state: 'complete'; url: string };

export const usePreparedImport = (): [
  PreparedImportState,
  (newState: PreparedImportState) => void
] => {
  const [state, setState] = useLocalStorage<PreparedImportState>(
    'preparedImportState'
  );
  return [state || { state: 'pending', message: 'Starting import…' }, setState];
};
