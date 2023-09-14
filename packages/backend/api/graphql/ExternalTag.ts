import { captureMessage } from '@sentry/node';
import { extendType, idArg, inputObjectType, nonNull, objectType } from 'nexus';
import { ExternalTag as Fields } from 'nexus-prisma';

import { Context } from '../auth/contextType';
import { loggedInUser } from '../auth/permissions';
import { generateStaticId } from '../utils';
import { notFoundError, unauthenticatedError } from './KenchiError';

export const ExternalTag = objectType({
  name: 'ExternalTag',
  definition(t) {
    t.field({ ...Fields.id, type: 'String' });
    t.field(Fields.label);
    t.field(Fields.intercomId);
    t.field(Fields.organization);
  },
});

export const ExternalTagInput = inputObjectType({
  name: 'ExternalTagInput',
  definition(t) {
    t.nonNull.string('label');
    t.nullable.string('intercomId');
  },
});

export const ExternalTagOutput = objectType({
  name: 'ExternalTagOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('tag', { type: 'ExternalTag' });
  },
});

export const ExternalTagMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateExternalTag', {
      type: 'ExternalTagOutput',
      args: {
        id: nonNull(idArg()),
        tagData: nonNull('ExternalTagInput'),
      },
      async resolve(_root, { id, tagData }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let tag = await ctx.db.externalTag.findUnique({ where: { id } });
        if (!tag || tag.organizationId !== user.organizationId) {
          return { error: notFoundError() };
        }

        const [updatedTag, _] = await Promise.all([
          ctx.db.externalTag.update({
            where: { id },
            data: tagData,
          }),
          updateExternalDataReference(ctx, id, user.organizationId, tagData),
        ]);

        return { tag: updatedTag };
      },
    });

    t.field('createExternalTag', {
      type: 'ExternalTagOutput',
      args: {
        tagData: nonNull('ExternalTagInput'),
      },
      async resolve(_root, { tagData }, ctx) {
        const user = loggedInUser(ctx);

        if (!user) {
          return { error: unauthenticatedError() };
        }

        const tagId = generateStaticId('etag');
        const [tag, _] = await Promise.all([
          ctx.db.externalTag.create({
            data: {
              ...tagData,
              id: tagId,
              organizationId: user.organizationId,
            },
          }),
          createExternalDataReference(ctx, tagId, user.organizationId, tagData),
        ]);

        return { tag };
      },
    });

    t.field('archiveExternalTag', {
      type: 'ExternalTagOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let tag = await ctx.db.externalTag.findUnique({ where: { id } });
        if (!tag || tag.organizationId !== user.organizationId) {
          return { error: notFoundError() };
        }

        const [updatedTag, _] = await Promise.all([
          ctx.db.externalTag.update({
            where: { id },
            data: { isArchived: true },
          }),
          updateExternalDataReference(ctx, id, user.organizationId, {
            isArchived: true,
          }),
        ]);
        return { tag: updatedTag };
      },
    });
  },
});

function tagIdToExternalDataReferenceId(tagId: string) {
  return tagId.replace('etag', 'edref');
}

async function createExternalDataReference(
  ctx: Context,
  tagId: string,
  organizationId: number,
  tagData: { intercomId?: string | null | undefined; label: string }
) {
  if (!tagData.intercomId) {
    captureMessage(
      'Dual write: Unable to create external data reference: no intercomId',
      { level: 'fatal' }
    );
    return null;
  }
  return ctx.db.externalDataReference.create({
    data: {
      id: tagIdToExternalDataReferenceId(tagId),
      organizationId,
      referenceSource: 'intercom',
      referenceType: 'tag',
      label: tagData.label,
      referenceId: tagData.intercomId,
    },
  });
}

async function updateExternalDataReference(
  ctx: Context,
  tagId: string,
  userOrganizationId: number,
  tagData:
    | { intercomId?: string | null | undefined; label: string }
    | { isArchived: true }
) {
  const id = tagIdToExternalDataReferenceId(tagId);
  let externalDataReference = await ctx.db.externalDataReference.findUnique({
    where: { id },
  });
  if (!externalDataReference) {
    captureMessage(
      'Dual write: Unable to update external data reference: object not found',
      { level: 'fatal', extra: { externalDataReferenceId: id } }
    );
    return null;
  }
  if (externalDataReference.organizationId !== userOrganizationId) {
    captureMessage(
      'Dual write: Unable to update external data reference: organization id mismatch',
      {
        level: 'fatal',
        extra: {
          externalDataReferenceOrganizationId:
            externalDataReference.organizationId,
          userOrganizationId,
        },
      }
    );
    return null;
  }
  if ('isArchived' in tagData) {
    return ctx.db.externalDataReference.update({
      where: { id },
      data: tagData,
    });
  } else {
    return ctx.db.externalDataReference.update({
      where: { id },
      data: {
        label: tagData.label,
        referenceId: tagData.intercomId ? tagData.intercomId : undefined,
      },
    });
  }
}
