import styled from '@emotion/styled';

export const KeyButton = styled.button`
  cursor: default;
  user-select: none;
  padding: 2px 5px;
  border-radius: 5px;
  border: 1px solid ${({ theme: { colors } }) => colors.gray[6]};
  background: ${({ theme: { colors } }) => colors.gray[0]};
  box-shadow: 1px 1px 0px 0px ${({ theme: { colors } }) => colors.gray[8]};
  color: ${({ theme }) => theme.colors.accent[9]};
  font-weight: 500;
  padding: 0 0.25rem;
  line-height: 1.5;

  transition: all 100ms ease-in-out;

  &:hover {
    background: ${({ theme: { colors } }) => colors.gray[1]};
    border: 1px solid ${({ theme: { colors } }) => colors.gray[6]};
    box-shadow: 1px 1px 0px 0px ${({ theme: { colors } }) => colors.gray[9]};
  }

  &:active {
    background: ${({ theme: { colors } }) => colors.gray[2]};
    border: 1px solid ${({ theme: { colors } }) => colors.gray[6]};
    box-shadow: 0px 0px 0px 0px ${({ theme: { colors } }) => colors.gray[9]};
    transform: translateY(1px) translateX(1px);
  }
`;
