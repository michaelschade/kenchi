import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('collections', 'is_default');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('collections', {
    is_default: { type: 'boolean', default: false, notNull: true },
  });
}
