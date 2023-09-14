import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('logs', {
    logged_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.sql('UPDATE logs SET logged_at = created_at');
  pgm.addIndex('logs', 'logged_at');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('logs', 'logged_at');
}
