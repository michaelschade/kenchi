import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('users', 'group_id', { notNull: false });
  pgm.createType('user_type_enum', ['user', 'kenchi']);
  pgm.addColumn('users', {
    type: {
      type: 'user_type_enum',
      notNull: true,
      default: 'user',
    },
  });
  pgm.sql(`
    INSERT INTO users (type, organization_id) SELECT 'kenchi', id FROM organizations
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM users WHERE type = 'kenchi'
  `);
  pgm.dropColumn('users', 'type');
  pgm.dropType('user_type_enum');
  pgm.alterColumn('users', 'group_id', { notNull: true });
}
