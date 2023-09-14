import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('data_imports', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
    },
    initial_data: {
      type: 'jsonb',
      notNull: true,
    },
    state: {
      type: 'jsonb',
    },
    started_at: {
      type: 'timestamp',
    },
    completed_at: {
      type: 'timestamp',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('data_imports');
}
