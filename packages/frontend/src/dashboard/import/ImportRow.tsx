import { CreateToolMutation } from '../../graphql/generated';
import { ImportEntry } from '../../importers';
import { ImportState } from './ImportPage';
import { ImportToggleRow } from './ImportToggleRow';
import { PromiseEntryState } from './useBatch';

type Props = {
  entry: ImportEntry;
  batchState:
    | PromiseEntryState<NonNullable<CreateToolMutation['modify']['tool']>>
    | undefined;
  importState: ImportState | undefined;
  onChange: () => void;
  checked: boolean;
  disabled: boolean;
};

export const ImportRow = ({
  entry,
  batchState,
  importState,
  onChange,
  checked,
  disabled,
}: Props) => {
  if (batchState) {
    return (
      <ImportToggleRow
        entry={entry}
        state={batchState.state}
        error={
          batchState.state === 'error'
            ? `Could not import: ${batchState.error.message}`
            : undefined
        }
        disabled
        checked={checked}
        toolUrl={
          batchState.state === 'complete'
            ? `/snippets/${batchState.result.staticId}`
            : undefined
        }
      />
    );
  }

  if (importState) {
    return (
      <ImportToggleRow
        entry={entry}
        state={importState.state}
        error={importState.error}
        disabled
        checked={
          importState.state !== 'skipped' && importState.state !== 'invalid'
        }
        toolUrl={
          importState.result?.staticId
            ? `/snippets/${importState.result?.staticId}`
            : undefined
        }
      />
    );
  }

  return (
    <ImportToggleRow
      entry={entry}
      state="ready"
      error={
        !entry.slate.success
          ? `Could not parse: ${entry.slate.error}`
          : undefined
      }
      disabled={disabled}
      checked={checked}
      onChange={onChange}
    />
  );
};
