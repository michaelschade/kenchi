#!/usr/local/bin/npx ts-node
import dotenv from 'dotenv';
import migrationRunner from 'node-pg-migrate';
import path from 'path';
import { Client } from 'pg';

dotenv.config();

export async function main(databaseName: string) {
  // Generate the pg connection string for the test schema
  const connectionString = process.env.DATABASE_URL!.replace(
    /\/\w*$/,
    `/${databaseName}`
  );

  console.log(`Initializing DB`);

  const client = new Client({
    connectionString: connectionString.replace(/\/\w*$/, ''),
  });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
  await client.query(`CREATE DATABASE "${databaseName}"`);
  await client.end();

  const start = new Date().getTime();
  // Run the migrations to ensure our schema has the required structure
  await migrationRunner({
    databaseUrl: connectionString,
    migrationsTable: 'pgmigrations',
    dir: path.join(__dirname, '../migrations'),
    direction: 'up',
    count: 1000,
    ignorePattern: 'WIP_.*',
    noLock: true,
    logger: {
      info: () => {
        /* NOOP */
      },
      warn: (msg) => {
        if (msg.indexOf('not wrapped in a transaction') === -1) {
          console.warn(msg);
        }
      },
      error: console.error,
    },
  });

  console.log(`Finished initializing DB in ${new Date().getTime() - start}ms`);
}

if (require.main === module) {
  main(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(-1);
  });
}
