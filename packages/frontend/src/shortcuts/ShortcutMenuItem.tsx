import { faBolt } from '@fortawesome/pro-solid-svg-icons';

import { LinkButton } from '@kenchi/ui/lib/Button';
import { MenuItem } from '@kenchi/ui/lib/DropdownMenu';
import { Form } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import ErrorAlert from '../components/ErrorAlert';
import { CustomModal } from '../components/Modals';
import { MutateButton } from '../components/MutateButton';
import { errorFromMutation } from '../graphql/errorFromMutation';
import { useHasOrgPermission } from '../graphql/useSettings';
import useShortcuts from '../graphql/useShortcuts';
import { ShortcutsInputGroup } from '../tool/edit/ShortcutsInputGroup';
import useSetShortcuts from './useSetShortcuts';

type ShortcutModalProps = {
  onClose: (reason: string) => void;
  staticId: string;
  isOpen: boolean;
};

export const ShortcutModal = ({
  onClose,
  staticId,
  isOpen,
}: ShortcutModalProps) => {
  const { byStaticId, refetchQueries } = useShortcuts('cache-first');
  const shortcuts = byStaticId[staticId];

  const canManageOrgShortcuts = useHasOrgPermission('manage_org_shortcuts');

  const orgShortcut = shortcuts?.find((s) => s.orgWide)?.shortcut || null;
  const userShortcut = shortcuts?.find((s) => !s.orgWide)?.shortcut || null;

  const orgShortcutState = useFormState<string>(orgShortcut ?? undefined, '');
  const userShortcutState = useFormState<string>(userShortcut ?? undefined, '');

  const [shortcutsMutation, shortcutsMutationResult] = useSetShortcuts({
    onCompleted: (data) => {
      if (data.modify && !data.modify.error) {
        onClose('saved_both');
      }
    },
  });

  const error = errorFromMutation(shortcutsMutationResult);

  return (
    <CustomModal
      isOpen={isOpen}
      onBack={() => onClose('cancel')}
      title="Manage shortcut"
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          shortcutsMutation({
            variables: {
              staticId,
              orgShortcut:
                canManageOrgShortcuts && orgShortcutState.hasChanged
                  ? orgShortcutState.value
                  : undefined,
              userShortcut: userShortcutState.hasChanged
                ? userShortcutState.value
                : undefined,
            },
            refetchQueries,
          });
        }}
      >
        <div>
          <ErrorAlert title="Error saving shortcuts" error={error} />
          <ShortcutsInputGroup
            orgShortcutState={orgShortcutState}
            userShortcutState={userShortcutState}
            autoFocus
          />
        </div>
        <div className="text-right">
          <LinkButton onClick={() => onClose('cancel')}>Cancel</LinkButton>
          <MutateButton
            type="submit"
            disabled={
              !orgShortcutState.hasChanged && !userShortcutState.hasChanged
            }
            result={shortcutsMutationResult}
          >
            Save
          </MutateButton>
        </div>
      </Form>
    </CustomModal>
  );
};

type Props = {
  staticId: string;
  onClick: () => void;
};

export default function ShortcutMenuItem({ staticId, onClick }: Props) {
  const { loading, error, byStaticId } = useShortcuts('cache-first');
  const shortcuts = byStaticId[staticId];

  if (error) {
    return <ErrorAlert title="Couldn't load shortcuts" error={error} />;
  }

  if (loading && !shortcuts) {
    return (
      <MenuItem>
        <LoadingSpinner name="shortcuts menu item" />
      </MenuItem>
    );
  }

  const orgShortcut = shortcuts?.find((s) => s.orgWide)?.shortcut || null;
  const userShortcut = shortcuts?.find((s) => !s.orgWide)?.shortcut || null;

  let shortcutText;
  // TODO: wording to signal org vs. user?
  if (userShortcut) {
    shortcutText = `Change shortcut: ${userShortcut}`;
  } else if (orgShortcut) {
    shortcutText = `Change shortcut: ${orgShortcut}`;
  } else {
    shortcutText = 'Add shortcut';
  }

  return (
    <MenuItem truncate icon={faBolt} onClick={onClick}>
      {shortcutText}
    </MenuItem>
  );
}
