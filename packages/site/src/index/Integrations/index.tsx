import React, { useEffect, useRef } from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../../breakpoints';
import { BaseSection } from '../../components/BaseSection';
import KenchiLogo from '../../logos/blackOnPeriwinkle.svg';
import { gsap } from '../../utils/gsap';
import isDevelopment from '../../utils/isDevelopment';
import imgFreshdesk from './images/freshdesk.svg';
import imgGmail from './images/gmail.svg';
import imgHelpscout from './images/helpscout.svg';
import imgIntercom from './images/intercom.svg';
import imgSalesforce from './images/salesforce.svg';
import imgZendesk from './images/zendesk.svg';

const style = css`
  --contentHeight: min(100vh, 1000px);

  .top-line {
    display: none;
  }

  ${Breakpoints.medium} {
    --contentHeight: 800px;
  }

  ${Breakpoints.small} {
    --contentHeight: 100vh;
    gap: 0px;

    .left-line {
      display: none;
    }

    .top-line {
      display: block;
    }
  }

  height: calc(var(--contentHeight));

  background-color: ${BrandColors.black};
  border-bottom: 1px solid ${BrandColors.grey};
  grid-column: span 16;

  & .content {
    * {
      color: ${BrandColors.white};
    }
    grid-column: 2 / span 5;

    display: grid;
    row-gap: 2rem;
    place-items: start;
    place-content: center;

    ${Breakpoints.medium} {
      grid-column: 2 / span 6;
    }

    ${Breakpoints.small} {
      grid-column: 2 / span 14;
      row-gap: 1rem;
      height: 50vh;
    }
  }

  & .image {
    display: grid;
    grid-column: 9 / span 8;
    user-select: none;
    overflow: hidden;

    ${Breakpoints.small} {
      grid-column: span 16;
      height: 50vh;
    }

    position: relative;

    .circle {
      position: absolute;
      --width: calc(800 / 600 * 50vw);
      width: var(--width);
      top: calc(var(--contentHeight) / 2 - 25vw);
      left: calc(25vw - var(--width) / 2);

      ${Breakpoints.small} {
        --width: min(150vw, 70vh);
        width: var(--width);
        top: calc((800 / 600 * 50vh - var(--width)) / 2);
        left: calc(50vw - var(--width) / 2);
      }
    }

    .integration {
      position: absolute;
      top: 0;
      left: 100vw;

      ${Breakpoints.medium} {
        transform: scale(0.8);
      }
    }

    .logo {
      position: absolute;
      --size: 136px;
      ${Breakpoints.medium} {
        --size: 100px;
      }

      width: var(--size);
      height: var(--size);

      top: calc(50% - var(--size) / 2);
      left: calc(50% - var(--size) / 2);
    }
  }
`;

const IMAGES = [
  { image: imgZendesk, name: 'Zendesk', width: 96, height: 96 },
  { image: imgGmail, name: 'Gmail', width: 88, height: 88 },
  { image: imgIntercom, name: 'Intercom', width: 65, height: 65 },
  { image: imgSalesforce, name: 'Salesforce', width: 92, height: 65 },
  { image: imgFreshdesk, name: 'Freshdesk', width: 92, height: 92 },
  { image: imgHelpscout, name: 'Help Scout', width: 83, height: 83 },
];

export function Integrations() {
  const ref = useRef<HTMLDivElement>(null);
  const integrationRefs = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'integrations',
        trigger: el,
        start: 'top 60%',
        end: 'bottom+=5% bottom',
        scrub: true,
      },
    });

    const curvePath = el.querySelector<SVGPathElement>('path.curvePath')!;
    const circlePath = el.querySelector<SVGPathElement>('path.circlePath')!;
    for (var i = 0; i < 6; i++) {
      tl.to(
        integrationRefs.current[i],
        {
          motionPath: {
            path: curvePath,
            align: curvePath,
            alignOrigin: [0.5, 0.5],
          },
          duration: 1,
        },
        i
      ).to(
        integrationRefs.current[i],
        {
          motionPath: {
            path: circlePath,
            align: circlePath,
            alignOrigin: [0.5, 0.5],
            end: (6 - i) / 6,
          },
          ease: 'power2.out',
          duration: 6 - i,
        },
        i + 1
      );
    }

    // Resizing rescales the SVG so we need to re-calc our path
    const invalidate = () => tl.invalidate();
    window.addEventListener('resize', invalidate);
    return () => {
      window.removeEventListener('resize', invalidate);
      tl.kill();
    };
  }, []);
  const setRef = (i: number) => (el: HTMLImageElement | null) => {
    if (el) {
      integrationRefs.current[i] = el;
    }
  };

  return (
    <BaseSection ref={ref} css={style}>
      <div className="content" id="integrations">
        <span className="eyebrow">Integrations</span>
        <h2>A layer on top of all your tools. Yes, even that one.</h2>
        <p>
          Install and go. No integration needed. Privacy built in. Works with
          everything.
        </p>
        <p>
          Salesforce, Intercom, Gmail, Zendesk, HelpScout, FreshDesk, you name
          it. We’ve got you covered.
        </p>
      </div>
      <div className="image">
        <svg
          className="grid"
          viewBox="0 0 400 1200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 0 L 400 0"
            className="top-line"
            fill="none"
            stroke={BrandColors.grey}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <defs>
            <pattern
              id="grid"
              width="400"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 0 L 0 100"
                className="left-line"
                fill="none"
                stroke={BrandColors.grey}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 0 100 L 400 100 M 100 0 L 100 100 M 200 0 L 200 100 M 300 0 L 300 100"
                fill="none"
                stroke={BrandColors.grey}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </pattern>
          </defs>

          <rect width="400" height="1200" fill="url(#grid)" />
        </svg>
        <svg
          className="circle"
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="400"
            cy="300"
            r="170"
            fill={BrandColors.black}
            stroke={BrandColors.grey}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="curvePath"
            d="
              M 750 100
              C 600 400 500 470 400 470
            "
            fill="none"
            stroke={isDevelopment() ? 'red' : 'none'}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="circlePath"
            d="
              M 400 470
              A 170 170 0 0 1 400 130
              A 170 170 0 0 1 400 470
            "
            fill="none"
          />
        </svg>
        {IMAGES.map(({ image, name, width, height }, i) => (
          <img
            key={i}
            className="integration"
            ref={setRef(i)}
            src={image}
            alt={`${name} logo`}
            style={{ width, height }}
          />
        ))}
        <KenchiLogo className="logo" alt="Kenchi logo" />
      </div>
    </BaseSection>
  );
}
