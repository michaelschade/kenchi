import * as Sentry from '@sentry/node';
import cryptoRandomString from 'crypto-random-string';
import { Request } from 'express';
import fs from 'fs';
import { DateTime } from 'luxon';
import path from 'path';
import {
  BranchTypeEnum,
  Collection,
  PrismaClient,
  Tool,
  User,
} from 'prisma-client';

import { visibleCollectionsQuery } from './graphql/Collection';
import { SpaceModel, ToolModel, WidgetModel, WorkflowModel } from './models';

const ENV_KEYS = [
  'ALGOLIA_APP_ID',
  'ALGOLIA_INDEX_APIKEY',
  'ALGOLIA_SEARCH_APIKEY',
  'ALGOLIA_SEARCH_INDEX_NAME',
  'APP_ENV',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'REDIS_HOST',
  'REDIS_PORT',
  'DATABASE_URL',
  'POSTMARK_API_KEY',
  'CUSTOMERIO_TRACKING_SITE_ID',
  'CUSTOMERIO_TRACKING_API_KEY',
  'CUSTOMERIO_APP_API_KEY',
  'SESSION_KEY',
  'INTERCOM_CLIENT_ID',
  'INTERCOM_CLIENT_SECRET',
];
const DEV_ENV_KEYS = ['DEV_ADMIN_EMAIL'];

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ALGOLIA_APP_ID: string;
      ALGOLIA_INDEX_APIKEY: string;
      ALGOLIA_SEARCH_APIKEY: string;
      ALGOLIA_SEARCH_INDEX_NAME: string;
      ALGOLIA_ENABLE_IN_DEVELOPMENT: string;
      APP_ENV: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      DATABASE_URL: string;
      INSIGHTS_DATABASE_URL?: string;
      POSTMARK_API_KEY: string;
      CUSTOMERIO_TRACKING_SITE_ID: string;
      CUSTOMERIO_TRACKING_API_KEY: string;
      CUSTOMERIO_APP_API_KEY: string;
      SESSION_KEY: string;
      INTERCOM_CLIENT_ID: string;
      INTERCOM_CLIENT_SECRET: string;

      // Present only in dev
      DEV_ADMIN_EMAIL?: string;
    }
  }
}

// Returns time in ms
export function hrTimeDiff(
  startTime: [number, number],
  endTime?: [number, number]
) {
  if (!endTime) {
    endTime = process.hrtime();
  }
  return Math.round(
    (endTime[0] - startTime[0]) * 1e3 + (endTime[1] - startTime[1]) * 1e-6
  );
}

export function validateEnv() {
  if (isTesting()) {
    return;
  }
  const keys = [...ENV_KEYS];
  if (isDevelopment()) {
    keys.push(...DEV_ENV_KEYS);
  }
  keys.forEach((key) => {
    if (!(key in process.env)) {
      console.warn(
        `Missing expected env var: ${key}, maybe copy the value from sample.env to .env`
      );
    }
  });
}

export function isProduction() {
  return process.env.APP_ENV === 'production';
}

export function isDevelopment() {
  return process.env.APP_ENV === 'development';
}

export function isTesting() {
  return process.env.APP_ENV === 'testing';
}

export function isAdmin() {
  return process.env.ADMIN === 'true';
}

export function requireAdmin() {
  if (!isAdmin()) {
    Sentry.captureMessage('Unexpected access from non-admin env');
    throw new Error('Unexpected access from non-admin env');
  }
}

export function getAdminEmail(ctx: NexusContext) {
  requireAdmin();

  const req: Request = (ctx as any).__rawRequestForAuthOnly;
  const email = req.header('X-Vouch-User');
  if (email) {
    return email;
  }

  if (isDevelopment()) {
    const email = process.env.DEV_ADMIN_EMAIL;
    if (email) {
      return email;
    }
    throw new Error(
      'Missing admin user: did you forget to set DEV_ADMIN_EMAIL in your .env?'
    );
  }

  Sentry.captureMessage('Unauthenticated admin user');
  throw new Error('Unauthenticated admin user');
}

export function initSentry(nodeOptions: Sentry.NodeOptions = {}) {
  if (!isDevelopment() && !isTesting()) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.APP_ENV,
      release: process.env.SENTRY_VERSION,
      ...nodeOptions,
    });
  }
}

type TopArgs = {
  ctx: NexusContext;
  user: User;
  limit?: number;
  daysAgo?: number;
};

export async function topViewedWorkflowStaticIds({
  ctx,
  user,
  limit = 5,
  daysAgo = 7,
}: TopArgs) {
  const filterAfter = DateTime.now().minus({ days: daysAgo }).toJSDate();
  const top = await ctx.db.userWorkflowView.groupBy({
    where: {
      userId: user.id,
      viewedAt: { gt: filterAfter },
      staticId: { notIn: ['__generated__', 'new'] },
    },
    by: ['staticId'],
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
  return top.map((r) => r.staticId);
}

export async function topUsedToolStaticIds({
  ctx,
  user,
  limit = 5,
  daysAgo = 7,
  filterToolIds,
}: TopArgs & { filterToolIds?: string[] }) {
  if (filterToolIds?.length === 0) {
    return [];
  }
  const filterAfter = DateTime.now().minus({ days: daysAgo }).toJSDate();
  const top = await ctx.db.userToolRun.groupBy({
    where: {
      userId: user.id,
      runAt: { gt: filterAfter },
      staticId: filterToolIds
        ? { in: filterToolIds }
        : { notIn: ['__generated__', 'new'] },
    },
    by: ['staticId'],
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
  return top.map((r) => r.staticId);
}

export async function topUsedTools({
  ctx,
  user,
  limit = 5,
  daysAgo = 7,
  filterToolIds,
}: TopArgs & { filterToolIds?: string[] }) {
  if (filterToolIds?.length === 0) {
    return [];
  }
  const topUsed = await topUsedToolStaticIds({
    ctx,
    user,
    limit,
    daysAgo,
    filterToolIds,
  });

  const tools = await ToolModel.findMany(ctx, {
    where: {
      staticId: { in: topUsed },
      branchType: BranchTypeEnum.published,
      isLatest: true,
      isArchived: false,
      collection: visibleCollectionsQuery(user),
    },
  });
  const toolsByStaticId: Record<string, Tool> = {};
  tools.forEach((t) => (toolsByStaticId[t.staticId] = t));

  return topUsed
    .map((staticId) => toolsByStaticId[staticId])
    .filter((t) => !!t);
}

export async function getVersionedNode(
  ctx: NexusContext,
  staticOrBranchId: string
) {
  const prefix = staticOrBranchId.split('_')[0];

  // Models do the permission checks for us
  const objPromise = [ToolModel, WorkflowModel, SpaceModel, WidgetModel]
    .map((model) => {
      if (model.staticIdPrefix === prefix) {
        return model.findFirst(ctx, {
          where: {
            staticId: staticOrBranchId,
            branchType: BranchTypeEnum.published,
            isLatest: true,
          },
        });
      } else if (model.branchIdPrefix === prefix) {
        return model.findFirst(ctx, {
          where: {
            branchId: staticOrBranchId,
            isLatest: true,
          },
        });
      }
      return null;
    })
    .find(Boolean);

  if (!objPromise) {
    Sentry.captureMessage('Invalid ID for getVersionedNode', {
      extra: { staticOrBranchId },
    });
    return null;
  }

  return objPromise;
}

// Use 0 as version since I'm guessing we'll change this
// 9 chars of base 62 gives us 1.3537087e+16 possibilities
const ALPHANUMERIC_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateStaticId = (prefix: string) =>
  `${prefix}_0${cryptoRandomString({
    length: 9,
    characters: ALPHANUMERIC_CHARACTERS,
  })}`;

export const idResolver = (prefix: string) => ({
  resolve: (obj: { id: number }) => encodeId(prefix, obj.id),
});

export const encodeId = (prefix: string, id: number) => {
  // Add a bunch of digits so the IDs aren't too short.
  return prefix + '_n' + encode(id * 100000);
};

export const decodeId = (id: string): [string, number] => {
  const [prefix, encoded] = id.split('_');
  return [prefix, decode(encoded.substr(1)) / 100000];
};

// DO NOT CHANGE THIS
const CHARSET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function encode(int: number) {
  if (int === 0) {
    return CHARSET[0];
  }

  let res = '';
  while (int > 0) {
    res = CHARSET[int % 62] + res;
    int = Math.floor(int / 62);
  }
  return res;
}

function decode(str: string) {
  const length = str.length;
  let res = 0,
    i,
    char;
  for (i = 0; i < length; i++) {
    char = str.charCodeAt(i);
    if (char < 58) {
      // 0-9
      char = char - 48;
    } else if (char < 91) {
      // A-Z
      char = char - 29;
    } else {
      // a-z
      char = char - 87;
    }
    res += char * Math.pow(62, length - i - 1);
  }
  return res;
}

type ConnectionArgs = {
  after?: string | null | undefined;
  first: number;
};
type WithoutConnectionArgs<T> = Pick<T, Exclude<keyof T, keyof ConnectionArgs>>;

const withoutConnectionArgs = <T extends ConnectionArgs>(
  args: T
): WithoutConnectionArgs<T> => {
  const { after, first, ...rest } = args;
  return rest;
};

const cursorify = (id: string | number) => {
  if (typeof id === 'string') {
    const idPart = id.split('_')[1];
    return `cursor_${idPart}`;
  } else {
    return encodeId('cursor', id);
  }
};

type FindManyArgs<T extends number | string> = {
  take: number;
  skip?: number;
  cursor?: {
    id: T;
  };
};

export const resolveConnectionWithExtra =
  <TParent, TArgs, TReturn extends Record<string, unknown>>(
    resolveConnection: (
      parent: TParent,
      args: TArgs,
      ctx: NexusContext
    ) => Promise<Pick<TReturn, 'edges' | 'pageInfo'>>,
    resolveExtra: (
      parent: TParent,
      args: TArgs,
      ctx: NexusContext
    ) => {
      [key in Exclude<keyof TReturn, 'edges' | 'pageInfo'>]: () => TReturn[key];
    }
  ) =>
  async (parent: TParent, args: TArgs, ctx: NexusContext): Promise<TReturn> => {
    const extra = resolveExtra(parent, args, ctx);
    const connection = await resolveConnection(parent, args, ctx);
    // UGH! We know this works but TS generics are being mean
    return { ...connection, ...extra } as any;
  };

export const resolveMaybeNull =
  <TParent, TArgs, TReturn>(
    isNull: (parent: TParent) => boolean,
    nonNullResolve: (parent: TParent, args: TArgs, ctx: NexusContext) => TReturn
  ) =>
  (parent: TParent, args: TArgs, ctx: NexusContext) => {
    if (isNull(parent)) {
      return null;
    } else {
      return nonNullResolve(parent, args, ctx);
    }
  };

type FindManyFunction<
  TParent,
  TIDType extends string | number,
  TArgs extends ConnectionArgs,
  TReturn
> = (
  parent: TParent,
  findManyArgs: FindManyArgs<TIDType>,
  ctx: NexusContext,
  remainingArgs: WithoutConnectionArgs<TArgs>
) => Promise<TReturn>;

export const resolveConnectionFromFindManyStringId =
  <TModel extends { id: string }, TParent, TArgs extends ConnectionArgs>(
    findMany: FindManyFunction<TParent, string, TArgs, TModel[]>
  ) =>
  async (parent: TParent, args: TArgs, ctx: NexusContext) => {
    const nodes = await callFindMany((id) => id, findMany, parent, args, ctx);
    return renderConnection(
      nodes.map((node) => ({ node })),
      args
    );
  };

export const resolveConnectionFromFindMany =
  <TModel extends { id: number }, TParent, TArgs extends ConnectionArgs>(
    findMany: FindManyFunction<TParent, number, TArgs, TModel[]>
  ) =>
  async (parent: TParent, args: TArgs, ctx: NexusContext) => {
    const nodes = await callFindMany(
      (id) => decodeId(id)[1],
      findMany,
      parent,
      args,
      ctx
    );
    return renderConnection(
      nodes.map((node) => ({ node })),
      args
    );
  };

export const resolveConnectionFromFindManyWithExtendedEdge =
  <TModel extends { id: number }, TParent, TArgs extends ConnectionArgs>(
    findMany: FindManyFunction<TParent, number, TArgs, { node: TModel }[]>
  ) =>
  async (parent: TParent, args: TArgs, ctx: NexusContext) => {
    const edges = await callFindMany(
      (id) => decodeId(id)[1],
      findMany,
      parent,
      args,
      ctx
    );
    return renderConnection(edges, args);
  };

export const resolveConnectionFromFindManyNullable =
  <TModel extends { id: number }, TParent, TArgs extends ConnectionArgs>(
    findMany: FindManyFunction<TParent, number, TArgs, TModel[] | null>
  ) =>
  async (parent: TParent, args: TArgs, ctx: NexusContext) => {
    const nodes = await callFindMany(
      (id) => decodeId(id)[1],
      findMany,
      parent,
      args,
      ctx
    );
    if (!nodes) {
      return null;
    }
    return renderConnection(
      nodes.map((node) => ({ node })),
      args
    );
  };

// Execute the underlying findMany operation
const callFindMany = async <
  TIDType extends string | number,
  TParent,
  TArgs extends ConnectionArgs,
  TReturn
>(
  cursor: (cursor: string) => TIDType,
  findMany: FindManyFunction<TParent, TIDType, TArgs, TReturn>,
  parent: TParent,
  args: TArgs,
  ctx: NexusContext
) => {
  const findManyArgs: FindManyArgs<TIDType> = {
    take: args.first + 1,
  };

  if (args.after) {
    findManyArgs.skip = 1;
    findManyArgs.cursor = { id: cursor(args.after) };
  }

  // Execute the underlying findMany operation
  return findMany(parent, findManyArgs, ctx, withoutConnectionArgs(args));
};

export const renderConnection = <
  TModel extends { id: string | number },
  TArgs extends ConnectionArgs
>(
  edges: (Record<string, unknown> & { node: TModel })[],
  args: TArgs
) => {
  // Check if we actually got an additional node. This would indicate we have
  // a prev/next page
  const hasExtraNode = edges.length > args.first;

  // Remove the extra node from the results
  if (hasExtraNode) {
    edges.pop();
  }

  // Get the start and end cursors
  let startCursor: string | undefined = undefined;
  let endCursor: string | undefined = undefined;
  if (edges.length > 0) {
    startCursor = cursorify(edges[0].node.id);
    endCursor = cursorify(edges[edges.length - 1].node.id);
  }

  // If paginating forward:
  // - For the next page, see if we had an extra node in the result set
  // - For the previous page, see if we are "after" another node (so there has
  //   to be more before this)
  // If paginating backwards:
  // - For the next page, see if we are "before" another node (so there has to be
  //   more after this)
  // - For the previous page, see if we had an extra node in the result set
  const hasNextPage = hasExtraNode;
  const hasPreviousPage = !!args.after;

  return {
    pageInfo: {
      startCursor,
      endCursor,
      hasNextPage,
      hasPreviousPage,
    },
    edges: edges.map((edge) => ({ cursor: cursorify(edge.node.id), ...edge })),
  };
};

export const stripNullOrUndefined = <T extends Record<string, any>>(obj: T) => {
  const rtn: { [K in keyof T]?: NonNullable<T[K]> } = {};

  let field: keyof T;
  for (field in obj) {
    const value = obj[field];
    if (value === undefined || value === null) {
      continue;
    }
    rtn[field] = value;
  }
  return rtn;
};

export const getMigrationStatus = async (
  db: PrismaClient
): Promise<{ name: string; runOn: Date | null }[]> => {
  const runOnMap: Record<string, Date> = {};
  (await db.databaseMigration.findMany()).forEach(
    (row) => (runOnMap[row.name] = row.runOn)
  );
  const relativePath = isDevelopment() ? '../migrations' : '../../migrations';
  const files = fs.readdirSync(path.join(__dirname, relativePath));
  const names = files
    .filter((f) => f.match(/^\d{17}_/))
    .sort()
    .reverse()
    .map((f) => f.split('.')[0]);
  return names.map((name) => ({ name, runOn: runOnMap[name] || null }));
};

export const versionedNodeBaseData = (
  prefix: 'wrkf' | 'tool',
  collection: Collection,
  user: User
) => {
  return {
    branchType: BranchTypeEnum.published,
    staticId: generateStaticId(prefix),
    isLatest: true,
    collectionId: collection.id,
    createdByUserId: user.id,
  };
};

export function filterNullOrUndefined<T>(
  v: T
): v is Exclude<T, null | undefined> {
  return v !== null && v !== undefined;
}

export const validJsDate = (
  dateString: string | null | undefined,
  defaultDate: DateTime
): Date => {
  const dateAsDateTime = dateString
    ? DateTime.fromFormat(dateString, 'yyyy-MM-dd')
    : defaultDate;
  if (!dateAsDateTime.isValid) {
    throw new Error('Invalid date');
  }
  return dateAsDateTime.toJSDate();
};
