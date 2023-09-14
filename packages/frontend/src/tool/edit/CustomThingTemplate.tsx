import { SelectGroup } from '@kenchi/ui/lib/Form';

type ConfigEditorProps = {
  configuration: null | { tool?: string };
  onChange: (config: { tool: string }) => void;
};
export default function CustomThingTemplateConfigurationEditor({
  configuration,
  onChange,
}: ConfigEditorProps) {
  if (!configuration || !configuration.tool) {
    configuration = { tool: '' };
  }
  const updateTool = (tool: string) => {
    onChange({
      ...configuration,
      tool,
    });
  };
  const toolOptions = [
    { value: 'AccountOverview', label: 'Account Overview' },
    { value: 'RecentLogins', label: 'Recent Logins' },
  ];

  return (
    <SelectGroup
      size="small"
      label="Example tool"
      value={configuration.tool}
      onSelect={updateTool}
      options={toolOptions}
      placeholder={'Select example tool'}
    />
  );
}
