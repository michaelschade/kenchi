import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('spaces', {
    name: {
      type: 'string',
      notNull: false,
    },
  });
  pgm.sql(`
    UPDATE spaces s
    SET name = g.name
    FROM user_groups g
    WHERE
      s.name IS NULL AND
      s.group_id = g.id
  `);
  pgm.alterColumn('spaces', 'name', { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('spaces', 'name');
}
