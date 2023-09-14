import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addType('external_reference_type_enum', ['tag']);
  pgm.createTable('external_data_references', {
    id: {
      type: 'string',
      primaryKey: true,
    },
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
    organization_id: {
      type: 'integer',
      references: 'organizations',
    },
    user_id: { type: 'integer', references: 'users' },
    reference_source: { type: 'string', notNull: true },
    reference_type: {
      type: 'external_reference_type_enum',
      notNull: true,
    },
    label: {
      type: 'string',
      notNull: true,
    },
    reference_id: {
      type: 'string',
      notNull: true,
    },
    is_archived: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });

  pgm.sql(`
  INSERT INTO external_data_references (id, created_at, updated_at, organization_id, reference_source, reference_type, label, reference_id, is_archived) 
  SELECT 'edref_' || substring(id from 'etag_#"%#"' for '#'), created_at, updated_at, organization_id, 'intercom', 'tag', label, intercom_id, is_archived FROM external_tags;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('external_data_references');
  pgm.dropType('external_reference_type_enum');
}
