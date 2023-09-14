import styled from '@emotion/styled';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

export const Separator = styled(SeparatorPrimitive.Root)`
  background-color: ${({ theme }) => theme.colors.gray[4]};

  &[data-orientation='horizontal'] {
    height: 1px;
    width: 100%;
  }

  &[data-orientation='vertical'] {
    height: 100%;
    width: 1px;
  }
`;
