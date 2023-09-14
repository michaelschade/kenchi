import Editor from '../../slate/Editor';
import { useDataSourceVariables } from '../dataSources/useDataSourceVariables';
import { Widget } from './types';
import { useWidgetFormState } from './useWidgetFormState';

type PropsForWidgetEditor = {
  widget: Widget;
  onChangeWidget: (widget: Widget) => void;
};

export const WidgetEditor = ({
  widget,
  onChangeWidget,
}: PropsForWidgetEditor) => {
  const { contentsState } = useWidgetFormState(widget);
  const dataSourceVariables = useDataSourceVariables();

  return (
    <Editor
      value={contentsState.value}
      size="small"
      onChange={(contents) => {
        console.log(contents);
        const updatedWidget = {
          ...widget,
          contents,
        };
        contentsState.set(contents);
        onChangeWidget(updatedWidget);
      }}
      withFormattingForInsert
      withImages
      withURLLinks
      withSlashCommands
      dataSourceVariables={dataSourceVariables}
    />
  );
};
