import React from 'react';

import { css } from '@emotion/react';
import { PageProps } from 'gatsby';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import Logo from '../logos/wordmark.svg';
import { HiringLink } from './HiringLink';
import { Nav } from './Nav';

const style = css`
  .mobile-pricing-link {
    display: none;
  }
  ${Breakpoints.small} {
    .left {
      display: none;
    }
    .right {
      grid-column: 9 / -1;
      align-self: center;
      margin-right: 1rem;
      padding-top: 0.5rem;
    }
    .mobile-pricing-link {
      display: list-item;
    }
  }

  .is-current-page::before {
    position: absolute;
    transform: translateX(-150%) translateY(-1px);
    content: '●';
  }
`;

type TopNavProps = Pick<PageProps, 'location'> & {
  theme?: 'light' | 'dark';
};

export const TopNav = ({ location, theme = 'dark' }: TopNavProps) => {
  const hash = location.hash.slice(1);
  const pathname = location.pathname.slice(1);
  return (
    <Nav
      css={style}
      className={theme === 'dark' ? 'theme-dark' : 'theme-light'}
    >
      <a href="/" className="logo">
        <Logo
          alt="Kenchi logo"
          fill={theme === 'dark' ? BrandColors.white : BrandColors.black}
        />
      </a>
      <ul className="left">
        <li>
          <a
            href="/#how"
            className={`cta ${hash === 'how' ? 'is-current-page' : ''}`}
          >
            How It Works
          </a>
        </li>
        <li>
          <a
            href="/#integrations"
            className={`cta ${
              hash === 'integrations' ? 'is-current-page' : ''
            }`}
          >
            Integrations
          </a>
        </li>
        <li>
          <a
            href="/#features"
            className={`cta ${hash === 'features' ? 'is-current-page' : ''}`}
          >
            Features
          </a>
        </li>
        <li>
          <a
            href="/pricing"
            className={`cta ${
              pathname === 'pricing' && hash !== 'faq' ? 'is-current-page' : ''
            }`}
          >
            Pricing
          </a>
        </li>
      </ul>
      <ul className="right">
        <li className="mobile-pricing-link">
          <a
            href="/pricing"
            className={`cta ${
              pathname === 'pricing' && hash !== 'faq' ? 'is-current-page' : ''
            }`}
          >
            Pricing
          </a>
        </li>
        <li>
          <a
            href="/pricing#faq"
            className={`cta ${hash === 'faq' ? 'is-current-page' : ''}`}
          >
            FAQ
          </a>
        </li>
        <li>
          <a
            href="/changelog"
            className={`cta ${
              pathname === 'changelog' ? 'is-current-page' : ''
            }`}
          >
            Changelog
          </a>
        </li>
        <li>
          <HiringLink />
        </li>
      </ul>
    </Nav>
  );
};
