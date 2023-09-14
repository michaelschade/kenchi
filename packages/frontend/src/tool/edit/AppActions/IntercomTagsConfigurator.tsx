import { TagsConfigurator } from './TagsConfigurator';

type PropsForIntercomTagsConfigurator = {
  value: string[] | undefined;
  onChange: (tags: string[]) => void;
};

export const IntercomTagsConfigurator = ({
  value,
  onChange,
}: PropsForIntercomTagsConfigurator) => {
  return (
    <TagsConfigurator
      referenceSource="intercom"
      appName="Intercom"
      onChange={onChange}
      value={value}
      actionTypeForSync="extractIntercomTags"
      placeholder="Select tags to add"
    />
  );
};
