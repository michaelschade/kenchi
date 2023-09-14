import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('external_tickets', 'completed_at');
  pgm.renameColumn('external_tickets', 'score', 'rating');
  pgm.addColumn('external_tickets', {
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('external_tickets', 'created_at');
  pgm.renameColumn('external_tickets', 'rating', 'score');
  pgm.addColumn('external_tickets', {
    completed_at: {
      type: 'timestamp',
    },
  });
}
