import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import bloomPerwinkleChartreuse from '../blocks/bloom_periwinkle_chartreuse.svg';
import chartChartreuseWhite from '../blocks/chart_chartreuse_white.svg';
import pieChartWhite from '../blocks/pie_chart_white.svg';
import scriptBlack from '../blocks/script_black.svg';
import shapesBlocksWhite from '../blocks/shapes_blocks_white.svg';
import shapesFourWhite from '../blocks/shapes_four_white.svg';
import shapesHalfCircleWhite from '../blocks/shapes_half_circle_white.svg';
import smilePeriwinkle from '../blocks/smile_periwinkle.svg';
import Breakpoints from '../breakpoints';
import { BaseSection } from './BaseSection';

const style = css`
  background-color: ${BrandColors.black};
  display: grid;
  gap: 2rem;
  padding: 2.5rem;
  grid-template-columns: repeat(8, 1fr);
  overflow: hidden;

  ${Breakpoints.small} {
    grid-template-columns: repeat(4, 1fr);
  }

  > .block {
    position: relative;
    display: grid;
    align-items: center;
    justify-content: center;
    &.hide-on-small {
      ${Breakpoints.small} {
        display: none;
      }
    }
    > img {
      max-width: 100%;
      height: auto;
    }
  }
`;

export const ShapesRow = () => {
  return (
    <BaseSection as="div" css={style}>
      <div className="block">
        <img src={bloomPerwinkleChartreuse} alt="" />
      </div>
      <div className="block">
        <img src={shapesBlocksWhite} alt="" />
      </div>
      <div className="block">
        <img src={chartChartreuseWhite} alt="" />
      </div>
      <div className="block">
        <img src={scriptBlack} alt="" />
      </div>
      <div className="block hide-on-small">
        <img src={smilePeriwinkle} alt="" />
      </div>
      <div className="block hide-on-small">
        <img src={shapesFourWhite} alt="" />
      </div>
      <div className="block hide-on-small">
        <img src={pieChartWhite} alt="" />
      </div>
      <div className="block hide-on-small">
        <img src={shapesHalfCircleWhite} alt="" />
      </div>
    </BaseSection>
  );
};
