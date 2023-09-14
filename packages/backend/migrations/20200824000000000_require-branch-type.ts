import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.sql(`
      UPDATE ${table}
      SET
        branch_type = (CASE
          WHEN item_type = 'normal' THEN 'published'
          WHEN item_type = 'draft' THEN 'draft'
          WHEN item_type = 'suggestion' THEN 'suggestion'
        END)::branch_type_enum
    `);
    pgm.alterColumn(table, 'branch_type', { notNull: true });
    pgm.alterColumn(table, 'item_type', { notNull: false, default: null });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.alterColumn(table, 'item_type', { notNull: true, default: 'normal' });
    pgm.alterColumn(table, 'branch_type', { notNull: false });
  });
}
