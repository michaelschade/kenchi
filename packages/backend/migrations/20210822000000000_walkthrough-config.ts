import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE tools
    SET configuration = JSONB_SET(configuration::jsonb, '{walkthroughTag}', 'true')
    WHERE configuration::text LIKE '%"externalTags":["__WALKTHROUGH__"],%'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
