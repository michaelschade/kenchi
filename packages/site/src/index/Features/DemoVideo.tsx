import React, { useEffect, useRef, useState } from 'react';

import { css } from '@emotion/react';

import { BreakpointsInt } from '../../breakpoints';
import videoMP4 from './video.mp4';

const videoContainerStyle = css`
  height: 100%;
  video {
    height: 100%;
    border-radius: 0.5rem;
  }
`;

export const DemoVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [videoIsInViewport, setVideoIsInViewport] = useState(false);

  const maybeShowControls = () => {
    if (window.innerWidth < BreakpointsInt.small) {
      setShowControls(true);
    }
  };

  useEffect(() => {
    // set up an intersection observer to check if video is in view
    const videoEl = videoRef.current;

    if (!videoEl) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoIsInViewport(true);
        } else {
          setVideoIsInViewport(false);
        }
      },
      { root: null, rootMargin: '0px' }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }
    const isPlaying =
      videoEl.currentTime > 0 &&
      !videoEl.paused &&
      !videoEl.ended &&
      videoEl.readyState > 2;
    if (videoIsInViewport && !isPlaying) {
      videoEl.play();
    }
    if (!videoIsInViewport && isPlaying) {
      videoEl.pause();
    }
  }, [videoIsInViewport]);

  return (
    <div css={videoContainerStyle}>
      <video
        ref={videoRef}
        onClick={maybeShowControls}
        loop
        muted
        playsInline
        controls={showControls}
      >
        <source src={videoMP4} type="video/mp4" />
      </video>
    </div>
  );
};
