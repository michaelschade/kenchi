import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('tools', {
    keywords: {
      type: 'character varying[]',
      notNull: true,
      default: '{}',
    },
  });
  pgm.addColumn('workflows', {
    keywords: {
      type: 'character varying[]',
      notNull: true,
      default: '{}',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('tools', 'keywords');
  pgm.dropColumn('workflows', 'keywords');
}
