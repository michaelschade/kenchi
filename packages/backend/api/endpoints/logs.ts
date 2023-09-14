import 'express-async-errors';

import { captureMessage } from '@sentry/node';
import { Express, urlencoded } from 'express';
import * as t from 'io-ts';
import { Prisma } from 'prisma-client';

import { getDB } from '../db';
import { libhoney } from '../honeycomb';
import { queueLog } from '../queue';

type SessionEntryRow = {
  browserInstanceId: string;
  timestamp: number;
  action: string;
  windowId?: number | null;
  tabId?: number | null;
  data?: Record<string, any>;
};

export default function registerLogEndpoints(server: Express) {
  const db = getDB();

  // Session tracking
  server.post('/s', async (req, res) => {
    if (!Array.isArray(req.body)) {
      console.warn('Got non-array /s body', { extra: { body: req.body } });
      res.json({ success: false });
      return;
    }
    const userId = req.session?.userId;

    await db.$transaction(
      req.body.map((row: SessionEntryRow) =>
        db.sessionEntry.create({
          data: {
            browserInstanceId: row.browserInstanceId,
            action: row.action,
            windowId: row.windowId,
            tabId: row.tabId,
            data: row.data,
            timestamp: new Date(row.timestamp),
            userId,
          },
        })
      )
    );

    res.json({ success: true });
  });

  // Logs
  server.post(
    '/q',
    urlencoded({
      extended: true,
      limit: '10mb',
      // Chrome 87 will use text/plain when sending form data. Force us to
      // handle it, since we have 1 user on that version somehow.
      type: ['text/plain', 'application/x-www-form-urlencoded'],
    }),
    async (req, res) => {
      if (!req.body.data) {
        console.warn('No data object in body', {
          body: req.body,
          userId: req.session?.userId,
        });
        res.json({ success: false });
        return;
      }

      let rawData;
      try {
        rawData = JSON.parse(req.body.data);
      } catch (e) {}

      const userId = req.session?.userId;

      const decodedInput = LogInput.decode(rawData);
      if (decodedInput._tag === 'Left') {
        console.warn('Invalid log data object', {
          body: req.body,
          errors: decodedInput.left,
        });
        res.send('0');
        return;
      }

      const data = decodedInput.right;

      const promises = data.map((entry) => {
        // Getting ts-io to properly handle Json is difficult, so we parse it as
        // unknown and cast from there.
        const typedEntry = {
          ...entry,
          data: entry.data as Prisma.JsonObject,
        };
        if (entry.type === 'user') {
          return processUserLog(typedEntry, userId);
        } else if (entry.type === 'telemetry') {
          return processTelemetryLog(typedEntry, userId);
        } else {
          captureMessage('Unexpected log type', { extra: { entry } });
          return Promise.resolve();
        }
      });
      await Promise.all(promises);

      res.send('1');
    }
  );
}

const processUserLog = async (
  { timestamp, data }: { timestamp: number; data: Prisma.JsonObject },
  userId: number | undefined
) => {
  const createdAt = new Date(timestamp);
  const model = await getDB().log.create({
    data: {
      createdAt,
      data,
      userId,
    },
  });

  await queueLog(model.id, data, model.createdAt, userId);
};

const processTelemetryLog = async (
  { timestamp, data }: { timestamp: number; data: Prisma.JsonObject },
  userId: number | undefined
) => {
  const event = libhoney().newEvent();
  event.timestamp = new Date(timestamp);
  event.add({
    service_name: 'frontend', // Default, overrideable
    ...data,
    user_id: userId,
    'meta.type': 'frontend',
  });
  event.send();
};

const LogRecord = t.type({
  type: t.union([t.literal('user'), t.literal('telemetry')]),
  timestamp: t.number,
  data: t.record(t.string, t.unknown),
});
const LogInput = t.array(LogRecord);
