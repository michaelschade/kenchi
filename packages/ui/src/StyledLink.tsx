import styled from '@emotion/styled';

import { UnstyledLink } from './UnstyledLink';

export const StyledLink = styled(UnstyledLink)`
  color: ${({ theme }) => theme.colors.gray[12]};
  color 0.1s ease-in-out;
  &:hover {
    color: ${({ theme }) => theme.colors.accent[10]};
    text-decoration: none;
  }
`;
