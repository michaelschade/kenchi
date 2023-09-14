import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  ['workflows', 'tools'].forEach((table) => {
    pgm.dropColumns(table, ['item_type', 'forked_from_id']);
  });
  pgm.dropType('item_type_enum');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addType('item_type_enum', ['normal', 'draft', 'suggestion', 'fork']);
  ['workflows', 'tools'].forEach((table) => {
    pgm.addColumn(table, {
      item_type: {
        type: 'item_type_enum',
        default: 'normal',
        notNull: false,
      },
      forked_from_id: {
        type: 'integer',
      },
    });
  });
}
