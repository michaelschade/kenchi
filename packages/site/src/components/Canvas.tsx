import React from 'react';

import useCanvas, { DrawCallback } from '../utils/useCanvas';

type CanvasProps = React.DetailedHTMLProps<
  React.CanvasHTMLAttributes<HTMLCanvasElement>,
  HTMLCanvasElement
> & {
  draw: DrawCallback;
  loop?: boolean;
  referenceElem: HTMLElement;
};
const Canvas = ({ draw, loop = true, referenceElem, ...rest }: CanvasProps) => {
  const canvasRef = useCanvas(draw, { loop, referenceElem });

  return <canvas ref={canvasRef} {...rest} />;
};

export default Canvas;
