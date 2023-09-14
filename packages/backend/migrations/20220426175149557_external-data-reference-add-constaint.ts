import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(
    'external_data_references',
    'idx_external_data_references_xor_organizationId_userId',
    { check: `NUM_NONNULLS(organization_id, user_id) = 1` }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    'external_data_references',
    'idx_external_data_references_xor_organizationId_userId'
  );
}
