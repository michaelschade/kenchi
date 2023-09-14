import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addType('branch_type_enum', [
    'published',
    'draft',
    'remix',
    'suggestion',
  ]);

  ['workflows', 'tools'].forEach((table) => {
    pgm.addColumn(table, {
      branch_type: { type: 'branch_type_enum' },
    });
    pgm.sql(`
      UPDATE ${table}
      SET
        branch_type = (CASE
          WHEN item_type = 'normal' THEN 'published'
          WHEN item_type = 'draft' THEN 'draft'
          WHEN item_type = 'suggestion' THEN 'suggestion'
        END)::branch_type_enum
    `);

    pgm.createIndex(table, ['static_id', 'is_latest', 'branch_type'], {
      name: `idx_${table}_staticId_isLatest_branchType`,
    });
    pgm.createIndex(table, 'static_id', {
      name: `idx_${table}_unique_staticId_branchTypePublished`,
      unique: true,
      where: `is_latest = true AND branch_type = 'published'`,
    });
    pgm.createIndex(table, ['static_id', 'created_by_user_id'], {
      name: `idx_${table}_unique_staticId_user_branchTypeDraft`,
      unique: true,
      where: `is_latest = true AND branch_type = 'draft'`,
    });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.dropColumn(table, 'branch_type');
    // Indexes are auto-dropped with the column
  });
  pgm.dropType('branch_type_enum');
}
