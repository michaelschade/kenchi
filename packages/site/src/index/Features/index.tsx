import React, { ReactNode, useEffect, useRef } from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../../breakpoints';
import { BaseSection } from '../../components/BaseSection';
import { gsap } from '../../utils/gsap';
import { DemoVideo } from './DemoVideo';
import imgCollection from './images/collection.webp';
import imgEditCollection from './images/edit_collection.webp';
import imgSuggestion from './images/suggestion.webp';
import imgSYBG from './images/SYBG.webp';

const Feature = ({
  id,
  title,
  tagline,
  description,
  children,
}: {
  id: string;
  title: string;
  tagline: string;
  description: ReactNode;
  children: React.ReactChild | React.ReactChild[];
}) => {
  const style = css`
    ${Breakpoints.small} {
      gap: 0;
    }
  `;
  return (
    <BaseSection id={`feature-${id}`} className="feature" css={style}>
      <div className="content">
        <span className="eyebrow">{title}</span>
        <h2>{tagline}</h2>
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>

      <div className="images">{children}</div>
    </BaseSection>
  );
};

const style = css`
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;

  .feature {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    visibility: hidden;

    // The first one should be visible so we can see some periwinkly on initial scroll
    &:first-of-type {
      visibility: visible;
    }

    .images > * {
      position: absolute;
      filter: drop-shadow(var(--assetShadow));
      text-shadow: var(--assetShadow);
      border-radius: 0.5rem;
    }
  }

  .content {
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

  .images {
    grid-column: 9 / span 8;
    position: relative;
    background-color: ${BrandColors.periwinkle};
    user-select: none;

    ${Breakpoints.small} {
      grid-column: span 16;
      height: 50vh;
    }
  }

  #feature-snippets_and_playbooks .demo_video_container {
    --aspect: 1.86;
    --height: 80vh;

    height: var(--height);
    left: -15%;
    max-height: 800px;
    top: max(10vh, calc(50% - 400px));
    position: relative;
    width: calc(var(--height) * var(--aspect));

    ${Breakpoints.small} {
      --width: 90vw;

      height: calc(var(--width) / var(--aspect));
      width: var(--width);
      left: calc(50% - var(--width) / 2);
      top: calc(50% - calc(var(--width) / var(--aspect)) / 2);
    }
  }

  #feature-data_and_insights img {
    --aspect: 1.53;

    height: 80vh;
    left: -15%;
    max-height: 800px;
    top: max(10vh, calc(50% - 400px));

    ${Breakpoints.small} {
      --width: 90vw;

      height: unset;
      max-height: unset;
      width: var(--width);
      left: calc(50% - var(--width) / 2);
      top: calc(50% - calc(var(--width) / var(--aspect)) / 2);
    }
  }

  #feature-security_and_permissions img {
    --aspect: 0.79;
    --height: 70vh;
    --maxWidth: 40vw;

    ${Breakpoints.small} {
      --maxWidth: 90vw;
      --height: 40vh;
    }

    --width: min(var(--maxWidth), calc(var(--height) * var(--aspect)));
    --computedHeight: calc(var(--width) / var(--aspect));
    height: var(--computedHeight);
    top: calc(50% - var(--computedHeight) / 2);
    left: calc(50% - var(--width) / 2);
  }

  #feature-collaboration {
    --suggestionAspect: 0.77;
    --suggestionWidth: min(480px, 30vw);
    --suggestionTopOffset: 0vw;
    --suggestionLeftOffset: min(0px, 5vw);
    --suggestionHeight: calc(var(--suggestionWidth) / var(--suggestionAspect));

    ${Breakpoints.medium} {
      --suggestionWidth: min(480px, 40vw);
    }

    ${Breakpoints.small} {
      --suggestionHeight: 40vh;
      --suggestionWidth: calc(
        var(--suggestionHeight) * var(--suggestionAspect)
      );
      --suggestionTopOffset: -4vw;
      --suggestionLeftOffset: 0vw;
    }

    --suggestionTop: calc(
      50% - var(--suggestionHeight) / 2 - var(--suggestionTopOffset)
    );
    --suggestionLeft: calc(
      50% - var(--suggestionWidth) / 2 + var(--suggestionLeftOffset)
    );

    .suggestion {
      width: var(--suggestionWidth);
      top: var(--suggestionTop);
      left: var(--suggestionLeft);
    }

    .sybg {
      --width: calc(var(--suggestionWidth) / 1.5);
      --height: calc(var(--width) * 32 / 100);
      width: var(--width);
      top: calc(var(--suggestionTop) - calc(var(--height) / 2));
      right: calc(var(--suggestionLeft) - calc(var(--width) / 4));
      filter: drop-shadow(0px 0px 10px rgba(0, 6, 54, 0.1));
    }
  }
`;

// Duration in number of frames. Will automatically scale to the scroll height
// of the div, so the only relevance of these numbers is in relation to reach
// other.
const ENTRANCE_DURATION = 10;
const HOLD_DURATION = 10;
const EXIT_DURATION = 10;

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const _pinTl = gsap.timeline({
      scrollTrigger: {
        id: 'features-bg',
        trigger: el,
        pin: true,
        anticipatePin: 0.5,
        start: 'top top',
        end: '+=600%',
        scrub: true,
      },
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'features',
        trigger: el,
        start: 'top center',
        end: '+=700%',
        scrub: true,
      },
    });

    const startFrame = (index: number) =>
      index * (ENTRANCE_DURATION + HOLD_DURATION + EXIT_DURATION);

    const snippetsAndPlaybooks = el.querySelector(
      '#feature-snippets_and_playbooks'
    )!;
    const dataAndInsights = el.querySelector('#feature-data_and_insights')!;
    const securityAndPermissions = el.querySelector(
      '#feature-security_and_permissions'
    )!;
    const collaboration = el.querySelector('#feature-collaboration')!;
    const sections = [
      snippetsAndPlaybooks,
      dataAndInsights,
      securityAndPermissions,
      collaboration,
    ];
    sections.forEach((feature, i) => {
      const content = feature.querySelector<HTMLDivElement>('.content')!;
      tl.set(feature, { visibility: 'visible' }, startFrame(i)).fromTo(
        content,
        { opacity: 0, translateY: 100 },
        {
          opacity: 1,
          translateY: 0,
          duration: ENTRANCE_DURATION,
          ease: 'power1.out',
        },
        startFrame(i)
      );
      if (i === sections.length - 1) {
        // NOOP at the last frame so we ensure every section is the same number
        // of frames.
        tl.set(feature, {}, startFrame(i + 1));
      } else {
        tl.fromTo(
          content,
          {},
          {
            opacity: 0,
            translateY: -100,
            duration: EXIT_DURATION,
            ease: 'power1.in',
          },
          startFrame(i + 1) - EXIT_DURATION
        ).set(feature, { visibility: 'hidden' }, startFrame(i + 1));
      }
    });

    const demoVideo = snippetsAndPlaybooks.querySelector<HTMLDivElement>(
      '.demo_video_container'
    )!;
    tl.fromTo(
      demoVideo,
      { opacity: 0, translateX: 600 },
      {
        opacity: 1,
        translateX: 0,
        duration: ENTRANCE_DURATION,
        ease: 'power1.out',
      },
      startFrame(0)
    ).fromTo(
      demoVideo,
      {},
      {
        opacity: 0,
        translateX: -600,
        duration: EXIT_DURATION,
        ease: 'power1.in',
      },
      startFrame(1) - EXIT_DURATION
    );

    const dataAndInsightsImage =
      dataAndInsights.querySelector<HTMLImageElement>('.images img')!;
    tl.fromTo(
      dataAndInsightsImage,
      { opacity: 0, translateX: 600 },
      {
        opacity: 1,
        translateX: 0,
        duration: ENTRANCE_DURATION,
        ease: 'power1.out',
      },
      startFrame(1)
    ).fromTo(
      dataAndInsightsImage,
      {},
      {
        opacity: 0,
        translateX: -600,
        duration: EXIT_DURATION,
        ease: 'power1.in',
      },
      startFrame(2) - EXIT_DURATION
    );

    const securityAndPermissionsImage =
      securityAndPermissions.querySelector<HTMLImageElement>('.images img')!;
    tl.fromTo(
      securityAndPermissionsImage,
      { opacity: 0, translateX: 600 },
      {
        opacity: 1,
        translateX: 0,
        duration: ENTRANCE_DURATION,
        ease: 'power1.out',
      },
      startFrame(2)
    ).fromTo(
      securityAndPermissionsImage,
      {},
      {
        opacity: 0,
        translateX: -600,
        duration: EXIT_DURATION,
        ease: 'power1.in',
      },
      startFrame(3) - EXIT_DURATION
    );

    const collaborationSYBG =
      collaboration.querySelector<HTMLImageElement>('.images .sybg')!;
    tl.fromTo(
      collaborationSYBG,
      { opacity: 0, translateX: 600, translateY: -600, rotate: 35 },
      {
        opacity: 1,
        translateX: 0,
        translateY: 0,
        rotate: 10,
        duration: ENTRANCE_DURATION,
        ease: 'power1.out',
      },
      startFrame(3)
    );

    const collaborationSuggestion =
      collaboration.querySelector<HTMLImageElement>('.images .suggestion')!;
    tl.fromTo(
      collaborationSuggestion,
      { opacity: 0, translateX: -600, translateY: 600 },
      {
        opacity: 1,
        translateX: 0,
        translateY: 0,
        duration: ENTRANCE_DURATION,
        ease: 'power1.out',
      },
      startFrame(3)
    );
  }, []);

  return (
    <div ref={ref} css={style} id="features">
      <Feature
        id="snippets_and_playbooks"
        title="Snippets &amp; Playbooks"
        tagline="Everything in one place—easy to find, easy to update."
        description="There are dozens of steps between a customer writing in and solving their issue. Kenchi provides a central location to condense those steps into a simple interface: from finding quick snippets to full troubleshooting guides, you can now delight your customers with faster and better responses."
      >
        <div className="demo_video_container">
          <DemoVideo />
        </div>
      </Feature>
      <Feature
        id="data_and_insights"
        title="Data &amp; Insights"
        tagline="CSAT, demystified: discover what’s driving your numbers."
        description="Pinpoint what content is dragging you below target, recognize team members punching above their weight class, and tease out product improvements."
      >
        <img src={imgCollection} alt="" />
      </Feature>
      <Feature
        id="security_and_permissions"
        title="Security &amp; Permissions"
        tagline="Curated content, fine-grained permissions, and peace of mind."
        description={
          <p>
            Kenchi is security-first. Everything happens locally, keeping your
            PII &amp; PHI out of view. Organize snippets and playbooks into
            collections that are shared with specific people or teams based on
            their speciality or level of access. Version control helps track
            changes and rewind history.
          </p>
        }
      >
        <img src={imgEditCollection} alt="" />
      </Feature>
      <Feature
        id="collaboration"
        title="Collaboration"
        tagline="Breathe more easily… everyone &amp; everything is up to date."
        description="New team members, changing processes, product updates… there’s a lot happening in support. Proposed updates, one-click reviews, and change logs are some of the ways Kenchi helps the best ideas flourish and keeps everyone on the same page."
      >
        <img src={imgSuggestion} className="suggestion" alt="" />
        <img src={imgSYBG} className="sybg" alt="" />
      </Feature>
    </div>
  );
}
