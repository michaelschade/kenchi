import { css, useTheme } from '@emotion/react';
import {
  faCheckCircle,
  faEnvelopeOpen,
  faHourglassHalf,
  faPauseCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Select } from '@kenchi/ui/lib/Form';

export enum ZendeskTicketStatusEnum {
  OPEN = 'open',
  PENDING = 'pending',
  HOLD = 'hold',
  SOLVED = 'solved',
}

export const statusDisplay = {
  [ZendeskTicketStatusEnum.OPEN]: { icon: faEnvelopeOpen, label: 'Open' },
  [ZendeskTicketStatusEnum.PENDING]: {
    icon: faHourglassHalf,
    label: 'Pending',
  },
  [ZendeskTicketStatusEnum.HOLD]: { icon: faPauseCircle, label: 'On Hold' },
  [ZendeskTicketStatusEnum.SOLVED]: { icon: faCheckCircle, label: 'Solved' },
};

export const iconForZendeskTicketStatus = (value: ZendeskTicketStatusEnum) =>
  statusDisplay[value].icon;

export const tooltipForZendeskTicketStatus = (value: ZendeskTicketStatusEnum) =>
  `Set status: ${statusDisplay[value].label}`;

type PropsForZendeskSetStatusConfigurator = {
  value?: ZendeskTicketStatusEnum;
  onChange: (value: ZendeskTicketStatusEnum | undefined) => void;
};

export const ZendeskSetStatusConfigurator = ({
  value,
  onChange,
}: PropsForZendeskSetStatusConfigurator) => {
  const { colors } = useTheme();

  const ticketStatusOptions = [
    {
      label: 'Do not set status',
      value: '',
    },
    ...Object.values(ZendeskTicketStatusEnum).map((status) => ({
      label: (
        <div
          css={css`
            display: grid;
            gap: 0.5rem;
            grid-template-columns: auto 1fr;
            align-items: center;
          `}
        >
          <FontAwesomeIcon
            fixedWidth
            icon={statusDisplay[status].icon}
            color={colors.gray[11]}
          />
          {statusDisplay[status].label}
        </div>
      ),
      value: status,
    })),
  ];
  return (
    <Select
      onSelect={(value) => {
        if (value === '') {
          onChange(undefined);
        } else {
          onChange(value as ZendeskTicketStatusEnum);
        }
      }}
      options={ticketStatusOptions}
      value={value}
      size="small"
    />
  );
};
