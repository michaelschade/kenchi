import type { ToolInput } from './tool/types';

type BaseSlateElement = {
  text?: never;
  children: SlateNode[];
};

export type CollapsibleElement = BaseSlateElement & {
  type: 'collapsible';
  id: string;
};

export type CollapsibleListItemElement = BaseSlateElement & {
  type: 'collapsible-list-item';
  id: string;
};

export type ImageUploadError = 'unknown' | 'forbidden';

export type ImageElement = BaseSlateElement & {
  type: 'image';
  url: string;
  href?: string;
  uploading?: boolean;
  error?: boolean | ImageUploadError;
};

export type LinkElement = BaseSlateElement & {
  type: 'link';
  url: string;
};

export type ParagraphElement = BaseSlateElement & {
  type?: 'paragraph';
};

export type ToolElement = BaseSlateElement & {
  type: 'tool';
  tool: string;
};

export type VariableElement = BaseSlateElement & {
  type: 'variable';
} & ToolInput;

export type DataSourceVariableElement = BaseSlateElement & {
  type: 'data-source-variable';
  dataSourceVariableId: string;
  placeholder: string;
};

export type WorkflowEmbedElement = BaseSlateElement & {
  type: 'workflow-embed';
  workflow: string;
};

export type WorkflowLinkElement = BaseSlateElement & {
  type: 'workflow-link';
  workflow: string;
};

export type CollectionWidget = BaseSlateElement & {
  type: 'widget-collection';
  collectionId: string;
  // If we typed this we'd need to include the entire user config universe in
  // slate-tools. Leave it any for now.
  defaultConfig?: any;
};

export type ListWidget = BaseSlateElement & {
  type: 'widget-list';
  privateOnly?: boolean;
};

export type ListElement = BaseSlateElement & {
  type: 'bulleted-list' | 'numbered-list';
};

export type ListItemElement = BaseSlateElement & {
  type: 'list-item';
};

export type ConditionalElement = BaseSlateElement & {
  type: 'conditional';
  isChained: boolean;
  condition: {
    dataSource: {
      dataSourceId: string;
      outputId: string;
    } | null;
    operation: string | null;
    value: string | null;
  } | null;
};

export type StatusElement = BaseSlateElement & {
  type: 'status';
  icon: string;
  href?: string;
};

type UnconfiguredElementType =
  | 'show-more'
  | 'heading'
  | 'list-item'
  | 'void-wrapper'
  | 'void-spacer'
  | 'search-box'
  | 'search-results'
  | 'top-used-list'
  | 'widget-drafts'
  | 'widget-top-used';
type UnconfiguredElement = BaseSlateElement & { type: UnconfiguredElementType };

export type SlateNode = SlateElement | SlateText;
export type SlateText = {
  type?: never;
  children?: never;
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

export type SlateElement =
  | CollapsibleElement
  | CollapsibleListItemElement
  | ImageElement
  | LinkElement
  | ParagraphElement
  | ToolElement
  | VariableElement
  | DataSourceVariableElement
  | WorkflowEmbedElement
  | WorkflowLinkElement
  | UnconfiguredElement
  | CollectionWidget
  | ListWidget
  | ListElement
  | ListItemElement
  | ConditionalElement
  | StatusElement;

export type SlateElementAttributes = {
  'data-slate-node': 'element';
  'data-slate-inline'?: true;
  'data-slate-void'?: true;
  dir?: 'rtl';
  ref: any;
};
