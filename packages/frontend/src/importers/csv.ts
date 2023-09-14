import Result, { success } from '@kenchi/shared/lib/Result';
import { SlateNode } from '@kenchi/slate-tools/lib/types';

import { ImportEntry } from '.';

function parseContentString(content: string): Result<SlateNode[], string> {
  const lines = content.split('\n');
  return success(
    lines.map((line) => ({
      type: 'paragraph',
      children: [{ text: line.trim() }],
    }))
  );
}

export default function parse(input: string[][]): ImportEntry[] {
  return input.map((row, i) => ({
    id: `${i}`,
    name: row[0],
    slate: parseContentString(row[1]),
  }));
}
