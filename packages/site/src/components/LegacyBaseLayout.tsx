import React, { useCallback, useRef } from 'react';

import { css, Global, SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';
import { Helmet } from 'react-helmet';

import Canvas from './Canvas';
import opengraphImg from './opengraphImg.png';

const global = css`
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inconsolata:wght@200;300;400;500;600;700;800;900&display=swap');

  * {
    box-sizing: border-box;
  }

  /* Base variables that don't compute from other vars */
  html {
    /* Base layout */
    --scrollbarHeight: 0px;
    --scrollbarWidth: 0px;
    --windowWidth: calc(100vw - var(--scrollbarWidth));
    --windowHeight: calc(100vh - var(--scrollbarHeight));

    --layoutPaddingXNormal: 24px;
    --layoutPaddingXMedium: 40px;
    --layoutPaddingXLarge: 80px;

    --layoutPaddingYNormal: 24px;
    --layoutPaddingYMedium: 32px;
    --layoutPaddingYLarge: 64px;

    --layoutMaxWidth: 1080px;

    --viewportWidthSmall: 375;
    --viewportWidthMedium: 600;
    --viewportWidthLarge: 1112;

    --sectionGapNormal: 64px;
    --sectionGapMedium: 64px;
    --sectionGapLarge: 80px;

    /* Grid system */
    --rowGapNormal: 8px;
    --rowGapMedium: 16px;
    --rowGapLarge: 24px;
    --rowGapXLarge: 32px;

    --columnGapNormal: 8px;
    --columnGapMedium: 16px;
    --columnGapLarge: 24px;
    --columnGapXLarge: 32px;

    --rowGap: var(--rowGapMedium);
    --columnGap: var(--columnGapXLarge);

    /* Font bases */
    -webkit-font-smoothing: antialiased;
    --fontFamily: 'EB Garamond', serif;
    --codeFontFamily: 'Inconsolata', monospace;

    /* Font sizes */
    --titleFontSize: 24px;
    --captionFontSize: 24px;
    --bodyFontSize: 18px;
    --codeFontSize: 18px;
    --smallFontSize: 14px;

    --fontWeightLight: 400;
    --fontWeightNormal: 400;
    --fontWeightSemibold: 500;
    --fontWeightBold: 600;
    --fontWeightHeavy: 700;

    --codeFontWeightLight: 200;
    --codeFontWeightNormal: 300;
    --codeFontWeightSemibold: 400;
    --codeFontWeightBold: 700;
    --codeFontWeightHeavy: 800;

    /* Colors */
    --sectionBackgroundColor: #fcfcfc;
    --titleColor: #0c0b0d;
    --textColor: #0c0b0d;
    --subtleTextColor: #626166;
    --placeholderColor: #626166;
    --highlightBackgroundColor: #0c0b0d;
    --highlightTextColor: #fff;
    --linkColor: #0c0b0d;
    --linkHoverColor: #000;

    --blockBackgroundColor: #0c0b0d;
    --blockTextColor: #fff;

    --inputBackgroundColor: #fff;
    --inputFocusTextColor: #fff;
    --inputFocusBackgroundColor: #000;
    --buttonFocusTextColor: var(--inputFocusTextColor);
    --buttonFocusBackgroundColor: var(--inputFocusBackgroundColor);
    --borderColor: #0c0b0d;
    --borderFocusColor: #000;
    --shadowColor: #0c0b0d;
    --shadowFocusColor: #000;

    /* Effects */
    --shadowNone: 0 0 0 0 transparent;
    --shadow: 2px 2px 0 0 var(--shadowColor);
    --shadowFocus: 4px 4px 0 0 var(--shadowFocusColor);
    --buttonShadowFocus: 0 2px 0 0 var(--shadowColor);

    /* Animations */
    --hoverTransition: 150ms ease-in;
    --shadowTransition: 150ms ease-in;
  }

  /* Responsive variable selection */
  @media (max-width: 800px) {
    html {
      --columnMaxCount: 1;
      --layoutPaddingX: var(--layoutPaddingXNormal);
      --layoutPaddingY: var(--layoutPaddingYNormal);

      --sectionGap: var(--sectionGapNormal);
      --rowGap: var(--rowGapMedium);
      --columnGap: var(--columnGapMedium);

      --titleFontSize: 20px;
      --captionFontSize: 20px;
    }

    [data-columns='1,1,1'],
    [data-columns='1,1,1,1'],
    [data-columns='2,2'] {
      grid-template-columns: 1fr;
    }

    [data-columns-preserve][data-columns='1,1,1'],
    [data-columns-preserve][data-columns='1,1,1,1'],
    [data-columns-preserve][data-columns='2,2'] {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 800px) {
    html {
      --columnMaxCount: 2;
      --layoutPaddingX: var(--layoutPaddingXMedium);
      --layoutPaddingY: var(--layoutPaddingYMedium);
      --sectionGap: var(--sectionGapMedium);
    }

    [data-columns='1,1,1'] {
      grid-template-columns: repeat(3, 1fr);
    }

    [data-columns='1,1,1,1'],
    [data-columns='2,2'],
    [data-columns='2,1,1'] {
      grid-template-columns: repeat(2, 1fr);
    }

    [data-columns='1,3'] {
      grid-template-columns: 1fr 3fr;
    }

    [data-columns='3,1'] {
      grid-template-columns: 3fr 1fr;
    }
  }

  @media (min-width: 1100px) {
    html {
      --columnMaxCount: 4;
      --layoutPaddingX: var(--layoutPaddingXMedium);
      --layoutPaddingY: var(--layoutPaddingYMedium);
      --sectionGap: var(--sectionGapMedium);
    }

    [data-columns='1,1,1,1'] {
      grid-template-columns: repeat(4, 1fr);
    }

    [data-columns='2,1,1'] {
      grid-template-columns: 2fr 1fr 1fr;
    }

    [data-columns='1,1,2'] {
      grid-template-columns: 1fr 1fr 2fr;
    }
  }

  @media (min-width: 1200px) {
    html {
      --columnMaxCount: 4;
      --layoutPaddingX: var(--layoutPaddingXLarge);
      --layoutPaddingY: var(--layoutPaddingYLarge);
      --sectionGap: var(--sectionGapLarge);
    }
  }

  /* Computed variables (accounting for media selectors) */

  [data-columns] {
    display: grid;
    column-gap: var(--columnGap);
    row-gap: var(--rowGap);
    place-items: start;
    place-content: start;
  }

  html {
    /* Layout base */
    --layoutWidth: min(
      calc(var(--windowWidth) - var(--layoutPaddingX) * 2),
      var(--layoutMaxWidth)
    );
    --columnMaxWidth: calc(var(--layoutWidth) / var(--columnMaxCount));

    /* Font instances */
    --titleFont: var(--fontWeightHeavy) var(--titleFontSize) /
      var(--titleLineHeight, 1.04) var(--fontFamily);
    --captionFont: var(--fontWeightBold) var(--captionFontSize) /
      var(--captionLineHeight, 1.555555556) var(--fontFamily);
    --bodyFont: var(--fontWeightNormal) var(--bodyFontSize) /
      var(--bodyLineHeight, 1.555555556) var(--fontFamily);
    --codeFont: var(--codeFontWeightNormal) var(--bodyFontSize) /
      var(--bodyLineHeight, 1.555555556) var(--codeFontFamily);
  }

  blockquote,
  figure,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  code,
  pre,
  address,
  ul {
    margin: 0;
    padding: 0;
  }

  *::selection {
    background: var(--highlightBackgroundColor);
    color: var(--highlightTextColor);
  }

  code,
  .monospace {
    font-family: 'Inconsolata', monospace;
    -webkit-font-smoothing: none;
  }
`;

const Container = styled.div`
  min-height: var(--windowHeight);
  min-width: var(--windowWidth);
  background: var(--sectionBackgroundColor);
`;

const Layout = styled.div`
  min-height: 100vh;
  max-width: var(--layoutWidth);
  position: relative;
  z-index: 1;

  margin: 0 var(--layoutPaddingX);
  padding: var(--layoutPaddingY) 0;

  header {
    display: grid;
    row-gap: calc(var(--rowGapNormal) / 2);
  }

  h1 {
    font: var(--titleFont);

    &.modern {
    }
  }

  h2 {
    font: var(--captionFont);
  }

  h3 {
    font: var(--bodyFont);
    font-weight: var(--fontWeightHeavy);
  }

  p {
    font: var(--bodyFont);
    word-break: break-word;
  }

  ul {
    font: var(--bodyFont);
    padding: 0 0 0 var(--bodyFontSize);
  }

  address {
    font: var(--bodyFont);
    padding: 0 0 0 var(--bodyFontSize);
  }

  strong {
    font-weight: var(--fontWeightBold);
  }

  a {
    margin: 0;
    display: inline-block;
    color: var(--linkColor);

    transition: var(--hoverTransition);
    transition-property: color;

    &:after {
      display: block;
      content: '';
      border-bottom: dotted 1px var(--linkHoverColor);
      transform: scaleX(0);
      transition: var(--hoverTransition);
      transform-origin: 0% 50%;
    }

    &:focus {
      outline: none;
    }

    &:hover {
      color: var(--linkHoverColor);
      text-decoration: none;

      &:after {
        transform: scaleX(1);
      }
    }
  }
`;

const Nav = styled.div`
  position: absolute;
  left: 0;
  bottom: var(--layoutPaddingYNormal);

  font: var(--codeFont);
  font-size: var(--smallFontSize);
  color: var(--textColor);

  ul {
    display: flex;
    gap: 1rem;
    padding: 0 !important;
    margin: 0;
  }

  li {
    list-style: none;
  }
`;

const Contents = styled.div`
  margin-bottom: 50px;
  @media (max-width: 800px) {
    margin-bottom: 150px;
  }
`;

const canvasStyle = css`
  position: absolute;
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

const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

type Ellipse = {
  xCenter: number;
  yCenter: number;
  xRadius: number;
  yRadius: number;
};

export const getEllipses = (
  canvasRect: DOMRect,
  copyRect: DOMRect,
  densityMultiplier: number
): Ellipse[] => {
  const rtn: Ellipse[] = [];
  if (document.body.scrollWidth > 800) {
    const xElipseEndPoint = copyRect.right - copyRect.width * densityMultiplier;
    const yElipseStartPoint = canvasRect.height + 5;
    rtn.push({
      xCenter: canvasRect.width + 5,
      yCenter: yElipseStartPoint,
      xRadius: canvasRect.width - xElipseEndPoint,
      yRadius: yElipseStartPoint,
    });
  } else {
    const xElipseEndPoint = copyRect.right - copyRect.width;
    const yElipseStartPoint = canvasRect.height;
    const yElipseEndPoint = canvasRect.height - copyRect.bottom + copyRect.y;
    rtn.push({
      xCenter: canvasRect.width + 5,
      yCenter: yElipseStartPoint,
      xRadius: canvasRect.width - xElipseEndPoint,
      yRadius: yElipseEndPoint,
    });
  }
  return rtn;
};

export const drawEllipse = (
  ctx: CanvasRenderingContext2D,
  ellipses: Ellipse[],
  step: number = 5,
  angleDeg: number = 30,
  color: string = 'rgb(0, 0, 0)',
  radiusMult: number = 1
) => {
  const enhancedElipses = ellipses.map((e) => ({
    ...e,
    xRadiusSq: e.xRadius * e.xRadius,
    yRadiusSq: e.yRadius * e.yRadius,
  }));

  const twoPi = Math.PI * 2;
  const maxRadius = step / 2;

  ctx.fillStyle = color;
  const xStart = ctx.canvas.width + step;
  const yStart = ctx.canvas.height + step;
  const xEnd = -step;
  const yEnd = -step;

  // 0 is up, 90 is left
  const angleRad = (angleDeg / 180) * Math.PI;
  const xStep = Math.abs(Math.sin(angleRad)) * step;
  const yStep = Math.abs(Math.cos(angleRad)) * step;

  const xDistBetweenRows = step / Math.abs(Math.cos(angleRad));
  let yIndex = -Math.floor(xStart / xDistBetweenRows);
  let y = yStart - yIndex * xStep;
  ctx.beginPath();
  while (y >= yEnd) {
    let x = xStart + yIndex * yStep;
    // Don't overdraw from negative yIndex
    if (y > yStart) {
      if (yStep === 0) {
        break;
      }
      const overSteps = ~~((y - yStart) / yStep);
      y -= overSteps * yStep;
      x -= overSteps * xStep;
    }
    // Don't overdraw from positive x offset to compensate for angle
    if (x > xStart) {
      if (xStep === 0) {
        break;
      }
      const overSteps = ~~((x - xStart) / xStep);
      y -= overSteps * yStep;
      x -= overSteps * xStep;
    }
    while (x >= xEnd && y >= yEnd) {
      let radius = 0;
      for (var i = 0; i < enhancedElipses.length; i++) {
        const ellipse = enhancedElipses[i];

        const distanceFromElipseCenter = distance(
          x,
          y,
          ellipse.xCenter,
          ellipse.yCenter
        );
        const slope = (y - ellipse.yCenter) / (x - ellipse.xCenter);

        const xLineOnElipse = Math.sqrt(
          (ellipse.xRadiusSq * ellipse.yRadiusSq) /
            (ellipse.yRadiusSq + slope * slope * ellipse.xRadiusSq)
        );
        const yLineOnElipse = slope * xLineOnElipse;
        const distanceToPointOnElipse = distance(
          0,
          0,
          xLineOnElipse,
          yLineOnElipse
        );
        const gradientRatio = Math.min(
          1,
          distanceFromElipseCenter / distanceToPointOnElipse
        );

        radius = Math.max(radius, (1 - gradientRatio) * maxRadius);
      }

      if (radius > 0) {
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius * radiusMult, 0, twoPi);
      }

      x -= xStep;
      y -= yStep;
    }
    yIndex++;
    y = yStart - yIndex * xStep;
  }
  ctx.fill();
};

const draw = (
  canvas: HTMLCanvasElement,
  copyElem: HTMLDivElement,
  color: boolean
) => {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const step = 7;
  const canvasRect = ctx.canvas.getBoundingClientRect();
  const densityMultiplier = document.body.scrollWidth > 1100 ? 1 / 4 : 1 / 7;
  if (color) {
    ctx.globalCompositeOperation = 'multiply';
    // cyan
    const cEllipses = getEllipses(
      canvasRect,
      copyElem.getBoundingClientRect(),
      densityMultiplier
    );
    drawEllipse(ctx, cEllipses, step, 15, 'rgba(0, 255, 255, 1)', 0.7);
    // magenta
    const mEllipses = getEllipses(
      canvasRect,
      copyElem.getBoundingClientRect(),
      densityMultiplier
    );
    drawEllipse(ctx, mEllipses, step, 75, 'rgba(255, 0, 255, 1)', 0.8);
    // yellow
    //const yEllipses = getEllipses(canvasRect, copyElem.getBoundingClientRect(), densityMultiplier);
    //drawEllipse(ctx, yEllipses, step, 0, 'rgba(255, 255, 0, 1)', 0.5);
  } else {
    const kEllipses = getEllipses(
      canvasRect,
      copyElem.getBoundingClientRect(),
      densityMultiplier
    );
    drawEllipse(ctx, kEllipses, step, 45, 'rgba(0, 0, 0, 1)', 1);
  }
};

type BaseLayoutProps = {
  children: React.ReactNode;
  style?: SerializedStyles;
  color?: boolean;
  disableNav?: boolean;
  disableEffect?: boolean;
};

const BaseLayout = React.forwardRef(
  (
    {
      children,
      style,
      color,
      disableNav,
      disableEffect,
      ...props
    }: BaseLayoutProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    disableEffect = disableEffect || typeof window === 'undefined';
    const copyRef = useRef<HTMLDivElement>(null);

    const drawBlack = useCallback(
      (canvas: HTMLCanvasElement) => draw(canvas, copyRef.current!, false),
      [copyRef]
    );
    const drawColor = useCallback(
      (canvas: HTMLCanvasElement) => draw(canvas, copyRef.current!, true),
      [copyRef]
    );

    const title = 'Snippets, playbooks, & data at your fingertips - Kenchi';
    const description =
      'Kenchi is a privacy-first Chrome extension that supercharges your support tools. As a single source of truth, Kenchi reduces cognitive load, fosters collaboration across your whole team, and generates precise insights about your support conversations.';

    return (
      <Container ref={ref}>
        <Global styles={global} />
        <Helmet>
          <body onTouchStart={() => {}} />
          <title>{title}</title>
          <meta name="description" content={description} />

          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta
            property="og:image"
            name="og:image"
            content={`https://kenchi.com${opengraphImg}`}
          />

          <meta name="og:url" content="https://kenchi.com/" />
          <meta name="twitter:site" content="@getkenchi" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta
            name="twitter:image"
            content={`https://kenchi.com${opengraphImg}`}
          />

          <link rel="icon" href="/faviconLarge.png" />
          <link rel="apple-touch-icon" href="/faviconLarge.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
        </Helmet>
        <Layout>
          <Contents ref={copyRef} css={style} {...props}>
            {children}
          </Contents>

          {!disableNav && (
            <Nav>
              <ul>
                <li>
                  <a href="/jobs">we&rsquo;re hiring</a>
                </li>
              </ul>
            </Nav>
          )}
        </Layout>
        {!disableEffect && (
          <>
            <Canvas
              draw={drawBlack}
              loop={false}
              className={color ? 'hide' : 'show'}
              referenceElem={document.body}
              css={canvasStyle}
            />
            <Canvas
              draw={drawColor}
              loop={false}
              className={color ? 'show' : 'hide'}
              referenceElem={document.body}
              css={canvasStyle}
            />
          </>
        )}
      </Container>
    );
  }
);

export default BaseLayout;
