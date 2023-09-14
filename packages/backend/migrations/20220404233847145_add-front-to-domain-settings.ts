import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO domains(hosts, shadow_record, settings) 
    VALUES('{app.frontapp.com}', FALSE, JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
        'variableExtractors', JSON_BUILD_OBJECT('front', JSON_BUILD_OBJECT()),
        'isGmail', FALSE))
    );`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM domains WHERE hosts = '{app.frontapp.com}' AND shadow_record = FALSE and organization_id is null;
    `);
}
