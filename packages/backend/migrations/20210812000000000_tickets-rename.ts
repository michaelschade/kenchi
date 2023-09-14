import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // A transaction would freeze the database
  pgm.noTransaction();

  pgm.addColumn('external_tickets', { rated_at: 'timestamp' });
  pgm.sql(
    `UPDATE external_tickets SET rated_at = (data->'conversation_rating'->>'created_at')::timestamp`
  );

  pgm.renameColumn('external_tickets', 'ticket_created_at', 'started_at');
  pgm.renameColumn('external_tickets', 'updated_at', 'synced_at');
  pgm.renameColumn('external_tickets', 'ticket_updated_at', 'updated_at');
  pgm.renameColumn('external_tickets', 'ticket_id', 'id');
  pgm.renameTable('external_tickets', 'insights_conversations');
  pgm.addIndex('insights_conversations', ['organization_id', 'rated_at']);
  pgm.addColumn('user_workflow_views', {
    conversation_id: {
      type: 'string',
    },
  });
  pgm.addColumn('user_tool_runs', {
    conversation_id: {
      type: 'string',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // A transaction would freeze the database
  pgm.noTransaction();
  pgm.dropColumn('user_tool_runs', 'conversation_id');
  pgm.dropColumn('user_workflow_views', 'conversation_id');
  pgm.dropIndex('insights_conversations', ['organization_id', 'rated_at']);
  pgm.renameTable('insights_conversations', 'external_tickets');
  pgm.dropColumn('external_tickets', 'rated_at');
  pgm.renameColumn('external_tickets', 'id', 'ticket_id');
  pgm.renameColumn('external_tickets', 'updated_at', 'ticket_updated_at');
  pgm.renameColumn('external_tickets', 'synced_at', 'updated_at');
  pgm.renameColumn('external_tickets', 'started_at', 'ticket_created_at');
}
