import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('external_tickets', {
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    organization_id: {
      type: 'integer',
      primaryKey: true,
      notNull: true,
      references: 'organizations',
    },
    ticket_id: {
      type: 'character varying',
      primaryKey: true,
      notNull: true,
    },
    completed_at: {
      type: 'timestamp',
    },
    ticket_created_at: {
      type: 'timestamp',
      notNull: true,
    },
    ticket_updated_at: {
      type: 'timestamp',
      notNull: true,
    },
    data: {
      type: 'json',
      notNull: true,
    },
    score: {
      type: 'smallint',
    },
  });

  pgm.createTable('user_tool_runs', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    run_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    revision_id: {
      type: 'integer',
      references: 'tools',
    },
    static_id: {
      type: 'string',
      notNull: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
    },
    ticket_id: {
      type: 'string',
    },
  });

  pgm.createTable('user_workflow_views', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    viewed_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    revision_id: {
      type: 'integer',
      references: 'tools',
    },
    static_id: {
      type: 'string',
      notNull: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
    },
    ticket_id: {
      type: 'string',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_workflow_views');
  pgm.dropTable('user_tool_runs');
  pgm.dropTable('external_tickets');
}
