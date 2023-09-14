import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE user_workflow_views SET conversation_id = ticket_id WHERE ticket_id IS NOT NULL and conversation_id IS NULL`
  );
  pgm.sql(
    `UPDATE user_tool_runs SET conversation_id = ticket_id WHERE ticket_id IS NOT NULL and conversation_id IS NULL`
  );
  pgm.dropColumn('user_workflow_views', 'ticket_id');
  pgm.dropColumn('user_tool_runs', 'ticket_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('user_workflow_views', {
    ticket_id: {
      type: 'string',
    },
  });
  pgm.addColumn('user_tool_runs', {
    ticket_id: {
      type: 'string',
    },
  });

  pgm.sql(`UPDATE user_tool_runs SET ticket_id = conversation_id`);
  pgm.sql(`UPDATE user_workflow_views SET ticket_id = conversation_id`);
}
