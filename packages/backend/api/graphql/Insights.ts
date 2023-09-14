import partition from 'lodash/partition';
import uniq from 'lodash/uniq';
import { DateTime } from 'luxon';
import {
  arg,
  enumType,
  extendType,
  idArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';
import { SourceValue } from 'nexus/dist/typegenTypeHelpers';
import type { NexusGenEnums } from 'nexus-typegen';
import { BranchTypeEnum, Prisma, PrismaClient, User } from 'prisma-client';

import Result, { failure, isFailure, success } from '@kenchi/shared/lib/Result';

import {
  loggedInUserAndOrg,
  userHasCollectionPermission,
} from '../auth/permissions';
import { getInsightsDB } from '../db';
import { ToolModel } from '../models';
import { decodeId, encodeId } from '../utils';
import {
  invalidValueError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

export const InsightsOutput = objectType({
  name: 'InsightsOutput',
  definition(t) {
    t.nullable.field('data', { type: 'Json' });
    t.nullable.field('latestData', { type: 'DateTime' });
    t.nullable.field('error', { type: 'KenchiError' });
  },
});

export const InsightsTypeEnum = enumType({
  name: 'InsightsTypeEnum',
  members: ['workflowUsage', 'toolUsage', 'ratings', 'ratingsDetails'], // ratingsDetails is deprecated
});

export const InsightsObjectGroupingEnum = enumType({
  name: 'InsightsObjectGroupingEnum',
  members: ['collectionId', 'staticId'],
});

const TIMEZONE = 'America/Los_Angeles';
const TZ_CONVERT = Prisma.sql`::timestamptz AT TIME ZONE ${TIMEZONE}`;

const parseDateToSQL = (
  paramName: string,
  valStr: string | null | undefined,
  defaultVal: () => DateTime
): Result<Prisma.Sql, SourceValue<'KenchiError'>> => {
  let valDate: DateTime;
  if (valStr) {
    valDate = DateTime.fromFormat(valStr, 'yyyy-MM-dd');
    if (!valDate.isValid) {
      return failure(
        invalidValueError('Invalid date format, expected yyyy-MM-dd', paramName)
      );
    }
  } else {
    valDate = defaultVal();
  }
  const valSQL = Prisma.raw(`'${valDate.toISO()}'::timestamptz`);
  return success(valSQL);
};

const collectionIdsFromStaticIds = async (
  ctx: NexusContext,
  staticIds: string[]
): Promise<number[]> => {
  const [toolStaticIds, workflowStaticIds] = partition(staticIds, (id) =>
    id.startsWith(ToolModel.staticIdPrefix)
  );
  const toolsAndWorkflows = (
    await Promise.all([
      ctx.db.tool.findMany({
        select: { collectionId: true },
        where: {
          isLatest: true,
          branchType: BranchTypeEnum.published,
          staticId: { in: toolStaticIds },
        },
      }),
      ctx.db.workflow.findMany({
        select: { collectionId: true },
        where: {
          isLatest: true,
          branchType: BranchTypeEnum.published,
          staticId: { in: workflowStaticIds },
        },
      }),
    ])
  ).flat();
  return uniq(toolsAndWorkflows.map((row) => row.collectionId));
};

const verifyPermissions = async (
  ctx: NexusContext,
  type: typeof InsightsTypeEnum.value.members,
  collectionIds?: string[] | null,
  staticIds?: string[] | null
): Promise<Result<User, SourceValue<'KenchiError'>>> => {
  const { user } = loggedInUserAndOrg(ctx);
  if (!user) {
    return failure(unauthenticatedError());
  }

  if (!collectionIds === !staticIds) {
    return failure(
      invalidValueError(
        'Exactly one of collectionIds or staticIds must be provided',
        'collectionIds'
      )
    );
  }

  let collectionIdNums: number[];
  if (collectionIds) {
    collectionIdNums = collectionIds.map((id) => decodeId(id)[1]);
  } else {
    collectionIdNums = await collectionIdsFromStaticIds(ctx, staticIds!);
  }

  const permCheckPromises = collectionIdNums.map((id) =>
    userHasCollectionPermission(user, id, 'see_collection')
  );
  const permChecks = await Promise.all(permCheckPromises);
  if (permChecks.some((success) => !success)) {
    // TODO: customize error with IDs in failedChecks
    return failure(permissionError());
  }

  return success(user);
};

export const InsightsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('insights', {
      type: 'InsightsOutput',
      args: {
        collectionIds: list(nonNull(idArg())),
        staticIds: list(nonNull(idArg())),
        type: nonNull(arg({ type: 'InsightsTypeEnum' })),
        objectGrouping: arg({ type: 'InsightsObjectGroupingEnum' }),
        startDate: stringArg(),
        endDate: stringArg(),
      },
      async resolve(
        _root,
        { collectionIds, staticIds, type, objectGrouping, startDate, endDate },
        ctx
      ) {
        const permChecks = await verifyPermissions(
          ctx,
          type,
          collectionIds,
          staticIds
        );
        if (isFailure(permChecks)) {
          return { error: permChecks.error };
        }
        const user = permChecks.data;
        const organizationId = user.organizationId!;

        const startDateParsed = parseDateToSQL('startDate', startDate, () =>
          // Old default is 8 weeks of data starting from the beginning of the
          // week (Monday) 7 weeks ago.
          DateTime.now().setZone(TIMEZONE).startOf('week').minus({ weeks: 7 })
        );
        if (isFailure(startDateParsed)) {
          return { error: startDateParsed.error };
        }
        const startDateSQL = startDateParsed.data;

        const endDateParsed = parseDateToSQL('endDate', endDate, () =>
          DateTime.now()
        );
        if (isFailure(endDateParsed)) {
          return { error: endDateParsed.error };
        }
        const endDateSQL = endDateParsed.data;

        objectGrouping ??= 'collectionId';

        const eligibleActivitiesSQL = eligibleActivityFilter(
          collectionIds,
          staticIds
        );

        const db = getInsightsDB();
        switch (type) {
          case 'toolUsage':
            return getKenchiUsage(
              'tool',
              db,
              objectGrouping,
              eligibleActivitiesSQL,
              startDateSQL,
              endDateSQL
            );
          case 'workflowUsage':
            return getKenchiUsage(
              'workflow',
              db,
              objectGrouping,
              eligibleActivitiesSQL,
              startDateSQL,
              endDateSQL
            );
          case 'ratings':
            return getRatings(
              db,
              organizationId,
              objectGrouping,
              eligibleActivitiesSQL,
              startDateSQL,
              endDateSQL
            );
          case 'ratingsDetails':
            // Deprecated: switch to insightsRatingDetails
            return getRatingsDetails(
              db,
              organizationId,
              eligibleActivitiesSQL,
              startDateSQL,
              endDateSQL
            );
        }
      },
    });

    t.field('insightsRatingDetails', {
      type: 'InsightsOutput',
      args: {
        collectionIds: list(nonNull(idArg())),
        staticIds: list(nonNull(idArg())),
        startDate: stringArg(),
        endDate: stringArg(),
      },
      async resolve(
        _root,
        { collectionIds, staticIds, startDate, endDate },
        ctx
      ) {
        const permChecks = await verifyPermissions(
          ctx,
          'ratingsDetails',
          collectionIds,
          staticIds
        );
        if (isFailure(permChecks)) {
          return { error: permChecks.error };
        }
        const user = permChecks.data;
        const organizationId = user.organizationId!;

        const startDateParsed = parseDateToSQL('startDate', startDate, () =>
          // Old default is 8 weeks of data starting from the beginning of the
          // week (Monday) 7 weeks ago.
          DateTime.now().setZone(TIMEZONE).startOf('week').minus({ weeks: 7 })
        );
        if (isFailure(startDateParsed)) {
          return { error: startDateParsed.error };
        }
        const startDateSQL = startDateParsed.data;

        const endDateParsed = parseDateToSQL('endDate', endDate, () =>
          DateTime.now()
        );
        if (isFailure(endDateParsed)) {
          return { error: endDateParsed.error };
        }
        const endDateSQL = endDateParsed.data;

        const eligibleActivitiesSQL = eligibleActivityFilter(
          collectionIds,
          staticIds
        );

        return getRatingsDetails(
          getInsightsDB(),
          organizationId,
          eligibleActivitiesSQL,
          startDateSQL,
          endDateSQL
        );
      },
    });
  },
});

async function getKenchiUsage(
  type: 'tool' | 'workflow',
  db: PrismaClient,
  objectGrouping: NexusGenEnums['InsightsObjectGroupingEnum'],
  eligibleActivitiesSQL: Prisma.Sql,
  startDateSQL: Prisma.Sql,
  endDateSQL: Prisma.Sql
) {
  let activityTable, timestampColumn, objectTable;
  if (type === 'tool') {
    activityTable = Prisma.raw('user_tool_runs');
    timestampColumn = Prisma.raw('run_at');
    objectTable = Prisma.raw('tools');
  } else if (type === 'workflow') {
    activityTable = Prisma.raw('user_workflow_views');
    timestampColumn = Prisma.raw('viewed_at');
    objectTable = Prisma.raw('workflows');
  } else {
    throw new Error(`Invalid type ${type}`);
  }

  const groupingSQL = Prisma.raw(
    objectGrouping === 'collectionId'
      ? 'object.collection_id'
      : 'object.static_id'
  );

  const [rawData, rawLatestData] = await Promise.all([
    db.$queryRaw<
      {
        grouping: number; // Technically this is number or string depending on grouping
        day: string;
        count: number;
        latest: string;
      }[]
    >`
      SELECT
        ${groupingSQL} as grouping,
        DATE_TRUNC('day', activity.${timestampColumn}${TZ_CONVERT})::date AS day,
        COUNT(activity.id) AS count,
        MAX(activity.${timestampColumn})${TZ_CONVERT} AS latest
      FROM
        ${activityTable} activity,
        ${objectTable} object
      WHERE
        activity.${timestampColumn} >= ${startDateSQL} AND
        activity.${timestampColumn} < ${endDateSQL} AND
        ${eligibleActivitiesSQL}
      GROUP BY 1, 2
      ORDER BY 1, 2 ASC
    `,
    db.$queryRaw<{ latest: string }[]>`
      SELECT MAX(activity.${timestampColumn})${TZ_CONVERT} AS latest
      FROM
        ${activityTable} activity,
        ${objectTable} object
      WHERE
        ${eligibleActivitiesSQL}
    `,
  ]);
  return {
    data: encodeGrouping(rawData, objectGrouping),
    latestData: rawLatestData[0].latest,
  };
}

function encodeGrouping(
  rawData: { grouping: number; [key: string]: unknown }[],
  objectGrouping: NexusGenEnums['InsightsObjectGroupingEnum']
) {
  return rawData.map(({ grouping, ...row }) => {
    if (objectGrouping === 'collectionId') {
      return {
        collectionId: encodeId('coll', grouping), // Deprecated field, remove after frontends are upgraded
        grouping: encodeId('coll', grouping),
        ...row,
      };
    } else {
      return { grouping, ...row };
    }
  });
}

async function getLatestInsightsData(db: PrismaClient, organizationId: number) {
  const latest = await db.$queryRaw<{ latest: string }[]>`
    SELECT MAX(ic.rated_at)${TZ_CONVERT} AS latest
    FROM insights_conversations ic
    WHERE ic.organization_id = ${organizationId}
  `;
  return latest[0].latest;
}

function eligibleActivityFilter(
  collectionIds?: string[] | null,
  staticIds?: string[] | null
) {
  if (collectionIds && staticIds) {
    throw new Error('Both collectionIds and staticIds are provided');
  } else if (collectionIds) {
    return Prisma.sql`
      activity.static_id = object.static_id AND
      object.is_latest AND
      object.branch_type = ${BranchTypeEnum.published} AND
      object.collection_id IN (${Prisma.join(
        collectionIds.map((id) => decodeId(id)[1])
      )})
    `;
  } else if (staticIds) {
    return Prisma.sql`
      activity.static_id = object.static_id AND
      object.is_latest AND
      object.branch_type = ${BranchTypeEnum.published} AND
      object.static_id IN (${Prisma.join(staticIds)})
    `;
  } else {
    throw new Error('Neither collectionIds nor staticIds are provided');
  }
}

async function getRatings(
  db: PrismaClient,
  organizationId: number,
  objectGrouping: NexusGenEnums['InsightsObjectGroupingEnum'],
  eligibleActivitiesSQL: Prisma.Sql,
  startDateSQL: Prisma.Sql,
  endDateSQL: Prisma.Sql
) {
  const groupingSQL = Prisma.raw(
    objectGrouping === 'collectionId'
      ? 'object.collection_id'
      : 'object.static_id'
  );
  const [rawData, latestData] = await Promise.all([
    db.$queryRaw<
      {
        grouping: number; // Technically this is number or string depending on grouping
        day: string;
        rating: number;
        count: number;
      }[]
    >`
      WITH convos AS (
        SELECT DISTINCT ${groupingSQL} as grouping, ic.id, ic.rated_at, ic.rating
        FROM
          insights_conversations ic,
          user_tool_runs activity,
          tools object
        WHERE
          activity.conversation_id = ic.id AND
          ${eligibleActivitiesSQL} AND
          ic.rating IS NOT NULL AND
          ic.rated_at >= ${startDateSQL} AND
          ic.rated_at < ${endDateSQL} AND
          ic.organization_id = ${organizationId}
        UNION
        SELECT DISTINCT ${groupingSQL} as grouping, ic.id, ic.rated_at, ic.rating
        FROM
          insights_conversations ic,
          user_workflow_views activity,
          workflows object
        WHERE
          activity.conversation_id = ic.id AND
          ${eligibleActivitiesSQL} AND
          ic.rating IS NOT NULL AND
          ic.rated_at >= ${startDateSQL} AND
          ic.rated_at < ${endDateSQL} AND
          ic.organization_id = ${organizationId}
      )
      SELECT
        grouping,
        DATE_TRUNC('day', rated_at${TZ_CONVERT})::date AS day,
        rating,
        COUNT(rating) AS count
      FROM convos
      GROUP BY 1, 2, 3
      ORDER BY 1 ASC, 2 ASC, 3 ASC
    `,
    getLatestInsightsData(db, organizationId),
  ]);
  return {
    data: encodeGrouping(rawData, objectGrouping),
    latestData,
  };
}

type RatingDetails = {
  ticketId: string;
  ticketCreatedAt: DateTime;
  rating: number;
  remark: string | null;
  type: 'tool' | 'workflow';
  activityPerformedAt: DateTime;
  staticId: string;
  name: string;
};
async function getRatingsDetails(
  db: PrismaClient,
  organizationId: number,
  eligibleActivitiesSQL: Prisma.Sql,
  startDateSQL: Prisma.Sql,
  endDateSQL: Prisma.Sql
) {
  return {
    data: db.$queryRaw<RatingDetails[]>`
      SELECT
        ic.id AS "ticketId",
        ic.rated_at AS "ticketCreatedAt",
        ic.rating AS rating,
        ic.data->'conversation_rating'->>'remark' AS remark,
        'tool' AS type,
        activity.run_at AS "activityPerformedAt",
        object.static_id AS "staticId",
        object.name AS name
      FROM
        insights_conversations ic,
        user_tool_runs activity,
        tools object
      WHERE
        ic.id = activity.conversation_id AND
        ic.rated_at IS NOT NULL AND
        ic.rated_at >= ${startDateSQL} AND
        ic.rated_at < ${endDateSQL} AND
        ic.data->'conversation_rating'->>'remark' IS NOT NULL AND
        ic.organization_id = ${organizationId} AND
        ${eligibleActivitiesSQL}
      UNION
      SELECT
        ic.id AS "ticketId",
        ic.rated_at AS "ticketCreatedAt",
        ic.rating AS rating,
        ic.data->'conversation_rating'->>'remark' AS remark,
        'workflow' AS type,
        activity.viewed_at AS "activityPerformedAt",
        object.static_id AS "staticId",
        object.name AS name
      FROM
        insights_conversations ic,
        user_workflow_views activity,
        workflows object
      WHERE
        ic.id = activity.conversation_id AND
        ic.rating IS NOT NULL AND
        ic.rated_at >= ${startDateSQL} AND
        ic.rated_at < ${endDateSQL} AND
        ic.data->'conversation_rating'->>'remark' IS NOT NULL AND
        ic.organization_id = ${organizationId} AND
        ${eligibleActivitiesSQL}
    `,
    latestData: getLatestInsightsData(db, organizationId),
  };
}
