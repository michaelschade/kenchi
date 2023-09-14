import { css } from '@emotion/react';
import classNames from 'classnames/bind';

import { baseFormControl, BaseFormProps } from './baseForm';
import { BaseFormGroupProps, FormGroup } from './FormGroup';

type TextAreaProps = BaseFormProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const textAreaStyle = [
  baseFormControl,
  css`
    height: auto;
  `,
];

export const TextArea = ({
  className,
  design = 'normal',
  ...props
}: TextAreaProps) => {
  return (
    <textarea
      css={textAreaStyle}
      className={classNames(className, `design-${design}`)}
      {...props}
    />
  );
};

type TextAreaGroupProps = BaseFormGroupProps & TextAreaProps;

export const TextAreaGroup = ({
  id,
  label,
  description,
  icon,
  error,
  ...props
}: TextAreaGroupProps) => {
  return (
    <FormGroup
      id={id}
      label={label}
      description={description}
      design={props.design}
    >
      {(id) => <TextArea id={id} {...props} />}
    </FormGroup>
  );
};
