import React from 'react';

import { css } from '@emotion/react';
import { PageProps } from 'gatsby';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import LogoSvg from '../logos/wordmark.svg';
import { HiringLink } from './HiringLink';
import { Nav } from './Nav';

type FooterProps = Pick<PageProps, 'location'>;

export const Footer = ({ location }: FooterProps) => {
  const pathname = location.pathname.slice(1);
  const style = css`
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
    }
  `;
  return (
    <Nav as="footer" css={style}>
      <a href="/beta" className="logo">
        <LogoSvg alt="Kenchi logo" fill={BrandColors.white} />
      </a>
      <ul className="left">
        <li>
          <a href="/#how" className="cta">
            How It Works
          </a>
        </li>
        <li>
          <a href="/#integrations" className="cta">
            Integrations
          </a>
        </li>
        <li>
          <a href="/#features" className="cta">
            Features
          </a>
        </li>
        <li>
          <a href="/pricing" className="cta">
            Pricing
          </a>
        </li>
      </ul>
      <ul className="right">
        <li>
          <a href="/pricing#faq" className="cta">
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
