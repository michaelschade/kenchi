import Dataloader from 'dataloader';
import { DateTime } from 'luxon';
import { Prisma, PrismaClient } from 'prisma-client';

import { getDB } from '../db';

type TableNames = 'workflows' | 'tools';

function makeLoader(db: PrismaClient, tableName: TableNames) {
  const tableNameSql = Prisma.raw(tableName);
  return new Dataloader(
    // list of (collectionId, since timestamp) tuples
    async (keys: readonly [number, Date | null | undefined][]) => {
      const sinceTimestampByCollectionId: Map<number, DateTime> = new Map();
      let minSinceTimestamp: DateTime | null = null;
      for (let [collectionId, since] of keys) {
        if (since) {
          const sinceTimestamp = DateTime.fromJSDate(since);
          sinceTimestampByCollectionId.set(collectionId, sinceTimestamp);
          if (!minSinceTimestamp || sinceTimestamp < minSinceTimestamp) {
            minSinceTimestamp = sinceTimestamp;
          }
        }
      }

      // Shortcut if none of the collections have a since timestamp: every value is empty
      if (!minSinceTimestamp) {
        return keys.map(() => []);
      }

      const rows = await db.$queryRaw<
        { collectionId: number; staticId: string; createdAt: string }[]
      >`
        SELECT
          pn.collection_id AS "collectionId",
          pn.static_id AS "staticId",
          n.created_at AS "createdAt"
        FROM ${tableNameSql} n
        LEFT JOIN ${tableNameSql} pn ON pn.id = n.previous_version_id
        WHERE
          pn.collection_id IN (${Prisma.join([
            ...sinceTimestampByCollectionId.keys(),
          ])}) AND
          n.collection_id != pn.collection_id AND
          n.created_at > ${minSinceTimestamp.toJSDate()} AND
          n.branch_type = 'published'
      `;

      const resultsByCollectionId: Record<number, string[]> = {};
      rows.forEach(({ collectionId, staticId, createdAt }) => {
        const sinceTimestamp = sinceTimestampByCollectionId.get(collectionId);
        if (DateTime.fromISO(createdAt) <= sinceTimestamp!) {
          return;
        }
        if (!resultsByCollectionId[collectionId]) {
          resultsByCollectionId[collectionId] = [];
        }
        resultsByCollectionId[collectionId].push(staticId);
      });
      return keys.map(
        ([collectionId]) => resultsByCollectionId[collectionId] || []
      );
    },
    {
      cache: false,
      // TODO: this is naive, we really want a debounce scheduler, but since
      // this is only called on the first query of a batch, we can't do that. We
      // can wrap the `load` method of the dataloader so we know everytime it's
      // called, which is lurky but doable.
      batchScheduleFn: (callback) => setTimeout(callback, 50),
    }
  );
}

const cache: Partial<Record<TableNames, ReturnType<typeof makeLoader>>> = {};
export default function removedSinceLoader(tableName: 'workflows' | 'tools') {
  if (!cache[tableName]) {
    cache[tableName] = makeLoader(getDB(), tableName);
  }
  return cache[tableName]!;
}
