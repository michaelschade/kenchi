import { forwardRef } from 'react';

import { css, useTheme } from '@emotion/react';
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';

import lightThemeLogoSvg from '../logos/favicon.svg';
import darkThemeLogoSvg from '../logos/faviconDark.svg';

const containerStyles = ({ colors }: KenchiTheme) => css`
  /* Unset outer padding */
  margin: -15px -15px 15px;
  padding-left: 15px;
  padding-right: 15px;
  background-color: ${colors.gray[4]};

  ${tw`relative h-6 flex gap-1 justify-between items-center select-none`}
`;

const logoStyles = css`
  ${tw`grid items-center`}

  img {
    width: 20px;
    height: 20px;
  }
`;

const buttonsContainerStyles = css`
  ${tw`flex gap-2`}
`;

const buttonStyles = ({ colors }: KenchiTheme) => css`
  ${tw`hover:cursor-pointer shadow py-1.5 -mt-1 -mb-1 rounded-b flex gap-1 items-center outline-none text-opacity-70 transition hover:text-opacity-90 focus:text-opacity-90`}
  background-color: ${colors.gray[1]};
  border: 1px solid ${colors.special.topBarButtonBorderColor};
  border-top: none;
`;

const buttonIconStyles = ({ colors }: KenchiTheme) => css`
  ${tw`opacity-70 transition group-hover:opacity-100 group-focus:opacity-100`}
  color: ${colors.gray[12]};
  min-width: 1rem;
`;

export const TopBarContainerButton = forwardRef(
  (
    props: {
      icon: FontAwesomeIconProps['icon'];
    } & Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const { icon, ...options } = props;
    return (
      // twin.macro doesn't propagate `group` styles down when using `@apply` so
      // we'll need to add `group` here manually to make sure the styles below
      // can take advantage of e.g. `group-hover` utilities.
      // See https://github.com/ben-rogerson/twin.macro/blob/master/docs/group.md
      <button
        ref={ref}
        className="group"
        css={buttonStyles}
        type="button"
        {...options}
      >
        <FontAwesomeIcon css={buttonIconStyles} icon={icon} size="sm" />
      </button>
    );
  }
);

type TopBarContainerProps = {
  logoGroupContent: React.ReactChild | null;
  buttonGroupContent: React.ReactChild | null;
};

export const TopBarContainer = ({
  logoGroupContent,
  buttonGroupContent,
}: TopBarContainerProps) => {
  const { name } = useTheme();

  return (
    <div css={containerStyles}>
      <div css={tw`flex gap-2 items-center`}>
        <div css={logoStyles}>
          <img
            src={name === 'light' ? lightThemeLogoSvg : darkThemeLogoSvg}
            alt="Kenchi logo"
          />
        </div>
        {logoGroupContent}
      </div>

      <div css={buttonsContainerStyles}>{buttonGroupContent}</div>
    </div>
  );
};
