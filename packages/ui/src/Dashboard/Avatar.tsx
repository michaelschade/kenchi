import { ReactNode } from 'react';

import styled from '@emotion/styled';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import Tooltip from '../Tooltip';

const AvatarRoot = styled(AvatarPrimitive.Root)`
  align-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  justify-content: center;
  overflow: hidden;
  width: 2rem;
  background-color: ${({ theme: { colors } }) => colors.accent[9]};
`;

const AvatarImage = styled(AvatarPrimitive.Image)`
  object-fit: cover;
  width: 100%;
  height: 100%;
`;

const Fallback = styled(AvatarPrimitive.Fallback)`
  background-color: ${({ theme: { colors } }) => colors.accent[9]};
  color: ${({ theme: { colors } }) => colors.accent[1]};
  font-size: 0.875rem;
`;

const TooltipContent = styled.div`
  text-align: center;
`;

type User = {
  email: string | null;
  familyName: string | null;
  givenName: string | null;
  picture: string | null;
  name: string | null;
};

type AvatarProps = {
  user: User;
  extraInfo?: ReactNode;
};

const Avatar = ({ user, extraInfo }: AvatarProps) => {
  const { email, familyName, givenName, picture, name } = user;
  const fallbackText = (
    givenName && familyName ? `${givenName[0]}${familyName[0]}` : email![0]
  ).toUpperCase();
  return (
    <Tooltip
      placement="top"
      overlay={
        <TooltipContent>
          <div>{name}</div>
          <div>{email}</div>
          {extraInfo && <div>{extraInfo}</div>}
        </TooltipContent>
      }
    >
      <AvatarRoot>
        <AvatarImage src={picture ?? undefined} alt={name ?? undefined} />
        <Fallback delayMs={600}>{fallbackText}</Fallback>
      </AvatarRoot>
    </Tooltip>
  );
};

export default Avatar;
