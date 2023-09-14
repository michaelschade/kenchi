import { HTMLAttributes, ReactNode } from 'react';

import styled from '@emotion/styled';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { PrimaryButton } from './Button';
import { Separator } from './Dashboard/Separator';
import { MenuItemRadio, MenuOpener, MenuRadioGroup } from './DropdownMenu';
import Tooltip from './Tooltip';

const LeftButton = styled(PrimaryButton)`
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  &:focus {
    // so the focus ring doesn't get clipped behind the RightButton
    z-index: 1;
  }
`;

const RightButton = styled(PrimaryButton)`
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
`;

export type ButtonConfigs = Record<string, ButtonConfig>;

export type ButtonConfig = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  description?: string;
};

type MultiButtonProps = {
  buttonConfigs: ButtonConfigs;
  disabled?: boolean;
  onChangeSelectedButtonKey: (key: keyof ButtonConfigs) => void;
  selectedButtonKey: keyof ButtonConfigs;
  labelOverride?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const MultiButton = ({
  buttonConfigs,
  disabled: multiButtonDisabled,
  onChangeSelectedButtonKey,
  selectedButtonKey,
  labelOverride,
  ...props
}: MultiButtonProps) => {
  let selectedButton = buttonConfigs[selectedButtonKey];
  if (!selectedButton) {
    selectedButton = Object.values(buttonConfigs)[0];
  }
  const description = selectedButton.description;
  const hasMultipleButtons = Object.keys(buttonConfigs).length > 1;
  const MainButtonComponent = hasMultipleButtons ? LeftButton : PrimaryButton;
  const mainButton = (
    <MainButtonComponent
      disabled={multiButtonDisabled || selectedButton.disabled}
      onClick={selectedButton.onClick}
    >
      {labelOverride || selectedButton.label}
    </MainButtonComponent>
  );
  return (
    <Container {...props}>
      {description ? (
        <Tooltip overlay={description} placement="top">
          {mainButton}
        </Tooltip>
      ) : (
        mainButton
      )}
      <Separator orientation="vertical" />
      {hasMultipleButtons && (
        <MenuOpener
          menuContent={
            <MenuRadioGroup
              value={selectedButtonKey}
              onValueChange={(value) => {
                onChangeSelectedButtonKey(value);
              }}
            >
              {Object.entries(buttonConfigs).map(([key, { label }]) => (
                <MenuItemRadio value={key} key={key}>
                  {label}
                </MenuItemRadio>
              ))}
            </MenuRadioGroup>
          }
        >
          <RightButton disabled={multiButtonDisabled}>
            <FontAwesomeIcon icon={faChevronDown} size="sm" />
          </RightButton>
        </MenuOpener>
      )}
    </Container>
  );
};
