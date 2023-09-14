import { BaseFormProps } from './baseForm';
import {
  LabelWithDescription,
  LabelWithDescriptionProps,
} from './LabelWithDescription';
import useFormGroupId from './useFormGroupId';

export type BaseFormGroupProps = BaseFormProps & LabelWithDescriptionProps;

type FormGroupProps = BaseFormGroupProps & {
  children: React.ReactNode | ((id: string) => React.ReactNode);
};

export const FormGroup = ({
  id,
  label,
  labelHidden,
  description,
  design = 'normal',
  children,
}: FormGroupProps) => {
  const staticId = useFormGroupId(id);
  let actualChildren: React.ReactNode;
  if (typeof children === 'function') {
    actualChildren = children(staticId);
  } else {
    actualChildren = children;
  }
  return (
    <div>
      {label && (
        <LabelWithDescription
          id={staticId}
          description={description}
          labelHidden={labelHidden}
          label={label}
        />
      )}
      {actualChildren}
    </div>
  );
};
