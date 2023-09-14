import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.noTransaction();

  ['workflows', 'tools'].forEach((table) => {
    if (table !== 'workflows') {
      pgm.createIndex(table, 'static_id', {
        // Calling normal instead of published so we can make an index with the
        // "correct" name when we rename everything
        name: `idx_${table}_unique_staticId_normal`,
        unique: true,
        where: `is_latest = true AND item_type = 'normal'::item_type_enum`,
      });
      pgm.dropIndex(table, 'static_id', {
        name: `idx_${table}_unique_staticId`,
      });
    }
    pgm.addColumn(table, {
      branched_from_id: { type: 'integer', references: table },
      metadata: { type: 'json', notNull: true, default: '{}' },
      suggested_by_user_id: { type: 'integer', references: 'users' },
    });
  });

  pgm.addTypeValue('item_type_enum', 'suggestion');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // FYI you can't remove type values

  pgm.dropColumns('workflows', [
    'metadata',
    'branched_from_id',
    'suggested_by_user_id',
  ]);

  ['workflows', 'tools'].forEach((table) => {
    pgm.dropColumns(table, ['metadata', 'branched_from_id']);

    pgm.createIndex(table, 'static_id', {
      name: `idx_${table}_unique_staticId`,
      unique: true,
      where: `is_latest = true`,
    });
    pgm.dropIndex(table, 'static_id', {
      name: `idx_${table}_unique_staticId_normal`,
    });
  });
}
