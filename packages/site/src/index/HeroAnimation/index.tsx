import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
} from 'react';

import styled from '@emotion/styled';
import classNames from 'classnames/bind';
import shuffle from 'lodash/shuffle';
import lottie, { AnimationItem } from 'lottie-web';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../../breakpoints';
import isDevelopment from '../../utils/isDevelopment';
import iconArrowLilacData from './lottie/icon-arrow-lilac.json';
import iconBloomGreenData from './lottie/icon-bloom-green.json';
import iconBloomWhiteData from './lottie/icon-bloom-white.json';
import iconChartWhiteData from './lottie/icon-chart-white.json';
import iconScriptData from './lottie/icon-script.json';
import iconShapes1Data from './lottie/icon-shapes-1.json';
import iconShapes2Data from './lottie/icon-shapes-2.json';
import iconSmileData from './lottie/icon-smile.json';
import iconSparkData from './lottie/icon-spark.json';
import iconStackData from './lottie/icon-stack.json';

const Hero = styled.div`
  position: relative;
  width: 100%;

  .grid {
    .grid-h-0 {
      display: none;
    }

    ${Breakpoints.small} {
      .grid-v-0 {
        display: none;
      }

      .grid-h-0 {
        display: block;
      }
    }

    .grid-h {
      transform: translateX(100%);
      transition: transform 0.5s ease-in-out;
    }

    .grid-v {
      transform: translateY(-100%);
      transition: transform 0.5s ease-in-out;
    }

    .grid-v-1 {
      transition-delay: 0.05s;
    }
    .grid-h-0 {
      transition-delay: 0.05s;
    }
    .grid-v-0 {
      transition-delay: 0.1s;
    }
    .grid-h-1 {
      transition-delay: 0.15s;
    }
    .grid-h-3 {
      transition-delay: 0.2s;
    }
    .grid-v-2 {
      transition-delay: 0.25s;
    }
    .grid-h-2 {
      transition-delay: 0.3s;
    }
    .grid-v-3 {
      transition-delay: 0.35s;
    }

    &.active {
      .grid-h,
      .grid-v {
        transform: translateX(0) translateY(0);
      }
    }
  }

  & > div {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
  }
`;

type Part = {
  name: string;
  data: any;
  loopSegment: [number, number];
  needsReverse?: boolean;
};

const INITIAL_ANIMATION_LENGTH = 94;
const PARTS: Part[] = [
  // 4-item (bottom) row
  {
    name: 'icon-shapes-1',
    data: iconShapes1Data,
    loopSegment: [368, 396],
    needsReverse: true,
  },
  {
    name: 'icon-bloom-white',
    data: iconBloomWhiteData,
    loopSegment: [104, 140],
  },
  {
    name: 'icon-arrow-lilac',
    data: iconArrowLilacData,
    loopSegment: [410, 446],
    needsReverse: true,
  },
  {
    name: 'icon-script',
    data: iconScriptData,
    loopSegment: [243, 275],
    needsReverse: true,
  },
  // 3-item row
  {
    name: 'icon-stack',
    data: iconStackData,
    loopSegment: [200, 229],
    needsReverse: true,
  },
  {
    name: 'icon-shapes-2',
    data: iconShapes2Data,
    loopSegment: [609, 637],
    needsReverse: true,
  },
  {
    name: 'icon-spark',
    data: iconSparkData,
    loopSegment: [155, 193],
  },
  // 2-item row
  {
    name: 'icon-bloom-green',
    data: iconBloomGreenData,
    loopSegment: [296, 314],
  },
  {
    name: 'icon-smile',
    data: iconSmileData,
    loopSegment: [510, 542],
    needsReverse: true,
  },
  // 1-item (top) row
  {
    name: 'icon-chart-white',
    data: iconChartWhiteData,
    loopSegment: [557, 610],
    needsReverse: true,
  },
];

export type HeroAnimationRef = {
  animateAll: () => void;
};

const HeroAnimation = React.forwardRef(
  (
    props: React.HTMLAttributes<HTMLDivElement>,
    ref: React.Ref<HeroAnimationRef>
  ) => {
    const [loadCount, incrLoadCount] = useReducer((i) => i + 1, 0);
    const [playOnClickIndex, incrPlayOnClickIndex] = useReducer(
      (i) => (i + 1) % PARTS.length,
      0
    );
    const [introDone, setIntroDone] = useState(false);

    const animationParts = useRef<AnimationItem[]>([]);

    const randomIndexOrder = useRef<number[]>([]);
    const pendingReversals = useRef(new Set<number>());

    const initPart = (index: number, elem: HTMLDivElement | null) => {
      if (animationParts.current[index] || !elem) {
        // We probably hot reloaded in dev
        return;
      }
      const anim = lottie.loadAnimation({
        container: elem,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: PARTS[index].data,
      });
      anim.addEventListener('DOMLoaded', () => {
        incrLoadCount();
      });
      animationParts.current[index] = anim;
    };

    useEffect(() => {
      if (loadCount !== PARTS.length) {
        return;
      }
      animationParts.current.forEach((anim) => {
        anim.playSegments([0, INITIAL_ANIMATION_LENGTH], true);
      });
      const timeout = window.setTimeout(() => {
        setIntroDone(true);
      }, (INITIAL_ANIMATION_LENGTH / 24) * 1000);
      return () => window.clearTimeout(timeout);
    }, [loadCount]);

    const playSegment = useCallback((index: number) => {
      const { loopSegment, needsReverse } = PARTS[index];
      const anim = animationParts.current[index];

      if (!anim.isPaused) {
        // Don't restart an already playing animation
        return;
      }

      if (pendingReversals.current.has(index)) {
        anim.playSegments([loopSegment[1], loopSegment[0]], true);
        pendingReversals.current.delete(index);
      } else {
        anim.playSegments(loopSegment, true);
        if (needsReverse) {
          pendingReversals.current.add(index);
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        animateAll: () => PARTS.forEach((_, index) => playSegment(index)),
      }),
      [playSegment]
    );

    useEffect(() => {
      if (!introDone) {
        return;
      }

      const pickRandomPart = (): number => {
        if (randomIndexOrder.current.length === 0) {
          randomIndexOrder.current = shuffle([...PARTS.keys()]);
        }
        return randomIndexOrder.current.pop()!;
      };

      let timeout: number | undefined;

      const randomAnimationLoop = () => {
        const delay = Math.random() * 2500 + 2500; // 2.5s - 5s between animation starts
        timeout = window.setTimeout(() => {
          if (!document.hidden) {
            playSegment(pickRandomPart());
          }
          randomAnimationLoop();
        }, delay);
      };

      randomAnimationLoop();
      return () => {
        timeout && window.clearTimeout(timeout);
      };
    }, [introDone, playSegment]);

    return (
      <Hero
        {...props}
        onClick={() => {
          if (isDevelopment()) {
            playSegment(playOnClickIndex);
            incrPlayOnClickIndex();
          }
        }}
      >
        <svg
          className={classNames('grid', { active: loadCount === PARTS.length })}
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M 0 ${i * 100} L 400 ${i * 100}`}
              className={`grid-h grid-h-${i}`}
              fill="none"
              stroke={BrandColors.grey}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M ${i * 100} 0 L ${i * 100} 400`}
              className={`grid-v grid-v-${i}`}
              fill="none"
              stroke={BrandColors.grey}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {/* <div className="lines" ref={(elem) => initLines(elem)} /> */}
        {PARTS.map(({ name }, i) => (
          <div
            className={`part-${name}`}
            ref={(elem) => initPart(i, elem)}
            key={i}
          />
        ))}
      </Hero>
    );
  }
);

export default HeroAnimation;
