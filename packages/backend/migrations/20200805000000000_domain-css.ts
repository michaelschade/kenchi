import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('domains', ['iframe_style', 'custom_style']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('domains', {
    iframe_style: {
      type: 'text',
    },
    custom_style: {
      type: 'text',
    },
  });
}
