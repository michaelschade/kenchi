import { objectType } from 'nexus';
import { Domain as Fields } from 'nexus-prisma';

import { getDomainSettings } from '../models/domain';
import { idResolver } from '../utils';

export const Domain = objectType({
  name: 'Domain',
  definition(t) {
    t.implements('Node');

    t.id('id', idResolver('domain'));
    t.field(Fields.name);
    t.field(Fields.hosts);

    t.nullable.boolean('trackSession', { resolve: () => false }); // Not in use right now

    t.nullable.boolean('isGmail', {
      resolve: (domain) => getDomainSettings(domain).isGmail ?? null,
    });
    t.nullable.field('variableExtractors', {
      type: 'Json',
      resolve: (domain) => getDomainSettings(domain).variableExtractors,
    });
    t.nullable.string('insertTextXPath', {
      resolve: (domain) => getDomainSettings(domain).insertTextXPath ?? null,
      deprecation: 'Use insertionPath',
    });
    t.nullable.field('insertionPath', {
      type: 'InsertionPath',
      resolve: (domain) => {
        const settings = getDomainSettings(domain);
        if (settings.insertionPath) {
          return settings.insertionPath;
        }
        if (settings.insertTextXPath) {
          return {
            type: 'xpath',
            xpath: settings.insertTextXPath,
          };
        }
        return null;
      },
    });

    t.nullable.boolean('inject', {
      resolve: (domain) => getDomainSettings(domain).inject ?? null,
    });
    t.nullable.boolean('injectSidebar', {
      resolve: (domain) => getDomainSettings(domain).sidebar?.inject ?? null,
    });
    t.nullable.boolean('injectHud', {
      resolve: (domain) => getDomainSettings(domain).hud?.inject ?? null,
    });

    // TODO: group these in a sidebar specific blob
    t.nullable.boolean('defaultOpen', {
      resolve: (domain) =>
        getDomainSettings(domain).sidebar?.defaultOpen ?? null,
    });
    t.nullable.string('defaultSide', {
      resolve: (domain) => getDomainSettings(domain).sidebar?.side ?? null,
    });
    t.nullable.field('customPlacements', {
      type: 'Json',
      resolve: (domain) => getDomainSettings(domain).sidebar?.customPlacements,
    });
  },
});
