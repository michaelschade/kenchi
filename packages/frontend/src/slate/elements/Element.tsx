import { css } from '@emotion/react';

import {
  SlateElement,
  SlateElementAttributes,
} from '@kenchi/slate-tools/lib/types';
import { linkStyle } from '@kenchi/ui/lib/Text';

import CollectionWidget from '../../space/CollectionWidget';
import DraftsSection from '../../space/DraftsSection';
import List from '../../space/List';
import TopUsedSection from '../../space/TopUsedSection';
import { UserCollectionSectionConfig } from '../../space/useSpaceSettings';
import { Collapsible, CollapsibleListItem } from './Collapsible';
import { ConditionalEditor } from './Conditional';
import { DataSourceVariablePlaceholder } from './DataSourceVariablePlaceholder';
import { DataSourceVariableValue } from './DataSourceVariableValue';
import { EditorLink } from './EditorLink';
import { EditorToolElement } from './EditorToolElement';
import { EditorWorkflowEmbed } from './EditorWorkflowEmbed';
import { EditorWorkflowLink } from './EditorWorkflowLink';
import Image from './Image';
import ShowMore from './ShowMore';
import { StatusEditor, StatusValue } from './Status';
import ToolElement from './ToolElement';
import Variable, { EditorVariable } from './Variable';
import VoidEditWrapper, { VoidEditWrapperOptions } from './VoidEditWrapper';
import WorkflowEmbed from './WorkflowEmbed';
import WorkflowLink from './WorkflowLink';

// TODO: for some reason with tools -8px is right, for images -15px is right.
const voidSpacerStyle = css`
  width: 1px;
  display: inline-block;
  position: relative;
  top: -8px;

  div {
    height: auto !important;
    color: inherit !important;
    outline: inherit !important;
    position: absolute;
    width: 1px;
    height: 22px;
  }
`;

type ElementProps = {
  children: React.ReactNode;
  element: SlateElement;
  attributes?: SlateElementAttributes;
  singleLine: boolean;
  insertText: boolean;
  voidWrap: boolean;
  onClickEditLink?: () => void;
};

function maybeVoidWrap(
  { voidWrap, attributes, children }: ElementProps,
  element: React.ReactElement,
  options?: VoidEditWrapperOptions
) {
  if (voidWrap) {
    return (
      <VoidEditWrapper
        voidElement={element}
        attributes={attributes}
        options={options}
      >
        {children}
      </VoidEditWrapper>
    );
  } else {
    return element;
  }
}

// Fix special elements like Tools and Images to have paragraph spacing
const baseElemWrapper = css`
  margin-bottom: 1rem;

  ul &,
  ol & {
    margin-bottom: 0.25rem;
  }
`;

function maybeVoidSpace(
  { insertText }: ElementProps,
  element: React.ReactElement
) {
  if (insertText) {
    return element;
  } else {
    return <div css={baseElemWrapper}>{element}</div>;
  }
}

export default function Element(props: ElementProps) {
  // attributes is passed through for the editor; i.e. if attributes is present, the item is being edited
  const { attributes, children, element } = props;
  const inEditor = !!attributes;
  switch (element.type) {
    case 'workflow-embed':
      if (inEditor) {
        return maybeVoidWrap(props, <EditorWorkflowEmbed element={element} />, {
          shouldBlockPointerEvents: false,
        });
      }
      return maybeVoidWrap(props, <WorkflowEmbed element={element} />, {
        shouldBlockPointerEvents: false,
      });
    case 'tool':
      if (inEditor) {
        return maybeVoidWrap(
          props,
          maybeVoidSpace(
            props,
            <EditorToolElement id={element.tool} element={element} />
          ),
          { shouldBlockPointerEvents: false }
        );
      }
      return maybeVoidWrap(
        props,
        maybeVoidSpace(props, <ToolElement id={element.tool} />),
        { shouldBlockPointerEvents: false }
      );
    case 'image':
      return maybeVoidWrap(
        props,
        maybeVoidSpace(
          props,
          <Image
            insertText={props.insertText}
            element={element}
            inEditor={inEditor}
          />
        ),
        { shouldBlockPointerEvents: false }
      );
    case 'heading':
      return <h2 {...attributes}>{children}</h2>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'collapsible':
      return (
        <Collapsible
          attributes={attributes}
          children={children}
          element={element}
        />
      );
    case 'collapsible-list-item':
      return (
        <CollapsibleListItem
          attributes={attributes}
          children={children}
          element={element}
        />
      );
    case 'link':
      if (inEditor) {
        return (
          <EditorLink
            attributes={attributes}
            children={children}
            element={element}
            onClickEdit={() => {
              props.onClickEditLink?.();
            }}
          />
        );
      }
      return (
        <a
          css={linkStyle}
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    case 'workflow-link':
      if (inEditor) {
        return (
          <EditorWorkflowLink
            children={children}
            element={element}
            attributes={attributes}
            onClickEdit={() => {
              props.onClickEditLink?.();
            }}
          />
        );
      }
      return <WorkflowLink element={element} />;
    case 'void-wrapper':
      if (inEditor) {
        return <div {...attributes}>{children}</div>;
      } else {
        return <>{children}</>;
      }
    case 'void-spacer':
      if (inEditor) {
        return (
          <span {...attributes} css={voidSpacerStyle}>
            {children}
          </span>
        );
      } else {
        return null;
      }
    case 'search-box':
      // NOOP, this is now manually inlined
      // TODO: remove after everyone's frontend is upgraded and we've removed search-box from pages.
      return null;
    case 'show-more':
      // Should never be in editor
      return <ShowMore />;
    case 'widget-collection':
      return maybeVoidWrap(
        props,
        <CollectionWidget
          collectionId={element.collectionId}
          defaultConfig={
            element.defaultConfig as UserCollectionSectionConfig | undefined
          }
        />
      );
    case 'widget-drafts':
      return maybeVoidWrap(props, <DraftsSection />);
    case 'widget-list':
      return maybeVoidWrap(props, <List privateOnly={element.privateOnly} />);
    case 'widget-top-used':
      return maybeVoidWrap(props, <TopUsedSection />);
    case 'variable':
      if (inEditor) {
        return (
          <EditorVariable
            attributes={attributes}
            children={children}
            element={element}
          />
        );
      } else {
        return <Variable element={element} />;
      }
    case 'data-source-variable':
      if (inEditor) {
        return (
          <DataSourceVariablePlaceholder
            attributes={attributes}
            children={children}
            element={element}
          />
        );
      } else {
        return <DataSourceVariableValue element={element} />;
      }
    case 'conditional':
      if (inEditor) {
        return (
          <ConditionalEditor
            attributes={attributes}
            children={children}
            element={element}
          />
        );
      } else {
        return <div>TODO</div>;
      }
    case 'status':
      if (inEditor) {
        return (
          <StatusEditor
            attributes={attributes}
            children={children}
            element={element}
          />
        );
      } else {
        return <StatusValue children={children} element={element} />;
      }
    default:
      if (props.singleLine) {
        return <span {...attributes}>{children}</span>;
      } else {
        return <p {...attributes}>{children}</p>;
      }
  }
}
