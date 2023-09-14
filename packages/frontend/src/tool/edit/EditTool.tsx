import Loading from '@kenchi/ui/lib/Loading';

import { EditType } from '../../components/EditActionBar';
import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import VersionedNodeModifyContainer from '../../components/VersionedNodeModifyContainer';
import { BranchTypeEnum, ToolFragment } from '../../graphql/generated';
import useTool from '../useTool';
import ToolEditor from './ToolEditor';
import { useDeleteTool } from './useDeleteTool';
import { useModifyTool } from './useModifyTool';

type EditToolProps = {
  id: string;
  onBack: () => void;
  onUpdate: (tool: ToolFragment) => void;
  onDelete: () => void;
  topLevel: boolean;
  editType: EditType;
};

function EditTool({
  id,
  onBack,
  onUpdate,
  onDelete,
  topLevel,
  editType,
}: EditToolProps) {
  const {
    tool,
    loading: fetchLoading,
    error: fetchError,
  } = useTool(id, 'network-only');

  const [modifyTool, modifyToolResult] = useModifyTool(tool, onUpdate);
  const [deleteTool, ConfirmDelete, deleteToolResult] = useDeleteTool(
    tool,
    onDelete
  );

  const canDelete = editType === 'normal';
  const isSuggestion = tool?.branchType === BranchTypeEnum.suggestion;
  const itemName = isSuggestion ? 'suggestion' : 'snippet';

  if (fetchLoading) {
    return <Loading name="edit tool" />;
  }
  if (fetchError) {
    return <ErrorAlert title="Error loading snippet" error={fetchError} />;
  }
  if (!tool) {
    return <NotFoundAlert title="Snippet not found" />;
  }

  return (
    <>
      <ConfirmDelete />
      <VersionedNodeModifyContainer
        item={tool}
        itemName={itemName}
        itemPath="snippets"
        onBack={onBack}
        submitError={modifyToolResult.error}
        topLevel={topLevel}
        onClickArchive={canDelete ? deleteTool : undefined}
        deleteStatus={deleteToolResult}
      >
        <ToolEditor
          tool={tool}
          onSubmit={modifyTool}
          onBack={onBack}
          submitLoading={modifyToolResult.loading}
          editType={editType}
          showShortcuts
        />
      </VersionedNodeModifyContainer>
    </>
  );
}

export default EditTool;
