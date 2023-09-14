import { captureMessage } from '@sentry/minimal';

import { SlateConfig } from './tool/types';
import { ParagraphElement, SlateNode, VariableElement } from './types';

export const newSlateBlob = ({
  singleLine = false,
  rich = false,
}: {
  singleLine?: boolean;
  rich?: boolean;
}): SlateConfig => {
  return {
    slate: true,
    singleLine,
    rich,
    children: singleLine ? [{ text: '' }] : [{ children: [{ text: '' }] }],
  };
};

export const extractVariablesFromSlate = (value: SlateNode[]) => {
  const serialize = (n: SlateNode): VariableElement[] => {
    if (n.type === 'variable') {
      return [{ ...n }];
    } else if (n.children) {
      return n.children.flatMap(serialize);
    } else {
      return [];
    }
  };
  return value.flatMap(serialize);
};

// SUUUUPER hacky but only temporary
let wasModified = false;
const deserializeNodes = (n: SlateNode): SlateNode => {
  if (n.type === 'variable' && !n.children) {
    wasModified = true;
    return {
      // @ts-ignore
      ...n,
      children: [{ text: '' }],
    };
  } else if (n.children) {
    return {
      ...n,
      children: n.children.map(deserializeNodes),
    };
  } else {
    return n;
  }
};

// TODO: this is annoying, migrate to normal slate blobs
export const deserialize = (value: any) => {
  if (!value || typeof value !== 'object' || !value.slate) {
    throw new Error(`Expected a Slate blob, instead got ${value}`);
  }

  wasModified = false;
  const children = value.children.map(deserializeNodes);
  if (wasModified) {
    captureMessage('deserializeNodes: variable without children', {
      extra: { value: JSON.stringify(value) },
    });
  }

  const singleLine = value.singleLine === undefined ? true : value.singleLine;
  if (singleLine) {
    return [{ children }];
  } else {
    return children;
  }
};

// Clean up the Slate format for our use
export const serializeSlate = (
  value: SlateNode[],
  { singleLine = false, rich = false }
): SlateConfig => {
  let children;
  if (singleLine && value[0].children) {
    children = value[0].children;
  } else {
    children = value;
  }
  return { slate: true, singleLine, rich, children };
};

export const isSlateEmpty = (value?: SlateNode | SlateConfig) =>
  value?.children?.length === 1 && value.children[0].text === '';

export const isParagraph = (node: SlateNode): node is ParagraphElement =>
  !!node.children && (!node.type || node.type === 'paragraph');
