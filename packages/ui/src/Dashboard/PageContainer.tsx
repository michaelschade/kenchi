import { Suspense } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import Emoji from '../Emoji';
import { LoadingSpinner } from '../Loading';
import { MetaProps, useMeta } from '../useMeta';

const WIDTHS = {
  sm: tw`max-w-2xl`,
  md: tw`max-w-3xl`,
  lg: tw`max-w-4xl`,
  xl: tw`max-w-7xl`,
};

const Container = styled.div<{ width: keyof typeof WIDTHS }>`
  ${tw`px-8 py-2 grid gap-6`}
  ${({ width }) => WIDTHS[width]}
  grid-template-columns: minmax(0, 1fr);
`;

const Top = styled.div`
  align-items: center;
  display: grid;
  gap: 0.25rem;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'heading actions'
    'subheading subheading';
  justify-content: space-between;
`;

const Heading = styled.div`
  grid-area: heading;
  display: grid;
  grid-template-columns: auto 1fr;
  ${tw`relative text-2xl font-normal leading-relaxed`}
  color: ${({ theme }) => theme.colors.gray[12]};
`;

const Subheading = styled.div`
  grid-area: subheading;
  ${tw`font-normal`}
  color: ${({ theme }) => theme.colors.gray[11]};
`;

const Icon = styled.span`
  ${tw`absolute right-full mr-4 select-none`}
`;

const Actions = styled.div`
  grid-area: actions;
  display: grid;
  gap: 0.75rem;
  grid-auto-flow: column;
  align-items: center;
`;

type HeadingProps = {
  meta?: MetaProps;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  icon?: string | null | undefined;
  fallbackIcon?: IconDefinition;
  editableIcon?: React.ReactNode;
  actions?: React.ReactNode;
};

export const PageContainerHeading = ({
  heading,
  subheading,
  icon,
  fallbackIcon,
  editableIcon,
  actions,
}: HeadingProps) => {
  return (
    <Top>
      <Heading>
        {(icon || fallbackIcon || editableIcon) && (
          <Icon>
            {icon && <Emoji emoji={icon} />}
            {editableIcon}
            {!editableIcon && !icon && fallbackIcon && (
              <FontAwesomeIcon
                icon={fallbackIcon}
                size="sm"
                css={({ colors }) =>
                  css`
                    ${colors.gray[9]}
                  `
                }
                fixedWidth
              />
            )}
          </Icon>
        )}
        {heading}
      </Heading>
      {subheading ? <Subheading>{subheading}</Subheading> : null}
      <Actions>{actions}</Actions>
    </Top>
  );
};

type Props = HeadingProps & {
  meta?: MetaProps;
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
};

export const PageContainer = ({
  meta,
  width = 'md',
  children,
  ...headingProps
}: Props) => {
  useMeta(meta || {});
  return (
    <Container width={width}>
      <PageContainerHeading {...headingProps} />
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </Container>
  );
};

export default PageContainer;
