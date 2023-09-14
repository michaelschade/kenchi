import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('object_type_enum', [
    'tool',
    'workflow-embed',
    'workflow-link',
  ]);
  pgm.createTable(
    'workflow_contains_object',
    {
      id: 'id',
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('now()'),
      },
      workflow_static_id: {
        type: 'character varying',
        notNull: true,
      },
      object_type: {
        type: 'object_type_enum',
        notNull: true,
      },
      object_static_id: {
        type: 'character varying',
        notNull: true,
      },
    },
    {
      constraints: {
        unique: ['workflow_static_id', 'object_static_id'],
      },
      comment:
        'For the latest version of a Workflow, maps the objects (e.g. Tools or other Workflows) contained within the workflow. This allows us to quickly find associated Workflows from a Tool, see associated Tools in Collections, etc.',
    }
  );
  pgm.createIndex('workflow_contains_object', 'workflow_static_id');
  pgm.createIndex('workflow_contains_object', 'object_static_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('workflow_contains_object');
  pgm.dropType('object_type_enum');
}
