import { execSync } from 'child_process';
import fs from 'fs';

test('schema is up-to-date', () => {
  const tmpFile = `src/graphql/generated.check.ts`;
  execSync(`pnpm graphql-codegen ${tmpFile}`, {
    timeout: 8000,
    env: {
      ...process.env,
      GQL_CODEGEN_FILE: tmpFile,
    } as any,
  });

  const expected = fs.readFileSync(tmpFile, 'utf8');
  const actual = fs.readFileSync('src/graphql/generated.ts', 'utf8');
  execSync(`rm ${tmpFile}`);
  expect(actual).toEqual(expected);
});
