import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('domains', [
    'default_open',
    'default_interface',
    'insert_text_xpath',
    'variable_extractors',
    'default_interface_options',
    'track_session',
    'inject',
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('domains', {
    default_open: 'boolean',
    default_interface: 'string',
    insert_text_xpath: 'string',
    variable_extractors: 'jsonb',
    default_interface_options: 'json',
    track_session: 'boolean',
    inject: 'boolean',
  });
}
