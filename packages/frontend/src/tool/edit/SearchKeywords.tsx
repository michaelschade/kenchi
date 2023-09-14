import { MultiInputGroup } from '@kenchi/ui/lib/Form';

export const searchKeywordsDescription =
  "Use keywords to express other words or phrases you might search for to find this Snippet. We'll use those to help boost this Snippet in search.";

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

export const SearchKeywords = ({ values, onChange, disabled }: Props) => {
  return (
    <MultiInputGroup
      disabled={disabled}
      label="Search Keywords"
      labelHidden
      values={values}
      onChange={onChange}
      placeholder="Add search keywords"
    />
  );
};
