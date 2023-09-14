import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('waitlist', { invited_at: { type: 'timestamp' } });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('waitlist', 'invited_at');
}
