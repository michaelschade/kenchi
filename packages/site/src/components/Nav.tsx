import styled from '@emotion/styled';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { BaseSection } from './BaseSection';

export const Nav = styled(BaseSection)`
  grid-column: span 16;
  place-items: start;
  background-color: ${BrandColors.black};
  padding: 2rem 0;

  &.theme-light {
    background-color: ${BrandColors.white};
    border-bottom: 1px solid ${BrandColors.grey};
    .cta {
      color: ${BrandColors.black};
    }
    ul {
      color: ${BrandColors.black};
    }
  }

  .cta {
    color: ${BrandColors.white};
  }

  .logo {
    grid-column: 2 / span 2;

    svg {
      width: 120px;
    }
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    color: ${BrandColors.white};

    display: grid;
    gap: 0.5rem;

    li {
      line-height: 1;
    }
  }

  .left {
    grid-column: 10 / span 3;
  }

  .right {
    grid-column: 13 / -1;
  }

  .left,
  .right {
    margin-left: 1rem;

    ${Breakpoints.medium} {
      margin-left: 0.25rem;
    }
  }
`;

Nav.defaultProps = {
  as: 'nav',
};
