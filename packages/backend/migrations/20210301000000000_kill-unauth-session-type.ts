import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM auth_sessions WHERE type = 'unauthenticated'`);
  pgm.alterColumn('auth_sessions', 'type', { default: null });
  pgm.alterColumn('auth_sessions', 'user_id', { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('auth_sessions', 'user_id', { notNull: false });
  pgm.alterColumn('auth_sessions', 'type', { default: 'unauthenticated' });
}
