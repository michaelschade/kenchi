import styled from '@emotion/styled';

type ButtonProps = {
  block?: boolean;
  size?: 'tiny' | 'small';
};

export const BaseButton = styled.button<ButtonProps>`
  color: ${({ theme }) => theme.colors.gray[12]};
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  outline: 0;

  &:hover {
    text-decoration: none;
    outline: 0;
  }

  &:focus {
    outline: 0;
  }

  &:disabled,
  &.disabled {
    cursor: default;
  }

  ${(props: ButtonProps) =>
    props.size === 'tiny' &&
    `
    padding: .15rem .4rem;
    font-size: .8rem;
    line-height: 1.5;
    border-radius: .2rem;
  `}

  ${(props: ButtonProps) =>
    props.size === 'small' &&
    `
    padding: .35rem .5rem;
    font-size: .9rem;
    line-height: 1.5;
    border-radius: .2rem;
  `}

  ${(props: ButtonProps) =>
    props.block &&
    `
    display: block;
    width: 100%;
  `}
`;

BaseButton.defaultProps = {
  type: 'button',
};

export const PrimaryButton = styled(BaseButton)`
  color: ${({ theme: { colors } }) => colors.fixed.white};
  background-color: ${({ theme: { colors } }) => colors.accent[9]};
  border-color: ${({ theme: { colors } }) => colors.accent[9]};

  &:hover {
    background-color: ${({ theme: { colors } }) => colors.accent[10]};
    border-color: ${({ theme: { colors } }) => colors.accent[9]};
  }

  &:focus {
    background-color: ${({ theme: { colors } }) => colors.accent[10]};
    border-color: ${({ theme: { colors } }) => colors.accent[9]};
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[7]};
  }

  &:active,
  &.active {
    background-color: ${({ theme: { colors } }) => colors.accent[11]};
    border-color: ${({ theme: { colors } }) => colors.accent[9]};
  }

  &:active:focus,
  &.active:focus {
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[8]};
  }

  &:disabled,
  &.disabled {
    background-color: ${({ theme: { colors } }) => colors.accent[8]};
    color: ${({ theme: { colors } }) => colors.accent[1]};
    border-color: ${({ theme: { colors } }) => colors.accent[6]};
  }
`;

export const LinkButton = styled(BaseButton)`
  color: ${({ theme: { colors } }) => colors.accent[9]};

  &:hover {
    color: ${({ theme: { colors } }) => colors.accent[11]};
    text-decoration: underline;
  }

  &:focus {
    text-decoration: underline;
  }

  &:disabled,
  &.disabled {
    color: ${({ theme: { colors } }) => colors.gray[9]};
    pointer-events: none;
  }
`;

export const SecondaryButton = styled(BaseButton)`
  color: ${({ theme: { colors } }) => colors.accent[11]};
  background-color: ${({ theme: { colors } }) => colors.accent[4]};
  border: 1px solid ${({ theme: { colors } }) => colors.accent[4]};

  &:hover {
    background-color: ${({ theme: { colors } }) => colors.accent[4]};
    border-color: ${({ theme: { colors } }) => colors.accent[8]};
  }

  &:focus {
    border-color: ${({ theme: { colors } }) => colors.accent[8]};
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[7]};
  }

  &:active,
  &.active {
    background-color: ${({ theme: { colors } }) => colors.accent[5]};
  }

  &:active:focus,
  &.active:focus {
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[8]};
  }

  &:disabled,
  &.disabled {
    background-color: ${({ theme: { colors } }) => colors.gray[1]};
    color: ${({ theme: { colors } }) => colors.gray[10]};
    border-color: ${({ theme: { colors } }) => colors.gray[5]};
  }
`;

export const DangerButton = styled(BaseButton)`
  color: hsl(0deg 0% 100%);
  background-color: hsl(354deg 70% 54%);
  border-color: hsl(354deg 70% 54%);

  &:hover {
    color: hsl(0deg 0% 100%);
    background-color: hsl(354deg 70% 46%);
    border-color: hsl(354deg 70% 44%);
  }

  &:focus {
    color: hsl(0deg 0% 100%);
    background-color: hsl(354deg 70% 46%);
    border-color: hsl(354deg 70% 44%);
    box-shadow: 0 0 0 0.2rem hsl(354deg 70% 60% / 50%);
  }

  &:active,
  &.active {
    color: hsl(0deg 0% 100%);
    background-color: hsl(354deg 70% 44%);
    border-color: hsl(354deg 70% 41%);
  }

  &:active:focus,
  &.active:focus {
    box-shadow: 0 0 0 0.2rem hsl(354deg 70% 60% / 50%);
  }

  &:disabled,
  &.disabled {
    color: hsl(0deg 0% 100%);
    background-color: hsl(354deg 70% 70%);
    border-color: hsl(354deg 70% 68%);
  }
`;
