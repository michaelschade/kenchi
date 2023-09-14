import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE user_groups (
      id SERIAL PRIMARY KEY,
      organization_id integer NOT NULL REFERENCES organizations (id),
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      name character varying NOT NULL,
      permissions character varying[] NOT NULL
    );
  `);
  pgm.addColumn('users', {
    group_id: {
      type: 'integer',
      references: 'user_groups',
    },
  });
  pgm.addColumn('organizations', {
    settings: {
      type: 'json',
    },
  });
  pgm.sql(`
    INSERT INTO user_groups (id, organization_id, name, permissions) SELECT id * 2 - 1, id, 'Admin', '{"*"}' FROM organizations;
    INSERT INTO user_groups (id, organization_id, name, permissions) SELECT id * 2, id, 'Team', '{"*"}' FROM organizations;
    SELECT setval('user_groups_id_seq', (SELECT MAX(id) FROM user_groups));
    UPDATE users SET group_id = organization_id * 2;
    UPDATE organizations SET settings = CONCAT('{"defaultUserGroupId": ', id * 2, '}')::json;
  `);
  pgm.alterColumn('organizations', 'settings', { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('organizations', 'settings');
  pgm.dropColumn('users', 'group_id');
  pgm.dropTable('user_groups');
}
