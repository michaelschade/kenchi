import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('users', 'group_id', { notNull: true });
  pgm.sql(`
    UPDATE user_groups SET permissions = '{"admin"}' WHERE name = 'Admin';
    UPDATE user_groups SET permissions = '{"publisher"}' WHERE name = 'Team';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE user_groups SET permissions = '{"*"}' WHERE name = 'Admin' OR name = 'Team';
  `);
  pgm.alterColumn('users', 'group_id', { notNull: false });
}
