import { omit } from 'lodash';
import { Prisma, PrismaClient } from 'prisma-client';

import { libhoney } from './honeycomb';
import { isDevelopment } from './utils';

let db: PrismaClient | null = null;
export function getDB() {
  if (!db) {
    db = new PrismaClient({
      errorFormat: isDevelopment() ? 'pretty' : 'minimal',
    });
    db.$use(Retry());
    db.$use(LogTelemetry('primary'));
  }
  return db;
}

let insightsDB: PrismaClient | null = null;
export function getInsightsDB() {
  if (!process.env.INSIGHTS_DATABASE_URL) {
    return getDB();
  }
  if (!insightsDB) {
    insightsDB = new PrismaClient({
      datasources: { db: { url: process.env.INSIGHTS_DATABASE_URL } },
      errorFormat: isDevelopment() ? 'pretty' : 'minimal',
    });
    insightsDB.$use(Retry());
    insightsDB.$use(LogTelemetry('read_replica'));
  }
  return insightsDB;
}

export function closeDB() {
  if (db) {
    return db.$disconnect();
  }
  return Promise.resolve();
}

const MAX_RETRIES = 3;
const MIN_BACKOFF_MS = 5;
const MAX_BACKOFF_MS = 30;

const sleep = (min: number, max: number) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class PrismaRetryError extends Error {
  constructor() {
    super();
    this.name = 'PrismaRetryError';
  }
}

const Retry = (): Prisma.Middleware => {
  if (MIN_BACKOFF_MS > MAX_BACKOFF_MS) {
    throw new Error('Minimum backoff must be less than maximum backoff');
  }

  return async (params, next) => {
    let retries = 0;
    do {
      try {
        const result = await next(params);
        return result;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P1017'
        ) {
          retries += 1;
          console.log(`Retry ${retries}: connection closed`);
          await sleep(MIN_BACKOFF_MS, MAX_BACKOFF_MS);
          continue;
        }
        throw err;
      }
    } while (retries < MAX_RETRIES);
    throw new PrismaRetryError();
  };
};

const BLACKLISTED_ARGS_MODELS = new Set<Prisma.ModelName>(['AuthSession']);
const LogTelemetry = (dbTag: 'primary' | 'read_replica'): Prisma.Middleware => {
  return async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const end = Date.now();
    const duration = end - start;
    const event = libhoney().newEvent();
    const { action, model } = params;
    const logArgs = !model || !BLACKLISTED_ARGS_MODELS.has(model);

    event.add({
      dbTag,
      service_name: process.env.SERVICE ?? 'unknown',
      action,
      args: logArgs ? JSON.stringify(omit(params.args, 'data')) : 'REDACTED',
      model,
      duration_ms: duration,
      'meta.type': 'database_query',
    });
    event.send();
    return result;
  };
};
