import { InsertionPath } from '@kenchi/commands';

export const expandInsertionPath = (path: InsertionPath): InsertionPath => {
  switch (path.type) {
    case 'nest':
    case 'fallback':
      return {
        type: path.type,
        commands: path.commands.map(expandInsertionPath),
      };
    case 'xpath':
      return {
        type: 'xpath',
        xpath: parseXPath(path.xpath),
      };
    default:
      return path;
  }
};

const hasClassFunc = /has-class\(['"]([a-zA-Z0-9_-]*)['"]\)/g;

// If you change this also update domPicker/index.ts!
export const parseXPath = (path: string) => {
  if (!path) {
    return path;
  }
  return path.replace(
    hasClassFunc,
    (_match, className: string) =>
      `contains(concat(' ', normalize-space(@class), ' '), ' ${className} ')`
  );
};
