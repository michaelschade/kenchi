import '../global';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { css, Global } from '@emotion/react';
import tw from 'twin.macro';

import { Browser } from './Browser';
import { wireframes, WireframeType, wireframeTypes } from './wireframes';

const style = css`
  position: relative;
`;

const anim = css`
  ${tw`absolute transition-all`};
  transition: left 1200ms;
  left: 0px;
  z-index: 0;
  height: 100vh;
  width: 100vw;
`;

// Using body/iframe to ensure higher priority than default styles
const iframeStyles = css`
  body iframe#kenchi-iframe {
    display: block;
    opacity: 0;
    top: 29px;
    height: calc(100vh - 29px);
    transition: all 0.15s ease-in-out, left 1200ms, opacity 0.4s ease-in-out;

    &.kenchi-active {
      box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.2),
        0 0 20px -3px rgba(0, 0, 0, 0.25);
    }

    &.kenchi-open {
      /* We default Kenchi open, but hide it for the demo timing. */
      left: -100vw;
    }
  }

  .demo-video-viewport {
    margin-left: 0;
    transition: all 0.15s ease-in-out, margin-left 1200ms;
    height: 100%;
  }
`;

type Props = {
  type: WireframeType;
  onComplete: () => void;
  active: boolean;
};

const WireframeDemoPage = ({ type, onComplete, active }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const delayAmount = type === 'gmail' ? 2400 : 1900;

  useEffect(() => {
    // Don't re-show for the last step when we loop back to intercom
    if (type === 'intercom') {
      return;
    }

    const iframe = document.getElementById('kenchi-iframe');
    if (!iframe) {
      return;
    }

    setTimeout(() => {
      console.log('Resetting kenchi', type);
      // We need to reset the position so Kenchi slides in at the same speed at the margin
      iframe.style.left = '-300px';
    }, 300);

    setTimeout(() => {
      console.log('Showing kenchi', type);
      iframe.style.left = '0px';
      iframe.style.opacity = '1';
      if (ref.current) {
        ref.current.style.marginLeft = '300px';
      }
    }, 1500);
  }, [active, type]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const body = ref.current.querySelector('.message-text');
    if (!body) {
      return;
    }

    const onPaste = () => {
      const iframe = document.getElementById('kenchi-iframe');
      if (!iframe) {
        return;
      }
      setTimeout(() => {
        onComplete();
        console.log('Hiding kenchi', type);
        iframe.style.left = '-100vw';
        iframe.style.opacity = '0';
      }, delayAmount);
    };

    body.addEventListener('paste', onPaste);
    return () => body.removeEventListener('paste', onPaste);
  }, [delayAmount, onComplete, type]);

  const wireframe = wireframes[type];
  return (
    <Browser hostname={wireframe.hostname}>
      <div ref={ref} className="demo-video-viewport">
        <wireframe.Component />
      </div>
    </Browser>
  );
};

export default function DemoVideoPage() {
  const [index, incrIndex] = useReducer((i) => i + 1, 0);
  const gmailRef = useRef<HTMLDivElement>(null);
  const intercomRef = useRef<HTMLDivElement>(null);
  const zendeskRef = useRef<HTMLDivElement>(null);
  const intercom2Ref = useRef<HTMLDivElement>(null);
  const [intercomLeft, setIntercomLeft] = useState('0%');
  const [intercom2Left, setIntercom2Left] = useState('100%');
  const [zendeskLeft, setZendeskLeft] = useState('100%');
  const [gmailLeft, setGmailLeft] = useState('100%');

  const intercomComplete = useCallback(() => {
    if (index === 0) {
      setIntercomLeft('-100%');
      setZendeskLeft('0%');
    }
  }, [index]);

  const zendeskComplete = useCallback(() => {
    if (index === 1) {
      console.log('Zendesk complete');
      setZendeskLeft('-100%');
      setGmailLeft('0%');
    }
  }, [index]);

  const gmailComplete = useCallback(() => {
    if (index === 2) {
      setGmailLeft('-100%');
      setIntercom2Left('0%');
    }
  }, [index]);

  // TODO: Setup ref & destroy old elem here
  useLayoutEffect(() => {
    [intercomRef.current, zendeskRef.current, gmailRef.current].forEach(
      (ref) => {
        if (ref) {
          ref.addEventListener('transitionend', (event) => {
            if (ref && event.target === ref && ref.style.left === '-100%') {
              ref.remove();
              incrIndex();
              console.log('Advancing index');
            }
          });
        }
      }
    );
  }, [gmailRef, intercomRef, zendeskRef]);

  return (
    <div css={style}>
      <Global styles={iframeStyles} />
      <div css={anim} style={{ left: intercomLeft }} ref={intercomRef}>
        {index === 0 && (
          <WireframeDemoPage
            type={wireframeTypes[1]}
            onComplete={intercomComplete}
            active={index === 0}
          />
        )}
      </div>
      <div css={anim} style={{ left: zendeskLeft }} ref={zendeskRef}>
        {index <= 1 && (
          <WireframeDemoPage
            type={wireframeTypes[2]}
            onComplete={zendeskComplete}
            active={index === 1}
          />
        )}
      </div>
      <div css={anim} style={{ left: gmailLeft }} ref={gmailRef}>
        {index <= 2 && (
          <WireframeDemoPage
            type={wireframeTypes[0]}
            onComplete={gmailComplete}
            active={index === 2}
          />
        )}
      </div>
      <div css={anim} style={{ left: intercom2Left }} ref={intercom2Ref}>
        {index <= 3 && (
          <WireframeDemoPage
            type={wireframeTypes[1]}
            onComplete={() => {}}
            active={index === 3}
          />
        )}
      </div>
    </div>
  );
}
