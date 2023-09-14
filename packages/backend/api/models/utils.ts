import { Prisma } from 'prisma-client';
import { BaseEditor } from 'slate';

import {
  SlateElement,
  SlateNode,
  SlateText,
} from '@kenchi/slate-tools/lib/types';

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor;
    Element: SlateElement;
    Text: SlateText;
  }
}

export function expectJsonObject(
  val: Prisma.JsonValue
): asserts val is Prisma.JsonObject {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error('Expected value to be an object');
  }
}

export function expectJsonArray(
  val: Prisma.JsonValue
): asserts val is Prisma.JsonArray {
  if (!Array.isArray(val)) {
    throw new Error('Expected value to be an array');
  }
}

export function expectToolConfig(
  val: Prisma.JsonValue
): asserts val is ToolSlateConfiguration {
  expectJsonObject(val);
  if (!val.data) {
    throw new Error(
      'Expected value to be a tool configuration. Configuration has no "data"'
    );
  }
  expectJsonObject(val.data);
  if (!val.data.children) {
    throw new Error(
      'Expected value to be a tool configuration. Configuration data has no "children"'
    );
  }

  expectSlateNodeArray(val.data.children);
}

export function expectSlateNodeArray(
  val: Prisma.JsonValue
): asserts val is SlateNode[] {
  expectJsonArray(val);
  for (const object of val) {
    expectSlateNode(object);
  }
}

export function expectSlateNode(
  val: Prisma.JsonValue
): asserts val is SlateNode {
  expectJsonObject(val);
  if (typeof val.text !== 'undefined') {
    if (typeof val.text !== 'string') {
      throw new Error(
        `Expected value to be a slate node. Text node (${val.text}) should contain string text value`
      );
    }
    if (val.type || val.children) {
      throw new Error(
        `Expected value to be a slate node. Text node (${val.text}) should not contain "type" or "children"`
      );
    }
  } else if (val.type || val.children) {
    if (val.type && typeof val.type !== 'string') {
      throw new Error(
        `Expected value to be a slate node. Node has no "text" and "children" and has type "${val.type}"`
      );
    }

    if (!val.children) {
      // TODO: throw error once we migrate legacy tool configs to have children
    } else if (!Array.isArray(val.children)) {
      throw new Error(
        `Expected value to be a slate node. Node has no "children" and has type "${val.type}"`
      );
    } else {
      expectSlateNodeArray(val.children);
    }
  } else {
    console.log(val);
    throw new Error(
      `Expected value to be a slate node. Node has no "text" or ("type" or "children")`
    );
  }
}
type ToolSlateConfiguration = { data: { children: SlateNode[] } };
