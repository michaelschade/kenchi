import { mapValues } from 'lodash';
import { extendType, idArg, inputObjectType, nonNull, objectType } from 'nexus';
import type { InputDefinitionBlock } from 'nexus/dist/definitions/definitionBlocks';
import { ExternalDataReference as Fields } from 'nexus-prisma';

import { loggedInUser } from '../auth/permissions';
import { generateStaticId } from '../utils';
import { notFoundError, unauthenticatedError } from './KenchiError';

export const ExternalDataReference = objectType({
  name: 'ExternalDataReference',
  definition(t) {
    t.field({ ...Fields.id, type: 'ID' });
    t.field(Fields.organization);
    t.field(Fields.referenceSource);
    t.field(Fields.referenceType);
    t.field(Fields.label);
    t.field(Fields.referenceId);
  },
});

// Does it make sense to have different types for create and update? The input types are all non-null
function inputs(
  t: InputDefinitionBlock<
    'ExternalDataReferenceCreateInput' | 'ExternalDataReferenceUpdateInput'
  >,
  required: boolean
) {
  const type = required ? ('nonNull' as const) : ('nullable' as const);
  t[type].string('referenceSource');
  t[type].field('referenceType', { type: 'ExternalReferenceTypeEnum' });
  t[type].string('label');
  t[type].string('referenceId');
}

export const ExternalDataReferenceCreateInput = inputObjectType({
  name: 'ExternalDataReferenceCreateInput',
  definition(t) {
    inputs(t, true);
  },
});

export const ExternalDataReferenceUpdateInput = inputObjectType({
  name: 'ExternalDataReferenceUpdateInput',
  definition(t) {
    inputs(t, false);
  },
});

export const ExternalDataReferenceOutput = objectType({
  name: 'ExternalDataReferenceOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('externalDataReference', {
      type: 'ExternalDataReference',
    });
  },
});

export const ExternalDataReferenceMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateExternalDataReference', {
      type: 'ExternalDataReferenceOutput',
      args: {
        id: nonNull(idArg()),
        data: nonNull('ExternalDataReferenceUpdateInput'),
      },
      async resolve(_root, { id, data }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let externalDataReference =
          await ctx.db.externalDataReference.findUnique({
            where: { id },
          });
        if (
          !externalDataReference ||
          externalDataReference.organizationId !== user.organizationId
        ) {
          return { error: notFoundError() };
        }

        externalDataReference = await ctx.db.externalDataReference.update({
          where: { id },
          data: mapValues(data, (value: string) => value ?? undefined),
        });

        return { externalDataReference };
      },
    });

    t.field('createExternalDataReference', {
      type: 'ExternalDataReferenceOutput',
      args: {
        data: nonNull('ExternalDataReferenceCreateInput'),
      },
      async resolve(_root, { data }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        const externalDataReference = ctx.db.externalDataReference.create({
          data: {
            ...data,
            id: generateStaticId('edref'),
            organizationId: user.organizationId,
          },
        });

        return { externalDataReference };
      },
    });

    t.field('archiveExternalDataReference', {
      type: 'ExternalDataReferenceOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let externalDataReference =
          await ctx.db.externalDataReference.findUnique({
            where: { id },
          });
        if (
          !externalDataReference ||
          externalDataReference.organizationId !== user.organizationId
        ) {
          return { error: notFoundError() };
        }

        externalDataReference = await ctx.db.externalDataReference.update({
          where: { id },
          data: { isArchived: true },
        });
        return { externalDataReference };
      },
    });
  },
});
