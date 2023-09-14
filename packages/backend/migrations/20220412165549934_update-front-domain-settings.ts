import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE domains
    SET settings = '{
        "variableExtractors": {"front": {}},
        "sidebar": {
            "defaultOpen": true,
            "customPlacements": {
                "embed-left": {
                    "name": "Embed on left side",
                    "style": "body.kenchi-open.kenchi-embed-left > .layer { margin-left: 300px; width: calc(100% - 300px); } #kenchi-iframe.kenchi-embed-left { left: 0; }"
                },
                "embed-right": {
                    "name": "Embed on right side",
                    "style": "body.kenchi-open.kenchi-embed-right > .layer { margin-right: 300px; width: calc(100% - 300px); } #kenchi-iframe.kenchi-embed-right { right: 0; }"
                }
            }
        },
        "hud": {"inject": true},
        "isGmail": false
    }'
    WHERE hosts = '{app.frontapp.com}' AND shadow_record = FALSE and organization_id is null;`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE domains
    SET settings = '{
        "variableExtractors": {"front": {}},
        "isGmail": false
    }'
    WHERE hosts = '{app.frontapp.com}' AND shadow_record = FALSE and organization_id is null;`);
}
