import { forwardRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faExclamationTriangle,
  faInfoCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { BaseColors } from '../Colors';
import Tooltip from '../Tooltip';
import { baseFormControl, BaseFormProps } from './baseForm';
import { BaseFormGroupProps, FormGroup } from './FormGroup';

const InputIcon = styled.span`
  height: fit-content;
  position: absolute;
  margin: auto;
  top: 0;
  bottom: 0;
  right: 6px;
  color: #97aabf;

  &.error {
    color: ${BaseColors.error};
  }
`;

const inputStyle = [
  baseFormControl,
  css`
    &.has-icon {
      padding-right: 25px;
    }

    &.error {
      color: ${BaseColors.error};
      box-shadow: 0 0 0 0.2rem hsla(331, 57%, 50%, 0.25);
      border-color: hsla(331, 57%, 50%, 0.25);
    }
  `,
];

type InputProps = BaseFormProps & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef(
  (
    {
      icon,
      error,
      tooltip,
      className,
      design = 'normal',
      ...props
    }: InputProps,
    ref: React.Ref<HTMLInputElement>
  ) => {
    let iconElem;

    if (error && typeof error === 'boolean') {
      iconElem = (
        <InputIcon className="error">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </InputIcon>
      );
    } else if (error) {
      iconElem = (
        <Tooltip placement="left" overlay={error}>
          <InputIcon className="error">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </InputIcon>
        </Tooltip>
      );
    } else if (tooltip) {
      iconElem = (
        <Tooltip placement="left" overlay={tooltip}>
          <InputIcon>
            <FontAwesomeIcon icon={icon || faInfoCircle} />
          </InputIcon>
        </Tooltip>
      );
    } else if (icon) {
      iconElem = (
        <InputIcon>
          <FontAwesomeIcon icon={icon} />
        </InputIcon>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          css={inputStyle}
          className={classNames(
            { error: !!error },
            `design-${design}`,
            (error || icon) && 'has-icon',
            className
          )}
          {...props}
        />
        {iconElem}
      </div>
    );
  }
);

type InputGroupProps = BaseFormGroupProps & InputProps;

export const InputGroup = ({
  id,
  label,
  description,
  ...props
}: InputGroupProps) => {
  return (
    <FormGroup label={label} description={description} design={props.design}>
      {(id) => <Input id={id} {...props} />}
    </FormGroup>
  );
};
