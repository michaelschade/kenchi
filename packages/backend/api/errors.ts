import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';
import { json } from 'body-parser';
import { Express } from 'express';
import type { ErrorRequestHandler } from 'express-serve-static-core';
import type { GraphQLResolveInfo } from 'graphql';
import { pathToArray } from 'graphql/jsutils/Path';
import { IMiddlewareFunction } from 'graphql-middleware';

import { encodeId, initSentry, isDevelopment, isTesting } from './utils';

export function graphqlErrorMiddleware(): IMiddlewareFunction {
  return (resolve, root, args, ctx, info) => {
    try {
      const rtn = resolve(root, args, ctx, info);
      if (rtn instanceof Promise) {
        return rtn.catch((error) => {
          captureGraphQLError(error, args, ctx, info);
          throw error;
        });
      } else {
        return rtn;
      }
    } catch (error) {
      captureGraphQLError(error, args, ctx, info);
      throw error;
    }
  };
}

export function captureGraphQLError(
  error: unknown,
  args: any,
  ctx: NexusContext,
  info: GraphQLResolveInfo
) {
  const context: Record<string, unknown> = {
    operationName: info.operation.name?.value,
    type: info.parentType.name,
    field: info.fieldName,
    args,
    path: pathToArray(info.path),
  };
  let consoleError;
  if (error instanceof Error) {
    consoleError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else {
    consoleError = error;
  }
  console.error({ event: `graphql error`, context, error: consoleError });
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    if (ctx.viewerContext) {
      const user = ctx.viewerContext.user;
      scope.setUser({
        id: encodeId('user', user.id),
        email: user.email ?? undefined,
      });
    } else {
      const userId = ctx.session.userId;
      if (userId) {
        scope.setUser({
          id: encodeId('user', userId),
        });
      }
    }
    if (typeof error === 'string') {
      Sentry.captureMessage(error);
    } else {
      Sentry.captureException(error);
    }
  });
}

const jsonBodyParser = json();
const csrfErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  const errorResp = { data: null, errors: [{ message: 'expired_csrf' }] };

  // The body-parser for /graphql gets injected later, so we need to run it
  // here to get JSON out of the request.
  jsonBodyParser(req, res, () => {
    res.status(200);
    if (req.body && Array.isArray(req.body)) {
      res.json(req.body.map(() => errorResp));
    } else {
      res.json(errorResp);
    }
  });
};

const nonGraphQLErrorRenderer: ErrorRequestHandler = (err, req, res, _next) => {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  const sentry = (res as any).sentry;

  console.error(`${err.name} in ${req.path} (${sentry})`, err);

  if (isDevelopment() && err instanceof Error) {
    res.json({
      error: err.name,
      sentry,
      stacktrace: err.stack,
    });
  } else {
    res.json({
      error: true,
      sentry,
    });
  }
};

export function initErrorHandling(app: Express) {
  process.on('unhandledRejection', function (err) {
    console.error(err);
  });
  initSentry({
    integrations: [
      // This could be more info than we want because it creates a lot of
      // transactions per trace. If that's the case we can either reduce the
      // sample rate on the frontend or remove some of these tracing
      // integrations.
      new Sentry.Integrations.Http({ tracing: true }),
      new SentryTracing.Integrations.Express({ app }),
      new SentryTracing.Integrations.GraphQL(),
      new SentryTracing.Integrations.Apollo(),
    ],
    tracesSampler: (samplingContext) => {
      // Rely on the parent to make the sampling decision, i.e. frontend sentry
      // dictates sampling and passes back HTTP headers with trace information.
      return !!samplingContext.parentSampled;
    },
  });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  if (!isDevelopment() && !isTesting()) {
    // Limit tracing to graphql requests
    app.use(/^\/graphql/, Sentry.Handlers.tracingHandler());
  }
}

export function registerErrorHandlers(app: Express) {
  app.use(csrfErrorHandler);

  const ignoreRequestAborted: ErrorRequestHandler = (err, req, res, next) => {
    if (req.path === '/t' || req.path === '/q') {
      if (
        err instanceof Error &&
        'code' in err &&
        err['code'] === 'ECONNABORTED'
      ) {
        console.error('Ignoring request aborted', err);
        nonGraphQLErrorRenderer(err, req, res, next);
        return;
      }
    }
    next(err);
  };

  app.use(ignoreRequestAborted);

  // The Sentry error handler must be before any other error middleware
  // It by default keys off of status, make it always handle.
  app.use(Sentry.Handlers.errorHandler({ shouldHandleError: () => true }));
  app.use(nonGraphQLErrorRenderer);
}
