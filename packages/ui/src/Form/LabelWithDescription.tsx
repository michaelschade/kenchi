import { forwardRef } from 'react';

import styled from '@emotion/styled';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Tooltip from '../Tooltip';

const Label = styled.label`
  display: inline-block;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.gray[12]};
`;

const LabelIcon = styled.span`
  color: ${({ theme }) => theme.colors.gray[8]};
  margin-left: 5px;
  font-size: 0.8em;
  vertical-align: text-top;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[9]};
  }
`;

export type LabelWithDescriptionProps = {
  id?: string;
  label?: string;
  labelHidden?: boolean; // visually hidden labels
  description?: string;
};

export const LabelWithDescription = forwardRef(
  (
    { id, labelHidden, label, description }: LabelWithDescriptionProps,
    ref: React.Ref<HTMLLabelElement>
  ) => {
    return (
      <Label
        ref={ref}
        htmlFor={id}
        className={labelHidden ? 'visually-hidden' : ''}
      >
        {label}
        {description && (
          <Tooltip placement="top" overlay={description}>
            <LabelIcon>
              <FontAwesomeIcon icon={faInfoCircle} />
            </LabelIcon>
          </Tooltip>
        )}
      </Label>
    );
  }
);
