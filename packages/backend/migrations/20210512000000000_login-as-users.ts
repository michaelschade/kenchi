import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('users', { disabled_at: 'timestamp' });
  pgm.sql(`
    INSERT INTO users (email, name, given_name, type, wants_edit_suggestion_emails)
    VALUES ('support@kenchi.com', 'Kenchi', 'Kenchi', 'kenchi', false)
  `);
  pgm.sql(`
    UPDATE users
    SET disabled_at = NOW()
    WHERE type = 'kenchi' AND organization_id IS NOT NULL
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM users WHERE email = 'support@kenchi.com'`);
  pgm.dropColumn('users', 'disabled_at');
}
