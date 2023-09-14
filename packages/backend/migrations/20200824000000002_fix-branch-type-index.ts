import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('workflows', 'static_id', {
    name: 'idx_workflows_unique_staticId',
  });

  ['workflows', 'tools'].forEach((table) => {
    pgm.dropIndex(table, 'static_id', {
      name: `idx_${table}_unique_staticId_user_branchTypeDraft`,
    });
    pgm.createIndex(table, ['static_id', 'created_by_user_id', 'branch_type'], {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
      unique: true,
      where: `is_latest = true AND branch_type != 'published'`,
    });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.dropIndex(table, ['static_id', 'created_by_user_id', 'branch_type'], {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
    });
    pgm.createIndex(table, ['static_id', 'created_by_user_id'], {
      name: `idx_${table}_unique_staticId_user_branchTypeDraft`,
      unique: true,
      where: `is_latest = true AND branch_type = 'draft'`,
    });
  });

  pgm.createIndex('workflows', ['static_id'], {
    name: `idx_workflows_unique_staticId`,
    unique: true,
    where: `is_latest = true`,
  });
}
