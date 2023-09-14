const { exec } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { readdirSync } = require('fs');
const { difference } = require('lodash');
const { exit } = require('process');

dotenv.config({ path: path.resolve(process.cwd(), '.env.ci') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbName = 'test_template';

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr || error) {
        reject(stderr || error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function hasUpToDateTemplate() {
  const client = new Client({
    connectionString: `${global.connectionString}/${dbName}`,
  });
  try {
    await client.connect();
  } catch (e) {
    return null;
  }
  const { rows } = await client.query(
    'SELECT name FROM pgmigrations ORDER BY name'
  );
  const runMigrations = rows.map((row) => row.name);
  const files = readdirSync('migrations')
    .filter((f) => !f.startsWith('WIP_'))
    .map((f) => f.substr(0, f.length - 3));
  const diff = [
    ...difference(files, runMigrations),
    ...difference(runMigrations, files),
  ];
  await client.end();

  return diff.length === 0;
}

module.exports = async () => {
  global.connectionString = process.env.DATABASE_URL.replace(/\/\w*$/, '');
  if (await hasUpToDateTemplate()) {
    console.log('test_template is up to date, reusing');
    return;
  }

  console.log('test_template is out of date, restoring from SQL dump');
  await execPromise(
    `psql -d ${global.connectionString} < tests/test_template.sql`
  );
  if (await hasUpToDateTemplate()) {
    return;
  }

  console.log('test_template SQL dump is also out of date, regenerating');
  await execPromise(`pnpm ts-node ./dev/generate_test_template.ts ${dbName}`);
  await execPromise(
    `pg_dump -d ${global.connectionString}/${dbName} --create --clean --if-exists -f tests/test_template.sql`
  );

  if (await hasUpToDateTemplate()) {
    return;
  }

  console.error(
    'test_template is still out of date after regeneration, something went wrong'
  );
  exit(-1);
};
