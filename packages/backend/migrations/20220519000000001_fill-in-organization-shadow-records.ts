import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Migrating up requires adding a shadow record to the organizations table for
  // each user within an org, and setting that inserted organization ID as the
  // user's organization_id. That user also needs to be an admin of the
  // organization otherwise sad times will ensue.
  pgm.alterColumn('organizations', 'shadow_record', { default: null });

  pgm.sql(
    `UPDATE users SET is_organization_admin=true WHERE organization_id IS NULL;`
  );
  const users_without_org: { id: number }[] = await pgm.db.select(
    `SELECT id FROM users WHERE organization_id IS NULL;`
  );

  for (const { id } of users_without_org) {
    pgm.sql(`
        WITH insert_shadow_orgs AS (
            INSERT INTO organizations (shadow_record, settings)
            SELECT true, '{}' FROM users WHERE users.id=${id}
            RETURNING id
        )
        UPDATE users SET organization_id = insert_shadow_orgs.id FROM insert_shadow_orgs WHERE users.id=${id};
    `);
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the FKEY constraint, unset the org admin flag for users with a shadow
  // org, then drop the shadow org rows
  pgm.sql(
    `UPDATE users SET is_organization_admin=false, organization_id=NULL from organizations WHERE organizations.id = users.organization_id AND organizations.shadow_record=true;`
  );
  pgm.sql(`DELETE FROM organizations WHERE shadow_record;`);
  pgm.alterColumn('organizations', 'shadow_record', { default: false });
}
