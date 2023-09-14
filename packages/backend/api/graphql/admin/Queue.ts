import { DateTime } from 'luxon';
import { extendType, nonNull, objectType } from 'nexus';
import { Prisma } from 'prisma-client';

import { queueJob, queueLog } from '../../queue';
import { requireAdmin } from '../../utils';

export const UnprocessedLog = objectType({
  name: 'UnprocessedLog',
  definition(t) {
    t.field('day', { type: 'DateTime' });
    t.int('count');
  },
});

export const UnprocessedLogsAdminQuery = extendType({
  type: 'Admin',
  definition(t) {
    t.list.field('unprocessedLogs', {
      type: 'UnprocessedLog',
      resolve(_root, {}, ctx) {
        return ctx.db.$queryRaw<{ day: string; count: number }[]>`
          SELECT
            date_trunc('day', logs.created_at at time zone 'utc') as day,
            COUNT(id) as count
          FROM logs
          WHERE
            processed_at IS NULL AND
            created_at >= '2020-08-01' AND
            created_at < now() - interval '5 minutes'
          GROUP BY 1
        `;
      },
    });
  },
});

export const QueueMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.int('requeueUnprocessedLogs', {
      args: {
        day: nonNull('DateTime'),
      },
      async resolve(_root, { day }, ctx) {
        requireAdmin();
        const logs = await ctx.db.log.findMany({
          where: {
            processedAt: null,
            createdAt: {
              lt: DateTime.fromJSDate(day).plus({ days: 1 }).toJSDate(),
              gte: day,
            },
          },
        });
        await Promise.all(
          logs.map((log) =>
            queueLog(
              log.id,
              // TODO: https://github.com/prisma/prisma/issues/5062
              log.data as Prisma.JsonObject,
              log.createdAt,
              log.userId || undefined
            )
          )
        );
        return logs.length;
      },
    });

    t.boolean('queueReindexAll', {
      async resolve(_root, {}, _ctx) {
        requireAdmin();
        await queueJob({
          name: 'reindexAll',
        });
        return true;
      },
    });

    t.boolean('queueConfigureSearchIndex', {
      async resolve(_root, {}, _ctx) {
        requireAdmin();
        await queueJob({
          name: 'configureSearchIndex',
        });
        return true;
      },
    });

    t.boolean('queueBackfill', {
      args: {
        start: nonNull('Int'),
        end: nonNull('Int'), // Non-inclusive
      },
      async resolve(_root, { start, end }, _ctx) {
        if (true) {
          throw new Error('Implement backfill first');
        }

        const BATCH_SIZE = 100;
        for (let batch = start; batch < end; batch += BATCH_SIZE) {
          const promises = [];
          for (let i = 0; i < BATCH_SIZE && batch + i < end; i++) {
            promises.push(queueJob({ name: 'backfill', logId: batch + i }));
          }
          await Promise.all(promises);
        }
        return true;
      },
    });
  },
});
