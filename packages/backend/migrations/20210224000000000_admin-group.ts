import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  const deletions = await pgm.db.select(`
    SELECT ug.id, ugm.user_id
    FROM user_groups ug
    LEFT JOIN user_group_members ugm ON ugm.user_group_id = ug.id
    WHERE ug.name = 'Admin'
  `);
  if (deletions.length > 0) {
    console.log(
      'DELETING these group ID/member ID pairs',
      JSON.stringify(deletions)
    );
  }
  pgm.sql(`
    DELETE FROM collection_acl WHERE user_group_id IN (SELECT id FROM user_groups WHERE name = 'Admin');
    DELETE FROM user_group_members WHERE user_group_id IN (SELECT id FROM user_groups WHERE name = 'Admin');
    DELETE FROM user_groups WHERE name = 'Admin';
  `);
  pgm.dropColumn('user_groups', 'permissions');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('user_groups', {
    permissions: {
      type: 'character varying[]',
      notNull: true,
    },
  });

  // No going back from data deletion!
}
