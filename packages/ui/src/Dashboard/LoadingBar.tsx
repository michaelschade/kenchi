import { useCallback, useEffect, useState } from 'react';

import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const MAX_FAKE_PROGRESS = 90;
const MIN_PROGRESS_INCREMENT = 10;
const PROGRESS_HIDE_DELAY_MS = 800;
const PROGRESS_HIDE_DURATION_MS = 500;
const PROGRESS_INCREMENET_RANDOM_RANGE = 5;
const PROGRESS_TRANSITION_DURATION_MS = 300;
const RANDOM_PROGRESS_INTERVAL_MS = 200;
const BAR_HEIGHT = 3;

const hide = keyframes`
  0% {
    top: 0;
  }
  100% {
    top: -${BAR_HEIGHT}px;
  }
`;

type PropsForLoadingBarBar = {
  progress: number;
};

const LoadingBarBar = styled.div<PropsForLoadingBarBar>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${BAR_HEIGHT}px;
  background-color: ${({ theme }) => theme.colors.accent[8]};
  z-index: 1;
  transform: ${({ progress }) => `translateX(-${100 - progress}%)`};
  transition: transform ${PROGRESS_TRANSITION_DURATION_MS}ms ease-in-out;
  animation: ${({ progress }) =>
    progress === 100
      ? css`
          ${hide} ${PROGRESS_HIDE_DURATION_MS}ms ease ${PROGRESS_HIDE_DELAY_MS}ms forwards
        `
      : 'none'};
`;

type PropsForLoadingBar = {
  isLoading: boolean;
};

export const LoadingBar = ({ isLoading }: PropsForLoadingBar) => {
  const [progress, setProgress] = useState(isLoading ? 0 : 100);
  const makeRandomProgress = useCallback(() => {
    setProgress(
      Math.min(
        progress +
          MIN_PROGRESS_INCREMENT +
          Math.random() * PROGRESS_INCREMENET_RANDOM_RANGE,
        MAX_FAKE_PROGRESS
      )
    );
  }, [progress]);

  useEffect(() => {
    if (progress === 0) {
      makeRandomProgress();
    } else if (progress < MAX_FAKE_PROGRESS) {
      const timeout = setTimeout(
        makeRandomProgress,
        RANDOM_PROGRESS_INTERVAL_MS
      );
      return () => clearTimeout(timeout);
    }
  }, [makeRandomProgress, progress]);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
    }
  }, [isLoading]);

  return <LoadingBarBar progress={progress} />;
};
