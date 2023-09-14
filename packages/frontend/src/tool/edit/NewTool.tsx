import VersionedNodeModifyContainer from '../../components/VersionedNodeModifyContainer';
import { ToolFragment as ToolFragmentType } from '../../graphql/generated';
import ToolEditor, { ToolEditorOptions } from './ToolEditor';
import { useCreateTool } from './useCreateTool';

type NewToolProps = {
  onBack: () => void;
  onCreate: (tool: ToolFragmentType) => void;
  topLevel: boolean;
  publishOnly?: boolean;
} & ToolEditorOptions;

function NewTool({
  onBack,
  onCreate,
  topLevel,
  publishOnly,
  ...rest
}: NewToolProps) {
  const [createTool, toolCreationResult] = useCreateTool(onCreate);

  return (
    <VersionedNodeModifyContainer
      onBack={onBack}
      item={null}
      itemName="snippet"
      itemPath="snippets"
      submitError={toolCreationResult.error}
      topLevel={topLevel}
    >
      <ToolEditor
        onSubmit={createTool}
        onBack={onBack}
        submitLoading={toolCreationResult.loading}
        editType={publishOnly ? 'publishOnly' : 'normal'}
        showShortcuts
        {...rest}
      />
    </VersionedNodeModifyContainer>
  );
}

export default NewTool;
