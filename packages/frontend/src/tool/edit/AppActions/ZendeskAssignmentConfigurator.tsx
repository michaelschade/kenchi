import { Select } from '@kenchi/ui/lib/Form';

export type ZendeskAssignment = {
  userId: string;
};

type PropsForZendeskAssignmentConfigurator = {
  value?: ZendeskAssignment;
  onChange: (value: ZendeskAssignment | undefined) => void;
};

export const ZendeskAssignmentConfigurator = ({
  value,
  onChange,
}: PropsForZendeskAssignmentConfigurator) => {
  const optionsForSelect = [
    {
      label: 'Do not change assignment',
      value: '',
    },
    {
      label: 'Assign to self',
      value: 'self',
    },
  ];

  return (
    <Select
      onSelect={(value) => {
        if (value === '') {
          onChange(undefined);
        } else {
          onChange({
            userId: value,
          });
        }
      }}
      options={optionsForSelect}
      value={value?.userId || ''}
      size="small"
    />
  );
};
