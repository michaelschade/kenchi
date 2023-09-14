import { ToolInput } from '@kenchi/slate-tools/lib/tool/types';
import { FormState } from '@kenchi/ui/lib/useFormState';

import AutomationConfigurationEditor from './Automation';
import CustomThingTemplateConfigurationEditor from './CustomThingTemplate';
import GmailActionConfigurationEditor from './GmailAction';
import OpenURLsConfigurationEditor from './OpenURLs';
import SetClipboardConfigurationEditor from './SetClipboard';

type Props = {
  componentName: string;
  configurationState: FormState<any>;
  inputsState: FormState<ToolInput[]>;
  disabled?: boolean;
};

const ComponentConfigurationEditor = ({
  componentName,
  configurationState,
  inputsState,
  disabled = false,
}: Props) => {
  switch (componentName) {
    case 'OpenURLs':
      return (
        <OpenURLsConfigurationEditor
          configuration={configurationState.value}
          onChange={configurationState.set}
          inputs={inputsState.value}
          onInputsChange={inputsState.set}
        />
      );
    case 'SetClipboard':
      return (
        <SetClipboardConfigurationEditor
          configuration={configurationState.value}
          onChange={configurationState.set}
        />
      );
    case 'CustomThingTemplate':
      return (
        <CustomThingTemplateConfigurationEditor
          configuration={configurationState.value}
          onChange={configurationState.set}
        />
      );
    case 'GmailAction':
      return (
        <GmailActionConfigurationEditor
          configuration={configurationState.value}
          onChange={configurationState.set}
          inputs={inputsState.value}
          onInputsChange={inputsState.set}
          disabled={disabled}
        />
      );
    case 'Automation':
      return (
        <AutomationConfigurationEditor
          configuration={configurationState.value}
          onChange={configurationState.set}
          inputs={inputsState.value}
          onInputsChange={inputsState.set}
        />
      );
    default:
      return null;
  }
};

export default ComponentConfigurationEditor;
