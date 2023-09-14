import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

function extractVariablesFromSlate(value: any) {
  const serialize = (n: any) => {
    if (n.type === 'variable') {
      return [{ ...n }];
    } else if (n.children) {
      return n.children.flatMap(serialize);
    } else {
      return [];
    }
  };
  return value.flatMap(serialize);
}

function lazyMigrateInputs(inputs: any, config: any) {
  if (Array.isArray(config)) {
    let newInputs = inputs;
    config.forEach((c) => (newInputs = lazyMigrateInputs(newInputs, c)));
    return newInputs;
  } else if (typeof config === 'object' && config.slate) {
    const variables = extractVariablesFromSlate(config.children);
    const newInputs = [...inputs];
    variables.forEach((v: any) => {
      if (!newInputs.find((i) => i.source === v.source && i.id === v.id)) {
        newInputs.push({
          source: v.source,
          id: v.id,
          placeholder: v.placeholder || v.id,
        });
      }
    });
    return newInputs;
  } else {
    return inputs;
  }
}

function migrateInputs(component: string, configuration: any) {
  switch (component) {
    case 'GmailAction':
      return lazyMigrateInputs([], configuration.data);
    case 'OpenURLs':
      return lazyMigrateInputs([], configuration.urls);
  }

  return null;
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  const rows = await pgm.db.select(`
    SELECT id, is_latest, is_deleted, component, configuration
    FROM tools
    WHERE configuration::text LIKE '%variable%' AND inputs::text = '[]'
    ORDER BY id ASC
  `);
  if (rows.length > 0) {
    console.log(
      'Migrating inputs for tools:',
      JSON.stringify(rows.map((r) => r.id))
    );
  }
  await Promise.all(
    rows.map((row) => {
      const inputs = migrateInputs(row.component, row.configuration);
      if (row.is_latest && !row.is_deleted) {
        // Lame hack for fixing caches...just bump the timestamp so clients get a new version.
        return pgm.db.query(
          `UPDATE tools SET inputs = $1, created_at = NOW() WHERE id = $2`,
          [JSON.stringify(inputs), row.id]
        );
      } else {
        return pgm.db.query(`UPDATE tools SET inputs = $1 WHERE id = $2`, [
          JSON.stringify(inputs),
          row.id,
        ]);
      }
    })
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // No going back
}
