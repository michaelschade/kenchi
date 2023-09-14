import React, { ReactNode } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { KenchiTheme } from '../Colors';

const hoverCardStyle = ({ colors }: KenchiTheme) => css`
  background-color: ${colors.gray[1]};
  border-radius: 0.25rem;
  box-shadow: 0px 0px 15px -2px ${colors.subtleShadow};
  color: ${colors.gray[12]};
  filter: drop-shadow(0px 0px 1px ${colors.gray[7]});
  padding: 1rem;
  width: 20rem;
`;

const Content = styled(HoverCardPrimitive.Content)`
  @keyframes in {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  transform-origin: var(--radix-hover-card-content-transform-origin);
  animation: in 100ms ease-out forwards;
`;

type HoverCardProps = {
  children: ReactNode;
  content: ReactNode;
};

export const HoverCard = ({ children, content }: HoverCardProps) => {
  return (
    <HoverCardPrimitive.Root openDelay={300} closeDelay={15}>
      <HoverCardPrimitive.Trigger asChild>
        {children}
      </HoverCardPrimitive.Trigger>
      <Content
        side="top"
        css={hoverCardStyle}
        sideOffset={4}
        align="start"
        alignOffset={30}
        collisionTolerance={20}
      >
        <HoverCardPrimitive.Arrow
          offset={20}
          css={({ colors }: KenchiTheme) => css`
            fill: ${colors.gray[1]};
          `}
        />
        {content}
      </Content>
    </HoverCardPrimitive.Root>
  );
};
