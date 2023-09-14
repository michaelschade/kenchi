import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('auth_type_enum', ['unauthenticated', 'user', 'login_as']);
  pgm.createTable('auth_sessions', {
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    id: {
      type: 'string',
      primaryKey: true,
    },
    data: {
      type: 'json',
      notNull: true,
      default: '{}',
    },
    secret: {
      type: 'string',
      unique: true,
    },
    type: {
      type: 'auth_type_enum',
      notNull: true,
      default: 'unauthenticated',
    },
    user_id: {
      type: 'integer',
      references: 'users',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('auth_sessions');
  pgm.dropType('auth_type_enum');
}
