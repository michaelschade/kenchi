/* eslint-disable import/first */
import { instrument } from './honeycomb';

instrument('backend');

import {
  ApolloServerPluginSchemaReporting,
  ApolloServerPluginUsageReporting,
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { json as jsonBodyParser } from 'body-parser';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import createExpress from 'express';
import expressSession from 'express-session';
import { GraphQLSchema } from 'graphql';
import {
  applyMiddleware,
  applyMiddlewareToDeclaredResolvers,
} from 'graphql-middleware';
import { graphqlUploadExpress } from 'graphql-upload';
import { Prisma, PrismaClient } from 'prisma-client';

import { generateViewerContext } from './auth/permissions';
import SessionStore, { getCookieOptions } from './auth/SessionStore';
import setupShield from './auth/shield';
import getConfig from './config';
import { getDB } from './db';
import registerEndpoints from './endpoints';
import {
  graphqlErrorMiddleware,
  initErrorHandling,
  registerErrorHandlers,
} from './errors';
import makeKenchiSchema from './graphql';
import maybeRegisterPlayground from './playground';
import {
  getMigrationStatus,
  isAdmin,
  isDevelopment,
  validateEnv,
} from './utils';

const config = getConfig();

export async function makeApp() {
  const express = createExpress();
  validateEnv();

  if (!process.env.SESSION_KEY) {
    throw new Error('Please set the SESSION_KEY env var');
  }

  let schema: GraphQLSchema = makeKenchiSchema(isDevelopment());
  schema = applyMiddleware(schema, graphqlErrorMiddleware());
  schema = applyMiddlewareToDeclaredResolvers(schema, setupShield());
  const apollo = new ApolloServer({
    apollo: process.env.APOLLO_KEY
      ? {
          graphId: 'kenchi-api',
          graphVariant: process.env.APP_ENV,
          key: process.env.APOLLO_KEY,
        }
      : undefined,
    schema,
    context: async ({ req }) => {
      const loggingContext = {};
      (req as any).loggingContext = loggingContext;
      const ctx: NexusContext = {
        db: getDB(),
        csrfToken: req.csrfToken,
        session: req.session!,
        loggingContext,
        viewerContext: null,
        __rawRequestForAuthOnly: req,
      };
      await generateViewerContext(ctx);
      return ctx;
    },
    introspection: isAdmin() || isDevelopment(), // Allow introspection in admin
    plugins: [
      {
        async requestDidStart(ctx) {
          return {
            async didResolveOperation() {
              ctx.context.loggingContext.operationNames ||= [];
              ctx.context.loggingContext.operationNames.push(ctx.operationName);
            },
            async didEncounterErrors() {
              ctx.context.loggingContext.errors ||= [];
              ctx.context.loggingContext.errors.push(...(ctx.errors || []));
            },
          };
        },
      },
      ...(process.env.APOLLO_KEY
        ? [
            ApolloServerPluginUsageReporting({
              generateClientInfo: ({ request }) => {
                return {
                  clientName: isAdmin() ? 'admin' : 'frontend',
                  clientVersion:
                    request.http?.headers.get('X-Version-App') || undefined,
                };
              },
            }),
            ApolloServerPluginSchemaReporting(),
          ]
        : []),
    ],
  });
  // Initializes both error handling and tracing. Must be done after ApolloServer is created.
  initErrorHandling(express);
  await apollo.start();

  express.set('trust proxy', true);

  // This must be before error-throwing middleware or those errors won't have CORS
  // headers.
  const acceptableOrigins = new Set(
    isAdmin()
      ? [config.adminHost, config.adminApiHost]
      : // TODO: move to config
        [
          config.appHost,
          config.siteHost,
          'chrome-extension://dbffglpoceamchbapbidcafmgneihpbh',
        ]
  );
  if (isDevelopment()) {
    // Playground support
    acceptableOrigins.add(isAdmin() ? config.adminApiHost : config.apiHost);
  }
  express.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === 'null') {
          // Happens when called from a script. Just don't inject a header.
          callback(null, false);
        } else if (acceptableOrigins.has(origin)) {
          callback(null, true);
        } else if (origin.endsWith('.onrender.com')) {
          callback(null, false);
        } else {
          console.log(`Invalid CORS Origin ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      // Max Chrome limit: https://source.chromium.org/chromium/chromium/src/+/main:services/network/cors/preflight_result.cc;l=40;drc=474bad8e061cbe2fa5ebebc6ec3054db20e0d382
      // If you're going to change our CORS handling in any potentially risky way maybe lower this first.
      maxAge: 60 * 60 * 2, // 2 hours
      // If you want to add a new header add it here *first*, deploy, and wait 2
      // hours for the cache to expire.
      allowedHeaders: [
        'X-CSRFToken',
        'Content-Type',
        'X-Version-App',
        'X-Version-Extension',
        // sentry-trace and baggage headers are used by sentry tracing
        // https://docs.sentry.io/product/sentry-basics/tracing/
        'sentry-trace',
        'baggage',
      ],
    })
  );

  express.use(
    expressSession({
      name: 'kenchi.sid',
      secret: [process.env.SESSION_KEY],
      store: new SessionStore(getDB()),
      resave: false,
      saveUninitialized: false,
      cookie: getCookieOptions(isAdmin()),
    })
  );

  express.use(cookieParser());
  const csrf = csurf({
    cookie: {
      key: 'csrfSecret',
      signed: false,
      ...getCookieOptions(isAdmin()),
    },
    value: (req) => req.headers['x-csrftoken'] as string, // typedef is wrong, should be string | undefined
  });

  express.use((req, res, next) => {
    // Admin doesn't need CSRF because we use strict cookies
    if (isAdmin()) {
      return next();
    }
    // Need csrf in the playground so we can extract the token automatically
    if (req.path === '/graphql' || req.path === '/playground') {
      return csrf(req, res, next);
    }
    return next();
  });

  express.use(jsonBodyParser({ type: 'application/json', limit: '20mb' }));

  maybeRegisterPlayground(express);
  registerEndpoints(express);

  express.use(graphqlUploadExpress());
  apollo.applyMiddleware({ app: express, cors: false });

  registerErrorHandlers(express);
  return express;
}

async function verifyMigrationStatus() {
  const status = await getMigrationStatus(getDB());
  const unrunNames = status.filter((s) => !s.runOn).map((s) => s.name);
  if (unrunNames.length > 0) {
    console.warn(
      chalk.red(
        `You have unrun database migrations: ${unrunNames.join(
          ', '
        )}. Please run \`pnpm migrate up\``
      )
    );
  }
}

function waitForDBReady(timeout = 30_000) {
  const start = Date.now();
  const db = new PrismaClient();
  const check = async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      await db.$disconnect();
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientInitializationError) {
        await db.$disconnect();
        const timeLeft = timeout - (Date.now() - start);
        if (timeLeft <= 0) {
          throw new Error('Timeout waiting for DB to be ready');
        } else {
          let message;
          if (e.message.includes("Can't reach database server")) {
            message = 'server is unreachable';
          } else if (e.message.includes('the database system is starting up')) {
            message = 'still starting up';
          } else {
            throw e;
          }
          const waitSeconds = Math.floor(timeLeft / 1000);
          console.log(
            `Waiting up to ${waitSeconds}s for DB to be ready (${message})...`
          );
        }
        return false;
      } else {
        throw e;
      }
    }
  };

  return new Promise<void>((resolve, reject) => {
    check().then((res) => {
      if (res) {
        resolve();
      } else {
        const interval = setInterval(() => {
          check()
            .then((res) => {
              if (res) {
                clearInterval(interval);
                resolve();
              }
            })
            .catch((e) => {
              clearInterval(interval);
              reject(e);
            });
        }, 2_000);
      }
    });
  });
}

async function main() {
  if (isDevelopment()) {
    try {
      await waitForDBReady();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  // This admin port is used by both dev via dev/docker/proxy.conf and prod via
  // the internal-proxy repo. If you change this don't forget to update both of
  // them.
  const port = isAdmin() ? 5003 : 5002;
  const app = await makeApp();
  app.listen(port, () => {
    // Done after server starts and not awaited so it doesn't slow anything down.
    if (isDevelopment()) {
      verifyMigrationStatus();
    }
    let playground;
    if (isAdmin()) {
      playground = `${config.adminApiHost}/playground`;
    } else if (isDevelopment()) {
      playground = `${config.apiHost}/playground`;
    } else {
      playground = undefined;
    }
    console.info({
      event: 'listening',
      env: process.env.APP_ENV,
      app: isAdmin() ? config.adminHost : config.appHost,
      direct: `http://localhost:${port}`,
      playground,
    });
  });
}

if (require.main === module) {
  main();
}
