import {
  arg,
  booleanArg,
  extendType,
  idArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { Organization as Fields } from 'nexus-prisma';
import fetch from 'node-fetch';
import { BranchTypeEnum, Prisma, UserTypeEnum, Workflow } from 'prisma-client';
import { URLSearchParams } from 'url';

import { generateViewerContext, loggedInUserAndOrg } from '../auth/permissions';
import { ToolModel, WorkflowModel } from '../models';
import { getSettings } from '../models/organization';
import {
  encodeId,
  idResolver,
  resolveConnectionFromFindMany,
  versionedNodeBaseData,
} from '../utils';
import {
  getToolCount,
  getWorkflowCount,
  loadCollectionForEdit,
} from './Collection';
import {
  invalidValueError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';
import { executeDelete } from './utils/versionedNodeModify';

export const Organization = objectType({
  name: 'Organization',
  definition(t) {
    t.implements('Node');
    t.id('id', idResolver('org'));
    t.field(Fields.name);
    t.field(Fields.updatedAt);
    t.nullable.field('disabledMessage', {
      type: 'String',
      resolve: (org) => getSettings(org).disabledMessage || null,
    });

    t.field(Fields.googleDomain);
    t.field(Fields.additionalGoogleDomains);
    t.field(Fields.shadowRecord);

    t.connectionField('domains', {
      type: 'Domain',
      resolve: resolveConnectionFromFindMany((org, args, { db }) =>
        db.domain.findMany({
          ...args,
          where: {
            organizationId: org.id,
            shadowRecord: false,
          },
          orderBy: { createdAt: 'desc' },
        })
      ),
    });

    t.nullable.field('defaultUserGroup', {
      type: 'UserGroup',
      deprecation: 'Now a map, need to expose something new',
      async resolve(org, {}, ctx) {
        const groupIds = getSettings(org).defaultUserGroupMap?.['*'];
        if (groupIds && groupIds.length > 0) {
          return ctx.db.userGroup.findUnique({ where: { id: groupIds[0] } });
        }
        return null;
      },
    });

    t.nullable.field('defaultSpaceWidgets', {
      type: 'Json',
      resolve: (org) => getSettings(org).defaultSpaceWidgets,
    });

    t.connectionField('collections', {
      type: 'Collection',
      resolve: resolveConnectionFromFindMany((org, args, { db }) =>
        db.collection.findMany({
          ...args,
          where: {
            // Only show collections that aren't private
            OR: [
              { acl: { some: { user: null } } },
              { NOT: { defaultPermissions: { equals: [] } } },
            ],
            organizationId: org.id,
            isArchived: false,
          },
        })
      ),
    });

    t.connectionField('workflows', {
      type: 'WorkflowLatest',
      additionalArgs: {
        updatedSince: 'DateTime',
        includeArchived: booleanArg(),
      },
      resolve: resolveConnectionFromFindMany(
        (org, args, ctx, { updatedSince, includeArchived }) =>
          WorkflowModel.findMany(ctx, {
            ...args,
            where: {
              collection: {
                organizationId: org.id,
              },
              isLatest: true,
              branchType: BranchTypeEnum.published,
              isArchived: includeArchived ? undefined : false,
              createdAt: updatedSince
                ? { gt: updatedSince as string }
                : undefined,
            },
          })
      ),
    });

    t.connectionField('tools', {
      type: 'ToolLatest',
      additionalArgs: {
        updatedSince: 'DateTime',
        includeArchived: booleanArg(),
      },
      resolve: resolveConnectionFromFindMany(
        (org, args, ctx, { updatedSince, includeArchived }) =>
          ToolModel.findMany(ctx, {
            ...args,
            where: {
              collection: {
                organizationId: org.id,
              },
              isLatest: true,
              branchType: BranchTypeEnum.published,
              isArchived: includeArchived ? undefined : false,
              createdAt: updatedSince
                ? { gt: updatedSince as string }
                : undefined,
            },
          })
      ),
    });

    t.connectionField('users', {
      type: 'BaseUser',
      additionalArgs: {
        includeDisabled: booleanArg(),
      },
      resolve: resolveConnectionFromFindMany(
        (org, args, { db }, { includeDisabled }) =>
          db.user.findMany({
            ...args,
            where: {
              organizationId: org.id,
              type: UserTypeEnum.user,
              disabledAt: includeDisabled ? undefined : { equals: null },
            },
            orderBy: { email: 'asc' },
          })
      ),
    });

    t.connectionField('userGroups', {
      type: 'UserGroup',
      resolve: resolveConnectionFromFindMany((org, args, { db }) =>
        db.userGroup.findMany({
          ...args,
          where: { organizationId: org.id },
        })
      ),
    });

    t.list.field('shortcuts', {
      type: 'Shortcut',
      resolve: (org, {}, { db }) =>
        db.shortcut.findMany({
          where: { organizationId: org.id, userId: null },
        }),
    });

    t.list.field('externalTags', {
      type: 'ExternalTag',
      deprecation: 'Transition to externalDataReferences',
      resolve: (org, {}, { db }) => {
        return db.externalTag.findMany({
          where: { organizationId: org.id, isArchived: false },
        });
      },
    });

    t.list.field('externalDataReferences', {
      type: 'ExternalDataReference',
      args: {
        referenceType: nonNull(arg({ type: 'ExternalReferenceTypeEnum' })),
        referenceSource: nonNull(stringArg()),
      },
      resolve: (org, args, { db }) =>
        db.externalDataReference.findMany({
          where: {
            organizationId: org.id,
            isArchived: false,
            ...args,
          },
        }),
    });

    t.list.field('dataSources', {
      type: 'DataSource',
      resolve: (org, {}, { db }) => {
        return db.dataSource.findMany({
          where: { organizationId: org.id, isArchived: false },
        });
      },
    });

    t.boolean('hasIntercomAccessToken', {
      resolve: (org) => !!getSettings(org).intercomAccessToken,
    });
  },
});

export const CreateOrganizationOutput = objectType({
  name: 'CreateOrganizationOutput',
  definition(t) {
    // Return viewer so we can associate the user with the newly created org
    t.field('viewer', { type: 'Viewer' });
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('sharedCollection', { type: 'Collection' });
  },
});

export const OrganizationOutput = objectType({
  name: 'OrganizationOutput',
  definition(t) {
    t.nullable.field('organization', { type: 'Organization' });
    t.nullable.field('error', { type: 'KenchiError' });
  },
});

export const SHARED_WORKFLOW_TAG = 'sharedWorkflow';

export const OrganizationMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createOrganization', {
      type: 'CreateOrganizationOutput',
      async resolve(_root, {}, ctx) {
        const { user, organization } = loggedInUserAndOrg(ctx);
        if (!user) {
          return { error: unauthenticatedError(), viewer: {} };
        }
        const organizationId = organization.id;
        if (!organization.shadowRecord) {
          return {
            error: invalidValueError(
              `You're already a member of an organization, you cannot create another one.`
            ),
            viewer: {},
          };
        }

        await ctx.db.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            shadowRecord: false,
          },
        });

        const [sharedCollection] = await ctx.db.$transaction([
          ctx.db.collection.create({
            data: {
              name: 'Shared',
              defaultPermissions: ['publisher'],
              organizationId,
              description: '',
            },
          }),
          ctx.db.collection.updateMany({
            where: {
              organizationId: null,
              // TODO(permissions): introduce notion of collection owner so we don't
              // have to guess which collections to adopt.
              acl: {
                some: { userId: user.id, permissions: { has: 'admin' } },
              },
            },
            data: {
              organizationId,
              defaultPermissions: [],
            },
          }),
        ]);

        await ctx.db.workflow.create({
          data: {
            ...versionedNodeBaseData('wrkf', sharedCollection, user),
            name: 'Intro to Kenchi for teams',
            contents: SHARED_WORKFLOW_CONTENTS,
            description: 'An introduction to sharing with Kenchi.',
            metadata: { initialContent: SHARED_WORKFLOW_TAG },
          },
        });

        await generateViewerContext(ctx);
        return { viewer: {}, sharedCollection };
      },
    });

    t.field('updateOrganization', {
      type: 'OrganizationOutput',
      args: {
        name: stringArg(),
        useGoogleDomain: booleanArg(),
        collectionsToShare: list(nonNull(idArg())),
        intercomCode: stringArg(),
      },
      async resolve(
        _root,
        { name, useGoogleDomain, collectionsToShare, intercomCode },
        ctx
      ) {
        const viewerContext = ctx.viewerContext;
        if (!viewerContext) {
          return { error: unauthenticatedError() };
        }
        const user = viewerContext.user;

        if (!user.isOrganizationAdmin) {
          return { error: permissionError() };
        }

        const organization = await ctx.db.organization.findUnique({
          where: { id: user.organizationId },
          rejectOnNotFound: true,
        });

        let googleDomain: string | null | undefined;
        if (useGoogleDomain === true) {
          const userinfo = user.userinfoLatest || user.userinfoFirst;
          const hd =
            userinfo &&
            typeof userinfo === 'object' &&
            'hd' in userinfo &&
            userinfo.hd;
          if (hd) {
            googleDomain = hd as string;
          } else {
            return {
              error: invalidValueError(
                `We were unable to verify your ownership of this domain.`,
                'useGoogleDomain'
              ),
            };
          }
        } else if (useGoogleDomain === false) {
          googleDomain = null;
        } else {
          googleDomain = undefined;
        }

        let settings = undefined;
        if (intercomCode) {
          settings = getSettings(organization);
          if (settings.intercomAccessToken) {
            return {
              error: invalidValueError(
                'Already have an Intercom connection',
                'intercomCode'
              ),
            };
          }

          const body = new URLSearchParams();
          body.append('code', intercomCode);
          body.append('client_id', process.env.INTERCOM_CLIENT_ID);
          body.append('client_secret', process.env.INTERCOM_CLIENT_SECRET);
          const resp = await fetch('https://api.intercom.io/auth/eagle/token', {
            method: 'POST',
            body,
          });
          const json = await resp.json();
          const token = json.access_token;
          if (typeof token !== 'string') {
            return {
              error: invalidValueError(
                'Error connecting to Intercom',
                'intercomCode'
              ),
            };
          }
          settings = { ...settings, intercomAccessToken: token };
        }

        const collectionLoads = await Promise.all(
          (collectionsToShare || []).map((idStr) =>
            loadCollectionForEdit(ctx, idStr)
          )
        );
        type CollectionWithAcl = Exclude<typeof collectionLoads[0][0], null>;
        const collections: CollectionWithAcl[] = [];
        for (let collectionLoad of collectionLoads) {
          if (collectionLoad[1]) {
            return {
              error: collectionLoad[1],
              viewer: {},
            };
          } else {
            collections.push(collectionLoad[0]);
          }
        }

        // TODO: catch and handle duplicate googleDomain
        const updatedOrganization = ctx.db.organization.update({
          where: { id: user.organizationId },
          data: {
            name: name ?? undefined,
            googleDomain,
            settings,
          },
        });

        if (collections.length > 0) {
          await ctx.db.$transaction([
            ctx.db.collection.updateMany({
              where: { id: { in: collections.map((c) => c.id) } },
              data: {
                defaultPermissions: ['publisher'],
              },
            }),
          ]);

          // If we're sharing collections, conservatively archive the "Shared"
          // collection we maybe just made if:
          // - There's only one workflow in it that matches our shared workflow
          // - That workflow hasn't been updated
          const workflows = await ctx.db.workflow.findMany({
            include: { collection: true },
            where: {
              collection: { organizationId: user.organizationId },
              metadata: { equals: { initialContent: SHARED_WORKFLOW_TAG } },
            },
          });
          if (workflows.length === 1 && workflows[0].isLatest) {
            const collection = workflows[0].collection;
            const [toolCount, workflowCount] = await Promise.all([
              getToolCount(collection, ctx.db),
              getWorkflowCount(collection, ctx.db),
            ]);
            if (toolCount === 0 && workflowCount === 1) {
              await executeDelete<
                Prisma.WorkflowUncheckedCreateInput,
                Workflow
              >(
                'publish_workflow',
                encodeId('wrev', workflows[0].id),
                WorkflowModel.preservableFields,
                viewerContext,
                ctx.db.workflow
              );
              await ctx.db.collection.update({
                where: { id: collection.id },
                data: { isArchived: true },
              });
            }
          }
        }

        return { organization: updatedOrganization };
      },
    });
  },
});

const SHARED_WORKFLOW_CONTENTS = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Welcome to your first shared collection! Everyone in your team can access all workflows and automations in this collection (or add their own), so your whole team can share your best practices and work better together.',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Creating new collections', bold: true }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'When you ' },
      {
        type: 'link',
        children: [{ text: 'create a new workflow or automation' }],
        url: '/new',
      },
      {
        text: ', you can also create a new collection. This is a great way to split up your content by team or type of work—for example, we find lots of folks create collections for their frontline support tiers, internal product reviews, and general product education.',
      },
    ],
  },
  { type: 'paragraph', children: [{ text: 'Permissions', bold: true }] },
  {
    type: 'paragraph',
    children: [
      {
        text: 'We encourage you to keep it simple: Kenchi works best when everyone can collaborate together.',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "That said, we know sometimes you've gotta lock things down. Collections let you set permission levels for each person or group you've added. For example, we might let everyone see our ",
      },
      { text: 'Escalations', italic: true },
      {
        text: ' collection, but only a few groups publish content and manage membership:',
      },
    ],
  },
  {
    type: 'void-wrapper',
    children: [
      { type: 'void-spacer', children: [{ text: '' }] },
      {
        type: 'image',
        url: 'https://kenchi-files.s3.us-west-1.amazonaws.com/5/57X9imUtDvq0%2BHnLrxRt/Q%3D%3D/image.png',
        children: [{ text: '' }],
      },
      { type: 'void-spacer', children: [{ text: '' }] },
    ],
  },
  { type: 'paragraph', children: [{ text: 'Groups', bold: true }] },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Kenchi is meant to grow with your team! Instead of giving individuals specific permissions, try ',
      },
      {
        type: 'link',
        children: [{ text: 'creating new groups in our Dashboard' }],
        url: '/dashboard/groups',
      },
      { text: ' and adding those to collections instead.' },
    ],
  },
  { type: 'paragraph', children: [{ text: 'Suggested edits', bold: true }] },
  {
    type: 'paragraph',
    children: [
      {
        text: "Here's a fun special feature in Kenchi: suggestions! We know not everyone on your team will feel comfortable changing content everyone else uses, but we've found that even the newest team members have great contributions. Suggested edits let anyone propose a change for someone else to review. Here's a quick intro:",
      },
    ],
  },
  {
    type: 'void-wrapper',
    children: [
      { type: 'void-spacer', children: [{ text: '' }] },
      {
        type: 'image',
        url: 'https://kenchi-files.s3.us-west-1.amazonaws.com/5/4fteebsG72yr9b27/TdUYw%3D%3D/eff4e1b1ab1742dabe49c73a2ce974f5-with-play.gif',
        children: [{ text: '' }],
        href: 'https://www.loom.com/share/eff4e1b1ab1742dabe49c73a2ce974f5',
      },
      { type: 'void-spacer', children: [{ text: '' }] },
    ],
  },
  { type: 'paragraph', children: [{ text: "We'd love to chat!", bold: true }] },
  {
    type: 'paragraph',
    children: [
      {
        text: "We're so excited you decided to give Kenchi a try. We'd love to help you make the most of Kenchi. Feel free to ",
      },
      {
        type: 'link',
        children: [{ text: 'email us at support@kenchi.com' }],
        url: 'mailto:support@kenchi.com',
      },
      { text: ' any time, or ' },
      {
        type: 'link',
        children: [{ text: 'grab some time on our calendar to talk live' }],
        url: 'https://calendly.com/kenchi-michael/30m',
      },
      { text: '.' },
    ],
  },
  { type: 'paragraph', children: [{ text: 'Hope to chat soon! :)' }] },
];
