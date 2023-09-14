import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM workflows WHERE type = 'page'`);
  pgm.dropColumn('workflows', 'type');
  pgm.dropType('workflow_type_enum');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('workflow_type_enum', ['workflow', 'embed', 'page']);
  pgm.addColumn('workflows', {
    type: {
      type: 'workflow_type_enum',
      notNull: true,
      default: 'workflow',
    },
  });
}
