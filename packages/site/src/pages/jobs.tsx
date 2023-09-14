import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import classNames from 'classnames/bind';
import { navigate } from 'gatsby';
import { parse } from 'query-string';
import { Helmet } from 'react-helmet';
import useResizeObserver from 'use-resize-observer';

import Canvas from '../components/Canvas';
import BaseLayout, {
  drawEllipse,
  getEllipses,
} from '../components/LegacyBaseLayout';
import photoUs from './brian-michael.jpg';

const baseStyle = css`
  display: grid;
  row-gap: var(--sectionGap);
`;

const Section = styled.div`
  display: grid;
  row-gap: var(--rowGapXLarge);
`;

/* About */
const aboutStyle = css`
  header {
    grid-column: 1/-1;
  }
`;

const Bio = styled.div`
  display: grid;
  box-shadow: var(--shadowFocus);
  border: 1px solid var(--shadowFocusColor);
  border-top-style: none;
  border-left-style: none;
  background: var(--sectionBackgroundColor);
  place-self: center;

  img {
    aspect-ratio: 3 / 2;
    object-fit: contain;
    width: 100%;
  }

  div {
    display: grid;
    row-gap: var(--rowGap);
    padding: var(--rowGap) var(--columnGapMedium);
    border-left: 1px dotted var(--shadowFocusColor);
  }
`;

const Masthead = styled.div`
  display: grid;
  row-gap: var(--rowGap);

  p {
    font: var(--captionFont);
    font-weight: var(--fontWeightLight);
  }
`;

const About = () => {
  return (
    <Section css={aboutStyle} data-columns="2,2">
      <header>
        <h1>Kenchi</h1>
        <h2>Modern tools for modern teams.</h2>
      </header>
      <Masthead>
        <p>
          Kenchi supercharges teams. We take age-old efficiency hacks—think the
          best hits from HyperCard, Automator, and Greasemonkey—reimagined for
          the modern web and brought to the whole team.
        </p>
        <p>
          While we&rsquo;re quite early in our journey, Kenchi already plays a
          meaningful role for folks using us. Our median user spends over 3.5
          hours a day in our app to get their job done, with folks hailing
          everywhere from SF to Lagos.
        </p>
        <p>
          Kenchi is security-first, insights-driven, and tool-agnostic.
          We&rsquo;re here to offer construction materials, not prefab houses.
          If we do our jobs well, we&rsquo;ll be surprised by what folks do with
          Kenchi. (We already are!)
        </p>
        <p>
          Needless to say, there&rsquo;s a lot to do! We&rsquo;re looking for
          kind, talented, thoughtful people to join our founding team and shape
          the future of Kenchi. We hope you&rsquo;ll take the time to get to
          know us; we&rsquo;re excited to meet you :)
        </p>
      </Masthead>
      <Bio>
        <img src={photoUs} alt="Brian Krausz and Michael Schade" />
        <div>
          <p>
            Michael &amp; Brian here&mdash;nice to meet you! We started Kenchi
            in 2020 to help teams transform clunky manual processes into simple
            automations and work smarter together.
          </p>
          <p>
            Before Kenchi, we were both early employees at Stripe. Michael
            started Stripe&rsquo;s Support &amp; Internal Tools teams, while
            Brian led Stripe Connect and built{' '}
            <a
              href="http://stripe.com/blog/stripe-home"
              target="_blank"
              rel="noreferrer"
            >
              Stripe Home
            </a>
            .
          </p>
        </div>
      </Bio>
    </Section>
  );
};

/* Roles */

const roleStyle = css`
  border: 1px solid var(--shadowFocusColor);
  border-top-style: none;
  border-left-style: dotted;
  box-shadow: var(--shadowFocus);
  background: var(--sectionBackgroundColor);
  padding: calc(var(--rowGap) * 2) var(--columnGap);
  row-gap: var(--rowGap);

  & .tagline {
    grid-column: span 3;
    font: var(--captionFont);
    font-weight: var(--fontWeightLight);
  }

  & .retroCta {
    h3 {
      grid-column: 1 / -1;
      width: 100%;
    }
  }

  & .copy > div {
    display: grid;
    row-gap: var(--rowGap);
  }

  & h3 {
    border-bottom: 1px solid var(--subtleTextColor);
  }

  & ul {
    list-style-type: none;
    padding: 0;

    & li {
      margin: 0 0 var(--rowGap) 0;

      strong {
        display: block;
      }
    }
  }
`;

type RoleProps = {
  active: boolean;
  tagline: string | string[];
  children: React.ReactNode;
};

const Role = React.forwardRef(
  (
    { active, tagline, children }: RoleProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    if (!Array.isArray(tagline)) {
      tagline = [tagline];
    }
    return (
      <Section
        ref={ref}
        css={roleStyle}
        style={{ display: active ? undefined : 'none' }}
      >
        <div data-columns="1,1,1,1">
          {tagline.map((t, i) => (
            <p key={i} className="tagline">
              {t}
            </p>
          ))}
        </div>
        <div className="copy" data-columns="2,2" data-columns-collapse>
          {children}
        </div>
      </Section>
    );
  }
);

const perkStyle = css`
  display: grid;
  row-gap: var(--rowGap);

  & div {
    display: grid;
    row-gap: var(--rowGap);
  }

  @media (max-width: 800px) {
    padding: 0 var(--columnGap);
    row-gap: var(--sectionGap);
  }
`;

const PerksNEquity = () => {
  return (
    <div css={perkStyle}>
      <div>
        <h2>Perks</h2>
        <p>
          While we&rsquo;re still tiny, we&rsquo;ve tried to invest in the perks
          that will have the biggest impact for you. Here&rsquo;s what we
          currently offer:
        </p>
        <ul>
          <li>Comprehensive health, dental, and vision insurance.</li>
          <li>Generous and flexible parental leave program.</li>
          <li>WFH bonus to spruce up your workspace.</li>
          <li>L&amp;D stipend: books, educational courses, you name it.</li>
          <li>Health and wellness stipend: destress and invest in you.</li>
          <li>
            Flexible work schedule. (We expect you to use it&mdash;get some
            R&amp;R!)
          </li>
        </ul>
      </div>
      <div>
        <h2>15% to the first 10</h2>
        <p>
          We view our founding team as a <em>founding</em> team: we&rsquo;ve set
          aside 15% of our cap table for our first 10 hires. In order to
          increase fairness for candidates of all backgrounds, we don&rsquo;t
          negotiate on compensation; we instead pre-allocate our offers and aim
          to make them generous from the start.
        </p>
        <p>
          We&rsquo;ve also dedicated 1% of Kenchi stock for charity as part of
          the{' '}
          <a
            href="https://pledge1percent.org/"
            target="_blank"
            rel="noreferrer"
          >
            1% pledge
          </a>
          .
        </p>
      </div>
    </div>
  );
};

const applyStyle = css`
  border: 1px solid var(--shadowFocusColor);
  border-top-style: none;
  border-left-style: none;
  box-shadow: var(--shadowFocus);

  & .header {
    position: relative;
    padding: calc(var(--rowGap) * 2) var(--columnGap);
    border-bottom: 3px solid var(--shadowFocusColor);

    color: var(--blockTextColor);

    *::selection {
      background: var(--sectionBackgroundColor);
      color: var(--textColor);
    }
  }

  & .copy {
    display: grid;
    row-gap: var(--rowGap);
    padding: calc(var(--rowGap) * 2) var(--columnGap);
    border-left: 1px dotted var(--shadowFocusColor);
    background: var(--sectionBackgroundColor);
  }

  & .retroCta {
    font-weight: var(--fontWeightSemibold);
  }
`;

const canvasStyle = css`
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  user-select: none;
  transition: opacity 1000ms ease-in;

  &.hide {
    opacity: 0;
    transition: opacity 800ms ease-out;
  }

  &.show {
    opacity: 1;
  }
`;

const draw = (canvas: HTMLCanvasElement, copyElem: HTMLDivElement) => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const step = 60;
  const canvasRect = ctx.canvas.getBoundingClientRect();
  const densityMultiplier = 1.8;
  const kEllipses = getEllipses(
    canvasRect,
    copyElem.getBoundingClientRect(),
    densityMultiplier
  );
  ctx.globalCompositeOperation = 'xor';
  drawEllipse(ctx, kEllipses, step, -45, 'rgba(0, 0, 0, 1)', 1);
  ctx.fillStyle = '#0c0b0d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const Apply = () => {
  const copyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const drawBlack = useCallback(
    (canvas: HTMLCanvasElement) => draw(canvas, copyRef.current!),
    [copyRef]
  );

  return (
    <div css={applyStyle}>
      <div className="header" ref={headerRef}>
        <h2 ref={copyRef}>We&rsquo;d love to hear from you!</h2>
        {copyRef.current && headerRef.current && (
          <Canvas
            draw={drawBlack}
            loop={false}
            className={'show'}
            referenceElem={headerRef.current}
            css={canvasStyle}
          />
        )}
      </div>
      <div className="copy">
        <p>
          We&rsquo;d find it helpful to hear a bit about your experience, a
          project of which you&rsquo;re most proud, and anything else you want
          us to know.
        </p>
        <p>
          We&rsquo;re eager to get to know you, and our interview process is
          very much a two-way street: we&rsquo;ll make sure you have plenty of
          time to learn more about us and Kenchi as well! We&rsquo;ll be
          respectful of your time. You can expect quick, clear communication at
          every step.
        </p>
        <p className="retroCta">
          <a href="mailto:jobs@kenchi.com">
            Apply at jobs@kenchi.com. Hope to talk soon! :)
          </a>
        </p>
      </div>
    </div>
  );
};

const RoleToggleContainer = styled.div`
  position: relative;
  overflow-x: hidden;

  & .spacer {
    position: absolute;
    z-index: -1;
    top: 0;
    width: 100%;
    height: 100%;
    border-bottom: 1px solid var(--shadowFocusColor);

    &.spacer-dotted {
      left: 1px;
      border-bottom-style: dotted;
    }
  }

  ul {
    display: inline-block;
    & {
      padding: 0 !important;
    }

    & li {
      display: inline-block;
      padding: calc(var(--bodyFontSize) * 0.5) calc(var(--bodyFontSize) * 1.25);
      font-weight: var(--fontWeightSemibold);
      user-select: none;
      text-align: center;
      white-space: nowrap;

      /* Setting a fixed width to help border-box box-sizing keep the width from shifting with the border. Not a big fan of this. */
      width: 100px;

      &.active {
        font-weight: var(--fontWeightHeavy);
        border: 1px solid var(--shadowFocusColor);
        border-top-style: dotted;
        border-right-width: 2px;
        border-bottom: none;
        border-left-style: dotted;
      }

      &:not(.active) {
        cursor: pointer;
      }
    }
  }
`;

const DEFAULT_ROLE = 'design';

const Roles = () => {
  const [active, setActive] = useState<string | null>(DEFAULT_ROLE);
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const role = parse(window.location.search).role as null | string;
      if (role) {
        setActive(role);
      }
    }
  }, []);

  const roleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const activeRoleRef = useRef<HTMLLIElement | null>(null);
  const dottedBorderRef = useRef<HTMLDivElement>(null);
  const solidBorderRef = useRef<HTMLDivElement>(null);

  const updateActive = (role: string) => {
    navigate(`/jobs?role=${role}`, { replace: true });
    setActive(role);
  };

  useLayoutEffect(() => {
    if (
      activeRoleRef.current &&
      dottedBorderRef.current &&
      parentRef.current &&
      solidBorderRef.current
    ) {
      const { x } = parentRef.current.getBoundingClientRect();
      const {
        x: activeX,
        left,
        right,
      } = activeRoleRef.current.getBoundingClientRect();
      if (x === activeX) {
        dottedBorderRef.current.style.display = 'none';
      } else {
        dottedBorderRef.current.style.display = 'initial';
        dottedBorderRef.current.style.width = `${left - x}px`;
      }
      solidBorderRef.current.style.left = `${right - x - 2}px`;
    }
  }, [active, activeRoleRef, dottedBorderRef, parentRef, solidBorderRef]);

  const createToggle = useCallback(
    (key: string, name: string) => {
      return (
        <li
          ref={(ref) => {
            if (key === active) {
              activeRoleRef.current = ref;
            }
          }}
          className={classNames({ active: active === key })}
          onClick={() => {
            updateActive(key);
          }}
        >
          {name}
        </li>
      );
    },
    [active]
  );

  return (
    <div style={{ position: 'relative' }}>
      <RoleToggleContainer ref={parentRef}>
        <div ref={dottedBorderRef} className="spacer spacer-dotted"></div>
        <ul>
          {createToggle('design', 'Design')}
          {createToggle('eng', 'Eng')}
        </ul>
        <div ref={solidBorderRef} className="spacer spacer-solid"></div>
      </RoleToggleContainer>

      <Role
        active={active === 'design'}
        ref={(ref) => roleRefs.current.push(ref)}
        tagline="Our product is a series of tradeoffs: simple for newbies, powerful for pros, and turns people into power users. We&rsquo;re looking for a thought partner to design a gorgeous, snappy UI built to incrementally expose this power."
      >
        <div>
          <h3>Ideally, you are&hellip;</h3>
          <ul>
            <li>
              <strong>Willing to learn basic React</strong>
              Although we don&rsquo;t expect you to build features (though
              it&rsquo;s a plus!), we&rsquo;re a small, scrappy team. We&rsquo;d
              like you to build UI components that can be passed off for tie-ins
              to data. No worries if you&rsquo;re not familiar: we are more than
              happy to invest the time to help you out.
            </li>
            <li>
              <strong>Collaborative &amp; customer focused</strong>
              Kenchi usage isn&rsquo;t our be-all and end-all: we aspire to
              understand what our users are <em>really</em> trying to do. So we
              spend a lot of time talking to them&mdash;we want to work closely
              with you to share that feedback. We&rsquo;d like to integrate you
              into our design/build/iterate cycle (and get your help shaping
              that process!) so you can have influence early and often.
            </li>
            <li>
              <strong>Comfortable with ambiguity</strong>
              We won&rsquo;t have all the answers on how something should work.
              (That&rsquo;s part of the fun!) Striking a balance between
              educated guesses and getting something out in the wild, and
              between pixel perfection and experimental designs, is a critical
              part of our process.
            </li>
          </ul>
        </div>

        <div>
          <h3>Some challenges we&rsquo;d tackle together&hellip;</h3>
          <ul>
            <li>
              <strong>Build for both novice and power users</strong>
              We speak up to our users, enabling a lot of customization and
              control over Kenchi. But we also want to be accessible to new
              folks. Intro videos and tutorials are table stakes: we aim to do
              better with tactics like intelligently timed hints (for example,
              keyboard shortcuts, which are prevalent in our tool) and
              interactive onboarding (our extension format means we break
              through barriers between apps).
            </li>
            <li>
              <strong>Live outside our own tab</strong>
              Most of our customers use Kenchi embedded in a 300px iframe
              embedded in other tools, while their team leads pop into our
              dashboard for a zoomed out view to configure their Kenchi
              landscape. We want to make the experience feel consistent across
              these environments, but also play to each environment&rsquo;s
              strengths.
            </li>
            <li>
              <strong>Statistician-level insights for everyone</strong>
              Our app is a neutral player across all our customers&rsquo; tools,
              so we have unique data to help them pinpoint priorities. For the
              first time, folks can see exactly <em>which</em> replies result in
              low CSAT, churned users, and more. Well, sorta: it&rsquo;s all
              trapped in a spreadsheet right now. We&rsquo;d like to make this
              data available&mdash;and <em>understandable</em>&mdash;right in
              our product.
            </li>
          </ul>
        </div>
      </Role>

      <Role
        active={active === 'eng'}
        ref={(ref) => roleRefs.current.push(ref)}
        tagline="Customer-focused product engineers excel here. More than just a React frontend, our security-first architecture has to be lightning fast, resilient across apps we don&rsquo;t control, and expose powerful automations and insights."
      >
        <div>
          <h3>Ideally, you are&hellip;</h3>
          <ul>
            <li>
              <strong>Collaborative &amp; customer focused</strong>
              We don&rsquo;t build for the sake of building. It&rsquo;s critical
              we understand what our users are <em>really</em> trying to do. We
              aspire to understand where they want to go in a year or two, then
              try our best to accelerate them toward that. So we spend a lot of
              time talking to our customers&mdash;we want to work closely with
              you to share and internalize that feedback.
            </li>
            <li>
              <strong>Experienced with React</strong> While we value ability to
              learn and grow more than specific tech stack knowledge, experience
              writing performant React code and a good understanding of the
              React render lifecycle is a big bonus. We spend about 70% of our
              time on frontend code.
            </li>
            <li>
              <strong>
                On the lookout for the{' '}
                <a
                  href="https://littlebigdetails.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  little big details
                </a>
              </strong>{' '}
              Do we refocus search when you hit ctrl+space, but only if it makes
              sense to switch your focus? Do our errors messages get you
              unstuck? Can you override team settings to fine-tune Kenchi?
              You&rsquo;re in good company.
            </li>
            <li>
              <strong>Thoughtful about code abstractions</strong> We&rsquo;re
              building Kenchi for the long-term to tackle a complex domain with
              lots of customization capabilities. The way we define our
              abstractions now will affect our velocity for years to come.
            </li>
          </ul>
        </div>

        <div>
          <h3>Some challenges we&rsquo;d tackle together&hellip;</h3>
          <ul>
            <li>
              <strong>A snappy app experience</strong> Keyboard shortcuts, quick
              initial load, smart data caching and syncing. We&rsquo;re building
              an app that our customers use every day and rely on: it should
              feel fast and powerful.
            </li>
            <li>
              <strong>Privacy-conscious insights</strong> Our customers already
              use aggregate Kenchi insights to inform their team and product
              roadmaps. (One customer told us they saw a 22% improvement in
              their top-line metric after it sat stagnant for a year!)
              We&rsquo;re excited about giving them even more precise insights,
              but want to ensure our analytics are built privacy-first, such as
              on-client filtering and auto-expunging data.
            </li>
            <li>
              <strong>Injection into web pages</strong> Our app is primarily
              delivered via a Chrome extension that hooks into target web pages,
              allowing us to click buttons, extract info from pages, and provide
              global keyboard shortcuts. We need to do this in a robust but
              flexible way. For example, we hook into a page&rsquo;s underlying
              data model to extract information, as opposed to just scraping
              text fields, making us more immune to layout/UI changes.
            </li>
          </ul>
        </div>
      </Role>
    </div>
  );
};

export default function Home() {
  // Don't enable the background effect until we know the max page height to
  // account for the role toggles changing
  const [disableEffect, setDisableEffect] = useState(true);
  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: () => {
      setDisableEffect(false);
    },
  });

  return (
    <BaseLayout
      ref={ref}
      style={baseStyle}
      disableNav
      disableEffect={disableEffect}
    >
      <Helmet>
        <title>Jobs - Kenchi</title>
      </Helmet>

      <About />
      <Roles />
      <div
        data-columns="2,2"
        style={{ alignItems: 'center', rowGap: 'var(--sectionGap)' }}
      >
        <PerksNEquity />
        <Apply />
      </div>
    </BaseLayout>
  );
}
