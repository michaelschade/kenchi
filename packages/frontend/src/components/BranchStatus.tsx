import { css } from '@emotion/react';
import {
  faArchive,
  faTasks,
  faThumbsDown,
  faThumbsUp,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import capitalize from 'lodash/capitalize';
import { DateTime } from 'luxon';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { BranchTypeEnum } from '../graphql/generated';

type ItemProps = {
  createdAt: string;
  createdByUser: { name: string | null; email: string | null };
  isArchived: boolean;
  archiveReason: string | null;
  branchType: BranchTypeEnum;
};

type BranchStatusProps = {
  item: ItemProps;
  additionalText?: string | React.ReactElement;
  onClick?: () => void;
};

const iconStyle = css`
  font-size: 0.9em;
`;

export function BranchStatusAlert({
  item,
  additionalText,
  onClick,
}: BranchStatusProps) {
  // TODO: handle other workflow states (see BranchBadge)
  const reviewedOn = DateTime.fromISO(item.createdAt).toFormat("DD 'at' t");
  const reviewedBy = item.createdByUser.name || item.createdByUser.email;

  if (item.archiveReason) {
    const color =
      item.archiveReason === 'approved' ? BaseColors.success : BaseColors.error;
    const icon = item.archiveReason === 'approved' ? faThumbsUp : faThumbsDown;
    return (
      <Alert
        title={`Suggestion ${item.archiveReason}`}
        description={
          <>
            This suggestion was {item.archiveReason} by {reviewedBy} on{' '}
            {reviewedOn}. {additionalText}
          </>
        }
        primaryColor={color}
        icon={<FontAwesomeIcon icon={icon} css={iconStyle} />}
        onClick={onClick}
      />
    );
  } else {
    return (
      <Alert
        title={`Suggestion archived`}
        description={
          <>
            This suggestion was archived by {reviewedBy} on {reviewedOn}.{' '}
            {additionalText}
          </>
        }
        primaryColor={BaseColors.secondary}
        icon={<FontAwesomeIcon icon={faArchive} css={iconStyle} />}
        onClick={onClick}
      />
    );
  }
}

export function DraftAlert({ itemName }: { itemName: string }) {
  return (
    <Alert
      title="Editing a draft"
      description={`This ${itemName} is currently saved as a draft, meaning only you can see it. When you're ready to share, just click Publish instead of Save Draft.`}
      primaryColor={BaseColors.secondary}
      icon={<FontAwesomeIcon icon={faTasks} css={iconStyle} />}
      containerStyle={css({ marginBottom: '10px' })}
    />
  );
}

const badgeStyle = ({ colors }: KenchiTheme) => css`
  color: ${colors.accent[2]};
  background-color: ${colors.accent[11]};
  box-shadow: inset 0px 0px 5px 0px ${colors.accent[9]};
  user-select: none;
  -webkit-text-fill-color: initial;

  /* from bootstrap */
  display: inline-block;
  padding: 0.25em 0.4em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
`;

const parseAndFormat = (time: string) =>
  DateTime.fromISO(time).toFormat('EEE, DD t');

export function BranchBadge({
  item,
  itemName,
}: {
  item: ItemProps;
  itemName: 'playbook' | 'snippet' | 'suggestion';
}) {
  let tooltip, text;
  const createdBy = item.createdByUser.name || item.createdByUser.email;
  if (item.isArchived && item.branchType !== BranchTypeEnum.suggestion) {
    text = 'Archived';
    tooltip = `This ${itemName} was archived on ${parseAndFormat(
      item.createdAt
    )} by ${createdBy}.`;
  } else if (item.branchType === BranchTypeEnum.draft) {
    text = 'Draft';
    tooltip = `This ${itemName} is currently saved as a draft, meaning only you can see it. When you're ready to share, just click Publish instead of Save Draft.`;
  } else if (item.branchType === BranchTypeEnum.suggestion) {
    if (item.isArchived && item.archiveReason) {
      text = capitalize(item.archiveReason);
      tooltip = `This ${itemName} was previously submitted as a suggestion and ${
        item.archiveReason
      } on ${parseAndFormat(item.createdAt)} by ${createdBy}.`;
    } else if (item.isArchived) {
      // Shouldn't end up in this state without an archive reason, but it's
      // theoretically possible so let's show something accurate
      text = 'Archived';
      tooltip = `This ${itemName} was previously submitted as a suggestion and archived on ${parseAndFormat(
        item.createdAt
      )} by ${createdBy}.`;
    } else {
      text = 'Under review';
      tooltip = `This ${itemName} is currently submitted as a pending suggestion. Once it's been approved by your team, it'll be visible to everyone.`;
    }
  } else {
    return null;
  }

  if (tooltip) {
    return (
      <Tooltip overlay={tooltip}>
        <span css={badgeStyle}>{text}</span>
      </Tooltip>
    );
  } else {
    return <span css={badgeStyle}>{text}</span>;
  }
}
