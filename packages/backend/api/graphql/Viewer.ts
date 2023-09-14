import { captureMessage } from '@sentry/node';
import type { oauth2_v2 } from 'googleapis';
import { google } from 'googleapis';
import { extendType, nonNull, objectType, stringArg } from 'nexus';
import {
  AuthTypeEnum,
  Collection,
  Organization,
  Prisma,
  PrismaClient,
  User,
} from 'prisma-client';

import {
  generateViewerContext,
  loggedInUser,
  loggedInUserAndOrg,
} from '../auth/permissions';
import getConfig from '../config';
import { getSettings } from '../models/organization';
import { queueLogin, queueNewUser } from '../queue';
import {
  getSearchKeyValidUntil,
  makeSearchKeyForUser,
} from '../search/searcher';
import {
  isDevelopment,
  resolveConnectionFromFindMany,
  versionedNodeBaseData,
} from '../utils';
import { permissionError, unauthenticatedError } from './KenchiError';

export const Viewer = objectType({
  name: 'Viewer',
  definition(t) {
    t.string('csrfToken', {
      resolve(_root, {}, ctx) {
        return ctx.csrfToken();
      },
    });
    t.nullable.field('searchConfig', {
      type: 'SearchConfig',
      async resolve(_root, {}, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return null;
        }
        return {
          apiKey: await makeSearchKeyForUser(user),
          apiKeyExpiration: getSearchKeyValidUntil() * 1000,
          appId: process.env.ALGOLIA_APP_ID,
          indexName: process.env.ALGOLIA_SEARCH_INDEX_NAME,
          shouldUseAlgolia: isDevelopment()
            ? process.env.ALGOLIA_ENABLE_IN_DEVELOPMENT?.toLowerCase() ===
              'true'
            : true,
          lastUpdated: Date.now(),
        };
      },
    });
    t.nullable.string('installUrl', {
      args: {
        reason: stringArg(),
        previousVersion: stringArg(),
        version: stringArg(),
      },
      resolve(_root, { reason }) {
        if (reason === 'install') {
          return `${getConfig().appHost}/installed`;
        } else {
          return null;
        }
      },
    });
    t.nullable.string('uninstallUrl', {
      args: {
        version: stringArg(),
      },
      resolve(_root, {}) {
        // TODO
        return null;
      },
    });
    t.connectionField('defaultDomains', {
      type: 'Domain',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.domain.findMany({
          ...args,
          where: { organizationId: null, shadowRecord: false },
        })
      ),
    });
    t.nullable.field('session', {
      type: 'AuthSession',
      resolve(_root, {}, ctx) {
        const secret: string = (ctx as any).__rawRequestForAuthOnly.sessionID;
        return ctx.db.authSession.findUnique({ where: { secret } });
      },
    });
    t.nullable.field('organization', {
      type: 'Organization',
      async resolve(_root, {}, ctx) {
        const { organization } = loggedInUserAndOrg(ctx);
        return organization;
      },
    });
    t.nullable.field('user', {
      type: 'User',
      resolve(_root, {}, ctx) {
        return loggedInUser(ctx);
      },
    });
    t.connectionField('productChanges', {
      type: 'ProductChange',
      resolve: resolveConnectionFromFindMany((_root, args, { db }) =>
        db.productChange.findMany({
          ...args,
          orderBy: { createdAt: 'desc' },
        })
      ),
    });
    t.boolean('trigger500', {
      deprecation: 'Duh',
      resolve() {
        throw new Error('Test 500');
      },
    });
    t.boolean('triggerAsync500', {
      deprecation: 'Duh',
      async resolve() {
        throw new Error('Test 500');
      },
    });
  },
});

export const ViewerOutput = objectType({
  name: 'ViewerOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.field('viewer', { type: 'Viewer' });
  },
});

export const SearchConfig = objectType({
  name: 'SearchConfig',
  definition(t) {
    t.field('apiKey', { type: 'String' });
    t.field('apiKeyExpiration', { type: 'DateTime' });
    t.field('appId', { type: 'String' });
    t.field('indexName', { type: 'String' });
    t.field('shouldUseAlgolia', { type: 'Boolean' });
    t.field('lastUpdated', { type: 'DateTime' });
  },
});

// Schema$Userinfo gets downloaded, make sure it typechecks without that.
type Userinfo = oauth2_v2.Schema$Userinfo & Record<string, any>;
async function getUserinfo(token: string): Promise<Userinfo> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  // TODO: catch
  const service = google.oauth2({ version: 'v2', auth });
  const userinfoResp = await service.userinfo.get();
  return userinfoResp.data;
}

async function getOrganization(
  googleId: string,
  googleDomain: string | null | undefined,
  ctx: NexusContext
): Promise<Organization | null> {
  if (googleDomain) {
    const organizations = await ctx.db.organization.findMany({
      where: {
        OR: [
          { googleDomain },
          { additionalGoogleDomains: { has: googleDomain } },
        ],
      },
    });
    if (organizations.length > 1) {
      captureMessage(
        `Multiple orgs found with same Google domain ${organizations
          .map((o) => o.id)
          .join(', ')}`
      );
    }
    return organizations[0] || null;
  } else {
    const user = await ctx.db.user.findUnique({
      select: { organization: true },
      where: { googleId },
    });
    return user ? user.organization : null;
  }
}

function userCreateData(
  userinfo: Userinfo,
  organization: Organization | null
): Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput {
  const defaultUserGroupMap = organization
    ? getSettings(organization).defaultUserGroupMap
    : undefined;

  const domain = userinfo.hd;
  const userGroupIds: number[] = defaultUserGroupMap?.['*'] || [];
  if (domain) {
    userGroupIds.push(...(defaultUserGroupMap?.[domain] || []));
  }

  const organizationCreateData = organization
    ? { organizationId: organization.id }
    : {
        organization: {
          create: {
            shadowRecord: true,
            settings: {},
          },
        },
        isOrganizationAdmin: true,
      };

  return {
    googleId: userinfo.id,
    email: userinfo.email,
    userinfoFirst: userinfo,
    name: userinfo.name,
    givenName: userinfo.given_name,
    ...organizationCreateData,
    groupMemberships:
      userGroupIds.length > 0
        ? { create: userGroupIds.map((userGroupId) => ({ userGroupId })) }
        : undefined,
  };
}

export const ViewerMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('login', {
      type: 'ViewerOutput',
      description: 'Login or register via Google token',
      args: {
        token: nonNull(stringArg()),
      },
      async resolve(_root, { token }, ctx) {
        const userinfo = await getUserinfo(token);

        const googleId = userinfo.id;
        if (!googleId) {
          throw new Error('Expected to always have a Google ID');
        }

        let user = await ctx.db.user.findUnique({ where: { googleId } });
        if (!user && userinfo.email) {
          const premadeUser = await ctx.db.user.findUnique({
            include: { organization: true },
            where: { email: userinfo.email },
          });
          if (premadeUser) {
            // User's been pre-allocated, claim the account
            user = await ctx.db.user.update({
              where: { id: premadeUser.id },
              data: {
                googleId: userinfo.id,
                email: userinfo.email,
                userinfoFirst: userinfo,
                name: userinfo.name,
                givenName: userinfo.given_name,
              },
            });
            await initializeNewUser(ctx.db, user);
          }
        }

        const isNewUser = !user;
        if (user) {
          if (user.disabledAt) {
            captureMessage('Disabled user tried to log in', {
              extra: { userId: user.id },
            });
            return {
              viewer: {},
              error: permissionError(
                'This account has been disabled, please contact your team admin for more information.'
              ),
            };
          }
          await ctx.db.user.update({
            data: {
              userinfoLatest: userinfo,
              name: userinfo.name,
              givenName: userinfo.given_name,
            },
            where: { id: user.id },
          });
        } else {
          const googleDomain = userinfo.hd;
          const organization = await getOrganization(
            googleId,
            googleDomain,
            ctx
          );

          user = await ctx.db.user.create({
            data: userCreateData(userinfo, organization),
          });
          await initializeNewUser(ctx.db, user);
        }

        const promises: Promise<unknown>[] = [
          regenerateSession(ctx, AuthTypeEnum.user, user.id),
          isNewUser ? queueNewUser(user.id) : Promise.resolve(),
          queueLogin(user.id),
        ];
        await Promise.all(promises);

        return { viewer: {} };
      },
    });

    t.field('loginAs', {
      type: 'ViewerOutput',
      args: {
        sessionId: stringArg(),
      },
      async resolve(_root, { sessionId }, ctx) {
        // We throw lots of errors here instead of returning them because any
        // misuse is bad and should alert us.

        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError(), viewer: {} };
        }

        let originalUser;
        if (ctx.session.authType === AuthTypeEnum.loginAs) {
          if (!ctx.session.originalUserId) {
            throw new Error('Expected originalUserId on loginAs session');
          }
          originalUser = await ctx.db.user.findUnique({
            where: { id: ctx.session.originalUserId },
          });
          if (!originalUser) {
            throw new Error(
              `Missing originalUser ${ctx.session.originalUserId}`
            );
          }
        } else {
          originalUser = user;
        }
        if (!originalUser.email?.endsWith('@kenchi.com')) {
          throw new Error(
            `loginAs attempt from ${originalUser.id}, ${originalUser.email}`
          );
        }

        if (sessionId) {
          const authSession = await ctx.db.authSession.findUnique({
            where: { id: sessionId },
          });
          if (!authSession) {
            throw new Error(`Invalid auth session ${sessionId}`);
          }

          const authSessionData = authSession.data as Prisma.JsonObject;
          if (originalUser.id !== authSessionData.originalUserId) {
            throw new Error(
              `user ${originalUser.id} trying to claim loginAs for ${authSessionData.originalUserId}`
            );
          }
          if (authSessionData.claimed) {
            throw new Error(
              `user ${originalUser.id} trying to re-claim loginAs session ${authSessionData.id}`
            );
          }

          await ctx.db.authSession.update({
            data: { data: { ...authSessionData, claimed: true } },
            where: { id: authSession.id },
          });

          const req: Express.Request = (ctx as any).__rawRequestForAuthOnly;
          req.sessionID = authSession.secret;
          // We need to cause the session to want to re-save to set a new cookie
          req.session.dirty = Math.random();
        } else {
          // Return to originalUserId
          await regenerateSession(ctx, AuthTypeEnum.user, originalUser.id);
        }

        return { viewer: {} };
      },
    });

    t.field('logout', {
      type: 'ViewerOutput',
      async resolve(_root, {}, ctx) {
        await destroySession(ctx);
        return { viewer: {} };
      },
    });
  },
});

export const viewer = extendType({
  type: 'Query',
  definition(t) {
    t.field('viewer', {
      type: 'Viewer',
      resolve(_root, {}, _ctx) {
        return {};
      },
    });
  },
});

async function regenerateSession(
  ctx: NexusContext,
  authType: AuthTypeEnum,
  userId?: number
) {
  await new Promise<void>((resolve, reject) => {
    ctx.session.regenerate((e) => {
      e ? reject(e) : resolve();
    });
  });
  ctx.session = (ctx as any).__rawRequestForAuthOnly.session;
  ctx.session.authType = authType;
  ctx.session.userId = userId;
  await generateViewerContext(ctx);
}

function destroySession(ctx: NexusContext) {
  return new Promise<void>((resolve, reject) => {
    ctx.session.destroy((e) => {
      e ? reject(e) : resolve();
    });
  });
}

async function initializeNewUser(
  db: PrismaClient,
  user: User,
  privateCollection?: Collection | null
) {
  if (!privateCollection) {
    privateCollection = await db.collection.create({
      data: {
        organizationId: user.organizationId,
        name: 'Private',
        icon: '🔒',
        description: '',
        acl: {
          create: {
            userId: user.id,
            permissions: ['admin'],
          },
        },
      },
    });
  }

  const tool = await db.tool.create({
    data: {
      ...versionedNodeBaseData('tool', privateCollection, user),
      name: "Example: Can't find account",
      component: 'GmailAction',
      description: '',
      inputs: BASIC_TOOL_INPUTS,
      configuration: BASIC_TOOL_CONFIGURATION,
      keywords: ['First snippet'],
    },
  });
  await db.workflow.create({
    data: {
      ...versionedNodeBaseData('wrkf', privateCollection, user),
      name: 'Getting started with Kenchi',
      icon: '👋',
      contents: getBasicWorkflow(tool.staticId),
      description: 'New to Kenchi? Yay! Read this guide for our top tips.',
    },
  });
}

const BASIC_TOOL_INPUTS = [
  {
    source: 'page',
    id: 'recipientFirstName',
    placeholder: 'Recipient first name',
  },
  { source: 'page', id: 'authorFirstName', placeholder: 'Author first name' },
  { source: 'page', id: 'recipientEmail', placeholder: 'Recipient email' },
];

const BASIC_TOOL_CONFIGURATION = {
  walkthroughTag: true,
  data: {
    slate: true,
    singleLine: false,
    rich: true,
    children: [
      {
        children: [
          { text: 'Hi ' },
          {
            type: 'variable',
            id: 'recipientFirstName',
            placeholder: 'Recipient first name',
            source: 'page',
            children: [{ text: '' }],
          },
          { text: ',' },
        ],
      },
      { children: [{ text: '' }] },
      {
        children: [
          {
            text: "Sorry for the trouble! I tried looking up your account, but can't find one under the email you're writing in from (",
          },
          {
            type: 'variable',
            id: 'recipientEmail',
            placeholder: 'Recipient email',
            source: 'page',
            children: [{ text: '' }],
          },
          { text: ').' },
        ],
      },
      { children: [{ text: '' }] },
      {
        children: [
          {
            text: "Could you confirm which email you're using to log in? Once I have that, we'll get this sorted out!",
          },
        ],
      },
      { children: [{ text: '' }] },
      { children: [{ text: 'Best, ' }] },
      {
        children: [
          { text: '' },
          {
            type: 'variable',
            id: 'authorFirstName',
            placeholder: 'Author first name',
            source: 'page',
            children: [{ text: '' }],
          },
          { text: '' },
        ],
      },
    ],
  },
};

const getBasicWorkflow = (firstAutomationId: string) => {
  return [
    { type: 'heading', children: [{ text: 'The basics' }] },
    {
      type: 'paragraph',
      children: [{ text: 'Kenchi is made up of two key ideas:' }],
    },
    {
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                { text: 'Playbooks', bold: true },
                {
                  text: ": what you're reading now! Playbooks are always-available documentation: you can jot down common tips, debugging tips, company processes, and anything else you need handy.",
                },
              ],
            },
          ],
        },
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                { text: 'Snippets', bold: true },
                {
                  text: ', which can type text, apply tags, open pages, and more. And yep, you can include snippets right in your playbooks! Check it out:',
                },
              ],
            },
            {
              type: 'void-wrapper',
              children: [
                { type: 'void-spacer', children: [{ text: '' }] },
                {
                  type: 'tool',
                  tool: firstAutomationId,
                  children: [{ text: '' }],
                },
                { type: 'void-spacer', children: [{ text: '' }] },
              ],
            },
          ],
        },
      ],
    },
    { type: 'heading', children: [{ text: 'Shortcuts' }] },
    {
      type: 'paragraph',
      children: [
        { text: '' },
        {
          type: 'link',
          children: [
            { text: 'Check out our quick video tutorial on shortcuts' },
          ],
          url: 'https://www.loom.com/share/78ea2df2a09c4ccf8f3770cd8f94e9de',
        },
        { text: '. The top shortcuts are:' },
      ],
    },
    {
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                { bold: true, text: 'ctrl+space ' },
                { text: 'to activate Kenchi' },
              ],
            },
          ],
        },
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                { bold: true, text: 'Enter ' },
                { text: 'to open a Playbook or quickly run a Snippet.' },
              ],
            },
          ],
        },
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  text: '⬆️ and ⬇️ arrows to select the next or previous item',
                },
              ],
            },
          ],
        },
        {
          type: 'list-item',
          children: [
            {
              type: 'paragraph',
              children: [
                { bold: true, text: '? ' },
                { text: 'for our shortcut cheat sheet' },
              ],
            },
          ],
        },
      ],
    },
    { type: 'heading', children: [{ text: 'Custom shortcuts' }] },
    {
      type: 'paragraph',
      children: [
        {
          text: 'You can assign a key combo to anything in Kenchi. So, instead of searching for "needs email", just type "ne" and it\'s ⚡️ instantly there!',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        { text: "Here's a " },
        {
          type: 'link',
          children: [{ text: 'walkthrough to get started' }],
          url: 'https://www.loom.com/share/6cf27b87a995470d9a987b3b407b829a',
        },
        { text: ':' },
      ],
    },
    {
      type: 'void-wrapper',
      children: [
        { type: 'void-spacer', children: [{ text: '' }] },
        {
          type: 'image',
          url: 'https://kenchi-files.s3.us-west-1.amazonaws.com/5/bkdhfJHvOB6VUqiXpV6RIQ%3D%3D/gif-shortcuts.mov.gif',
          children: [{ text: '' }],
          href: 'https://www.loom.com/share/6cf27b87a995470d9a987b3b407b829a',
        },
        { type: 'void-spacer', children: [{ text: '' }] },
      ],
    },
    { type: 'heading', children: [{ text: 'Help & feedback' }] },
    {
      type: 'paragraph',
      children: [
        {
          text: 'You can get ahold of us any time with the feedback bar the bottom of this page, or by emailing ',
        },
        {
          type: 'link',
          children: [{ text: 'support@kenchi.com' }],
          url: 'mailto:support@kenchi.com',
        },
        { text: '.' },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: "We're a small team and we really care that Kenchi is making a difference in your day, so if there's anything we can do better we'd love to hear from you!",
        },
      ],
    },
    {
      type: 'void-wrapper',
      children: [
        { type: 'void-spacer', children: [{ text: '' }] },
        {
          type: 'image',
          url: 'https://kenchi-files.s3.us-west-1.amazonaws.com/5//Q5Q%2BjJWFtRdNxBSXrfOCQ%3D%3D/hi-from-kenchi.gif',
          children: [{ text: '' }],
        },
        { type: 'void-spacer', children: [{ text: '' }] },
      ],
    },
    { type: 'paragraph', children: [{ text: '— Team Kenchi' }] },
    { type: 'paragraph', children: [{ text: '' }] },
  ];
};
