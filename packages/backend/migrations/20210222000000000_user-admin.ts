import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('users', {
    is_organization_admin: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });

  pgm.sql(`
    UPDATE users u
    SET is_organization_admin = true
    FROM user_group_members ugm
    LEFT JOIN user_groups ug
      ON ugm.user_group_id = ug.id
    WHERE ug.name = 'Admin' AND u.id = ugm.user_id
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('users', 'is_organization_admin');
}
