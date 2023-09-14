import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('data_imports', { type: { type: 'string', notNull: false } });
  pgm.sql(
    `UPDATE data_imports SET type = 'intercom', initial_data = initial_data->'savedReplies'`
  );
  pgm.alterColumn('data_imports', 'type', { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE data_imports SET initial_data = JSON_BUILD_OBJECT('type', 'intercom', 'savedReplies', initial_data)`
  );
  pgm.dropColumn('data_imports', 'type');
}
