import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE tools SET keywords = '{"First automation"}' WHERE metadata->>'initialContent' = 'firstAutomation'`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE tools SET keywords = '{}' WHERE metadata->>'initialContent' = 'firstAutomation'`
  );
}
