import { TextAreaGroup } from '@kenchi/ui/lib/Form';

type ConfigEditorProps = {
  configuration: null | { text?: string };
  onChange: (config: { text: string }) => void;
};
export default function SetClipboardConfigurationEditor({
  configuration,
  onChange,
}: ConfigEditorProps) {
  if (!configuration || !configuration.text) {
    configuration = { text: '' };
  }
  const updateText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...configuration,
      text: e.target.value,
    });
  };
  return (
    <TextAreaGroup
      label="Text to copy"
      rows={15}
      value={configuration.text}
      onChange={updateText}
    />
  );
}
