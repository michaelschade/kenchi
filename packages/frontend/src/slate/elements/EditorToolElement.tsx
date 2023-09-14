import { useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Element, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import { ToolElement } from '@kenchi/slate-tools/lib/types';
import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../../components/ErrorAlert';
import {
  ToolElementQuery,
  ToolElementQueryVariables,
} from '../../graphql/generated';
import PreviewTile from '../../previewTile/PreviewTile';
import Tool from '../../tool/Tool';
import { trackEvent } from '../../utils/analytics';
import { isTool } from '../../utils/versionedNode';
import { ElementWithPopover } from '../Editor/ElementWithPopover';
import { SelectedElementPopoverContent } from '../Editor/SelectedElementPopoverContent';
import { useIsOnlyElementSelected } from '../Editor/useIsOnlyElementSelected';
import { QUERY } from './ToolElement';
import { PointerEventsBlocker } from './utils/PointerEventsBlocker';

export const EditorToolElement = ({
  id,
  element,
}: {
  id: string;
  element: ToolElement;
}) => {
  const { loading, error, data } = useQuery<
    ToolElementQuery,
    ToolElementQueryVariables
  >(QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    variables: { staticId: id },
  });
  const editor = useSlate();
  const isOnlyElementSelected = useIsOnlyElementSelected(element);

  let tool = null;
  if (data?.versionedNode && isTool(data.versionedNode)) {
    tool = data.versionedNode;
  }

  if (!tool) {
    if (error) {
      return <ErrorAlert title="Error loading snippet" error={error} />;
    } else if (loading) {
      return <Loading name="tool element" />;
    } else {
      return (
        <PreviewTile
          name="Snippet not found"
          icon={
            <div className="tool-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} size="sm" />
            </div>
          }
          onClick={() => {}}
          actionEnabled={false}
          style={{ background: '#fff', position: 'relative' }}
        />
      );
    }
  }

  return (
    <ElementWithPopover
      shouldShowPopoverIfSelected={isOnlyElementSelected}
      popoverContent={
        <SelectedElementPopoverContent
          onClickRemove={() => {
            trackEvent({
              category: 'workflow_editor',
              action: 'remove_tool_embed',
              label: 'Remove tool embed',
            });
            Transforms.removeNodes(editor, {
              match: (n) => Element.isElement(n) && n.type === 'tool',
            });
            ReactEditor.focus(editor);
          }}
          linkDisplayText={tool.name}
          linkTo={`/dashboard/snippets/${tool.staticId}`}
        />
      }
      elementIsInline={false}
    >
      <div
        css={css`
          position: relative;
          display: inline-block;
          width: 100%;
          padding: 0.25rem;
        `}
      >
        <PointerEventsBlocker />
        <Tool tool={tool} editType="modal" analyticsSource="workflow" />
      </div>
    </ElementWithPopover>
  );
};
