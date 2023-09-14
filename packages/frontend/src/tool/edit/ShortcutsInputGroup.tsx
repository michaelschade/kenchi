import { useMemo } from 'react';

import { css } from '@emotion/react';

import { Accordion } from '@kenchi/ui/lib/Accordion';
import { Pill } from '@kenchi/ui/lib/Dashboard/Pill';
import { FormControlsContainer, InputGroup } from '@kenchi/ui/lib/Form';
import { FormState } from '@kenchi/ui/lib/useFormState';

import { useHasOrgPermission } from '../../graphql/useSettings';

export const shortcutsDescription =
  "When you type a shortcut into search, you will always get that snippet as the first result. It's a quick way to go straight to your most commonly used snippets!";

type Props = {
  orgShortcutState: FormState<string>;
  userShortcutState: FormState<string>;
  collapsible?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
};

const ShortcutsInputs = ({
  orgShortcutState,
  userShortcutState,
  autoFocus,
  canManageOrgShortcuts,
  disabled,
}: Pick<
  Props,
  'orgShortcutState' | 'userShortcutState' | 'autoFocus' | 'disabled'
> & {
  canManageOrgShortcuts: boolean;
}) => (
  <FormControlsContainer>
    <InputGroup
      label="Just for you"
      value={userShortcutState.value}
      onChange={(e) => userShortcutState.set(e.target.value.toLowerCase())}
      spellCheck="false"
      autoFocus={autoFocus}
      disabled={disabled}
    />
    <InputGroup
      label="Teamwide"
      value={orgShortcutState.value}
      onChange={(e) => orgShortcutState.set(e.target.value.toLowerCase())}
      disabled={disabled || !canManageOrgShortcuts}
      description={
        canManageOrgShortcuts
          ? 'Make it quick for your entire team to access commonly used Snippets with a standard shortcut.'
          : "You don't have permission to set a team shortcut. You can ask your team administrator to set a shortcut or to update your permissions."
      }
      spellCheck="false"
    />
  </FormControlsContainer>
);

export const ShortcutsInputGroup = ({
  orgShortcutState,
  userShortcutState,
  collapsible = false,
  autoFocus,
  disabled = false,
}: Props) => {
  const canManageOrgShortcuts = useHasOrgPermission('manage_org_shortcuts');

  const label = useMemo(() => {
    if (orgShortcutState.value && userShortcutState.value) {
      return [orgShortcutState.value, userShortcutState.value].map((value) => (
        <Pill size="medium" key={value}>
          {value}
        </Pill>
      ));
    }
    if (orgShortcutState.value) {
      return <Pill size="medium">{orgShortcutState.value}</Pill>;
    }
    if (userShortcutState.value) {
      return <Pill size="medium">{userShortcutState.value}</Pill>;
    }
    return 'Add shortcuts';
  }, [orgShortcutState, userShortcutState]);

  if (collapsible) {
    return (
      <Accordion
        sections={[
          {
            label: (
              <div
                css={css`
                  display: flex;
                  gap: 0.5rem;
                  height: 1.25rem;
                  align-items: center;
                `}
              >
                {label}
              </div>
            ),
            content: (
              <div
                css={css`
                  padding: 0.5rem;
                `}
              >
                <ShortcutsInputs
                  orgShortcutState={orgShortcutState}
                  userShortcutState={userShortcutState}
                  autoFocus={autoFocus}
                  canManageOrgShortcuts={!!canManageOrgShortcuts}
                  disabled={disabled}
                />
              </div>
            ),
            key: 'shortcuts',
          },
        ]}
      />
    );
  }

  return (
    <>
      <p>{shortcutsDescription}</p>
      <ShortcutsInputs
        orgShortcutState={orgShortcutState}
        userShortcutState={userShortcutState}
        autoFocus={autoFocus}
        canManageOrgShortcuts={!!canManageOrgShortcuts}
      />
    </>
  );
};
