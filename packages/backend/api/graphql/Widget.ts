import {
  arg,
  extendType,
  idArg,
  inputObjectType,
  interfaceType,
  list,
  nonNull,
  objectType,
} from 'nexus';
import { Widget as Fields } from 'nexus-prisma';
import { BranchTypeEnum, Prisma, PrismaPromise, Widget } from 'prisma-client';

import { hasOrgPermission, loggedInUser } from '../auth/permissions';
import { WidgetModel } from '../models';
import { decodeId } from '../utils';
import {
  alreadyModifiedError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';
import {
  loadForUpdate,
  versionedNodeGeneratedFields,
} from './utils/versionedNodeModify';
import { versionedNodeDefinition } from './VersionedNode';

export const WidgetInterface = interfaceType({
  name: 'Widget',
  resolveType: (node) => (node.isLatest ? 'WidgetLatest' : 'WidgetRevision'),
  definition(t) {
    versionedNodeDefinition(t, {
      revisionType: 'WidgetRevision',
      latestType: 'WidgetLatest',
      model: WidgetModel,
    });

    // Widget-specific
    t.field(Fields.contents);
    t.field(Fields.inputs);
  },
});

export const WidgetLatest = objectType({
  name: 'WidgetLatest',
  sourceType: 'prisma.Widget',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('LatestNode');
    t.implements('Widget');
  },
});

export const WidgetRevision = objectType({
  name: 'WidgetRevision',
  sourceType: 'prisma.Widget',
  definition(t) {
    t.implements('Node');
    t.implements('VersionedNode');
    t.implements('Widget');
  },
});

export const WidgetOutput = objectType({
  name: 'WidgetOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('widget', { type: 'WidgetLatest' });
  },
});

export const WidgetCreateInput = inputObjectType({
  name: 'WidgetCreateInput',
  definition(t) {
    t.nonNull.field('contents', { type: 'SlateNodeArray' });
    t.nullable.field('inputs', { type: list(nonNull('WidgetInput')) });
  },
});

export const WidgetUpdateInput = inputObjectType({
  name: 'WidgetUpdateInput',
  definition(t) {
    t.nullable.field('contents', { type: 'Json' });
    t.nullable.field('inputs', { type: list(nonNull('WidgetInput')) });
  },
});

export const WidgetMutations = extendType({
  type: 'Mutation',
  definition(t) {
    // TODO: see if there is enough in common to create a shared create method for this and spaces
    t.field('createWidget', {
      type: 'WidgetOutput',
      args: {
        data: nonNull(arg({ type: 'WidgetCreateInput' })),
      },
      async resolve(_root, { data: { contents, inputs } }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        if (!hasOrgPermission(user, 'manage_widgets', user.organizationId)) {
          return { error: permissionError() };
        }

        const generatedData = versionedNodeGeneratedFields(
          user,
          null,
          WidgetModel.staticIdPrefix
        );

        const widget = ctx.db.widget.create({
          data: {
            ...generatedData,
            branchType: BranchTypeEnum.published,
            contents,
            inputs: inputs ?? [],
            organizationId: user.organizationId,
          },
        });

        return { widget };
      },
    });

    // TODO: see if there is enough in common to create a shared update method for this and spaces
    t.field('updateWidget', {
      type: 'WidgetOutput',
      args: {
        id: nonNull(idArg()),
        data: nonNull(arg({ type: 'WidgetUpdateInput' })),
      },
      async resolve(_root, { id, data: { contents, inputs } }, ctx) {
        if (!ctx.viewerContext) {
          return { error: unauthenticatedError() };
        }
        const user = ctx.viewerContext.user;

        const idLoad = await loadForUpdate(
          id,
          (_model: Widget) =>
            hasOrgPermission(user, 'manage_widgets', user.organizationId),
          ctx.db.widget.findUnique
        );
        if (idLoad[0]) {
          return { error: idLoad[0] };
        }
        const [, existingWidget] = idLoad;

        const generatedData = versionedNodeGeneratedFields(
          user,
          existingWidget
        );
        const preservableData = WidgetModel.preservableFields(existingWidget);

        const data: Prisma.WidgetUncheckedCreateInput = {
          ...generatedData,
          ...preservableData,
          contents: contents ?? preservableData.contents,
          inputs: inputs ?? preservableData.inputs,
        };

        const txns: [PrismaPromise<unknown>, PrismaPromise<Widget>] = [
          ctx.db.widget.update({
            where: { id: existingWidget.id },
            data: { isLatest: false },
          }),
          ctx.db.widget.create({ data }),
        ];

        const [, widget] = await ctx.db.$transaction(txns);

        return { widget };
      },
    });
    t.field('archiveWidget', {
      type: 'WidgetOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (!hasOrgPermission(user, 'manage_widgets', user.organizationId)) {
          return { error: permissionError() };
        }
        const [, decodedId] = decodeId(id);
        let widget = await ctx.db.widget.findUnique({
          where: { id: decodedId },
        });

        if (!widget) {
          return { error: notFoundError() };
        }

        if (!widget.isLatest) {
          return { error: alreadyModifiedError() };
        }

        widget = await ctx.db.widget.update({
          where: { id: widget.id },
          data: { isArchived: true },
        });

        return { widget };
      },
    });
  },
});
