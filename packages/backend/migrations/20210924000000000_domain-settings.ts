import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('user_domain_settings', 'domain_interface');
  pgm.addColumn('domains', {
    settings: { type: 'json', notNull: true, default: '{}' },
  });
  pgm.sql(`
    UPDATE domains SET settings = JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
      'inject', inject,
      'insertTextXPath', insert_text_xpath,
      'variableExtractors', variable_extractors,
      'isGmail', default_interface = 'gmail',
      'sidebar', JSONB_STRIP_NULLS(
        COALESCE(default_interface_options::jsonb, '{}'::jsonb) || JSONB_BUILD_OBJECT('defaultOpen', default_open)
      )
    ));
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('user_domain_settings', { domain_interface: 'string' });
  pgm.dropColumn('domains', 'settings');
}
