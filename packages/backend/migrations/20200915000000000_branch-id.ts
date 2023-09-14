import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    // No easy way to populate this, just manually do it. There aren't many drafts anyway
    pgm.addColumn(table, { branch_id: { type: 'string' } });
    pgm.createIndex(table, ['branch_id'], {
      name: `idx_${table}_unique_branchId_branchTypeUnpublished`,
      unique: true,
      where: `is_latest = true AND branch_type != 'published'`,
    });
    pgm.dropIndex(table, ['static_id', 'created_by_user_id', 'branch_type'], {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
    });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.dropColumn(table, 'branch_id');
    pgm.createIndex(table, ['static_id', 'created_by_user_id', 'branch_type'], {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
      unique: true,
      where: `is_latest = true AND is_deleted = false AND branch_type != 'published'`,
    });
  });
}
