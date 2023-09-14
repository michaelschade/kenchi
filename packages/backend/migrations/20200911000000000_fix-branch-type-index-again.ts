import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    // Being lazy about drop-then-create so we can keep the name
    pgm.dropIndex(table, 'static_id', {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
    });
    pgm.createIndex(table, ['static_id', 'created_by_user_id', 'branch_type'], {
      name: `idx_${table}_unique_staticId_user_branchTypeUnpublished`,
      unique: true,
      where: `is_latest = true AND is_deleted = false AND branch_type != 'published'`,
    });
  });
}

export async function down(_pgm: MigrationBuilder): Promise<void> {
  // shrug
}
