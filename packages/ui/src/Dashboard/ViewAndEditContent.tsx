import { useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faFolder, faPencilAlt } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AutosizeInput from 'react-input-autosize';
import AutosizeTextarea from 'react-textarea-autosize';
import tw from 'twin.macro';

import { KenchiTheme } from '../Colors';
import { LoadingSpinner } from '../Loading';
import { NameWithEmoji } from '../NameWithEmoji';
import { Pill } from './Pill';

export const delayForHideEditActionBarMs = 1000;
export const editActionBarTransitionDurationMs = 200;

export const AutoResizeInput = styled(AutosizeInput)`
  width: 100%;
  & input {
    color: ${({ theme }) => theme.colors.gray[12]};
    max-width: 100%;
    background-color: transparent;
    border-radius: 0.25rem;
    border: 1px solid transparent;
    margin-left: -0.5rem;
    outline: none;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    transition: 150ms box-shadow ease-in-out;
    box-sizing: border-box;

    &:hover {
      border-color: ${({ theme }) => theme.colors.gray[7]};
    }
    &:focus {
      background-color: ${({ theme: { colors } }) => colors.gray[0]};
      border-color: ${({ theme: { colors } }) => colors.accent[7]};
      box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);

      &::placeholder {
        color: ${({ theme: { colors } }) => colors.gray[8]};
      }
    }
  }
`;

export const InlineAutosizeTextarea = styled(AutosizeTextarea)`
  border-radius: 0.25rem;
  border: 1px solid transparent;
  background-color: transparent;
  transition: 150ms box-shadow ease-in-out;
  outline: none;
  resize: none;
  margin: -0.25rem -0.5rem;
  padding: 0.25rem 0.5rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.gray[7]};
  }
  &:focus {
    background-color: ${({ theme: { colors } }) => colors.gray[0]};
    border-color: ${({ theme: { colors } }) => colors.accent[7]};
    box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
  }
`;

export const Heading = styled.div`
  align-items: center;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(0, auto) 1fr;
`;

export const dashboardInlineEditingButtonStyle = css`
  background-color: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  border-radius: 0.25rem;
`;

export const ViewAndEditPageGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(300px, 1fr) 300px;
  grid-template-areas: 'MainConfiguration Sidebar';
`;

export const EditActionBarContainer = styled.div<{ visible: boolean }>`
  bottom: 0;
  display: grid;
  gap: 0.5rem;
  grid-auto-flow: column;
  left: 50%;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  padding: 0.5rem;
  position: fixed;
  transform: translateX(-50%)
    ${({ visible }) => (visible ? 'translateY(0%)' : 'translateY(100%)')};
  transition: transform ${editActionBarTransitionDurationMs}ms ease,
    opacity ${editActionBarTransitionDurationMs}ms ease;
`;

export const ErrorsAndAlerts = styled.div`
  display: grid;
  gap: 0.5rem;
`;

export const MainConfiguration = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  grid-area: MainConfiguration;
`;

export const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  grid-area: Sidebar;
`;

export const SidebarCardEmptyState = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  text-align: left;
  color: ${({ theme: { colors } }) => colors.gray[10]};
`;

export const SidebarCardLoadingContents = () => {
  return (
    <div
      css={css`
        text-align: center;
      `}
    >
      <LoadingSpinner />
    </div>
  );
};

const CollectionSelectorButtonContentsContainer = styled.div`
  ${dashboardInlineEditingButtonStyle}
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.25rem;
`;

const pencilStyles = {
  active: ({ colors }: KenchiTheme) => css`
    ${tw`opacity-0 group-hover:opacity-100 transition-opacity text-base`}
    color: ${colors.accent[9]};
  `,
  inactive: ({ colors }: KenchiTheme) => css`
    ${tw`opacity-0 group-hover:opacity-100 transition-opacity text-base`}
    color: ${colors.accent[7]};
  `,
};

export const CollectionSelectorButtonContents = ({
  name,
  icon,
}: {
  name: string;
  icon: string | null | undefined;
}) => {
  // We use state here instead of the `:active` pseudo-class because
  // the thing that gets :active is the Listbox.Button component way
  // over in MenuSheet.tsx, not anything in this file. This is just the
  // content _within_ that button.
  const [isActive, setIsActive] = useState(false);
  return (
    <CollectionSelectorButtonContentsContainer
      className="group"
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      css={css`
        white-space: nowrap;
      `}
    >
      <Pill color="gray" size="large">
        <NameWithEmoji name={name} emoji={icon} fallbackIcon={faFolder} />
      </Pill>
      <FontAwesomeIcon
        css={isActive ? pencilStyles.active : pencilStyles.inactive}
        icon={faPencilAlt}
      />
    </CollectionSelectorButtonContentsContainer>
  );
};
