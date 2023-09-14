import { useCallback, useEffect, useRef } from 'react';

import useResizeObserver from 'use-resize-observer';

function resizeCanvas(canvas: HTMLCanvasElement, referenceElem: HTMLElement) {
  const { devicePixelRatio: ratio = 1 } = window;

  const { width, height } = referenceElem.getBoundingClientRect();
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.getContext('2d')?.scale(ratio, ratio);
}

export type DrawCallback = (
  canvas: HTMLCanvasElement,
  frameCount: number
) => void;

const useCanvas = (
  draw: DrawCallback,
  { loop, referenceElem }: { loop: boolean; referenceElem: HTMLElement }
) => {
  const frameCount = useRef(0);
  const animationFrameId = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    frameCount.current++;
    draw(canvasRef.current, frameCount.current);
    if (loop) {
      animationFrameId.current = window.requestAnimationFrame(render);
    }
  }, [draw, loop]);

  const resizeAndRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    resizeCanvas(canvas, referenceElem);
    render();
  }, [render, referenceElem]);

  useEffect(resizeAndRender, [resizeAndRender]);

  useResizeObserver({
    onResize: resizeAndRender,
    ref: typeof window === 'undefined' ? undefined : referenceElem,
  });

  return canvasRef;
};

export default useCanvas;
