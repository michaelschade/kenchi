import { captureException, captureMessage } from '@sentry/node';
import { SessionData, Store } from 'express-session';
import { DateTime } from 'luxon';
import { AuthSession, AuthTypeEnum, Prisma, PrismaClient } from 'prisma-client';

import { generateStaticId, isTesting } from '../utils';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    authType: AuthTypeEnum;
    originalUserId?: number;
    dirty?: number;
  }
}

const EXPIRATION_DAYS = 7;

// Return value of this is express.CookieOptions, but that's a class, so using
// it inside of Prisma is difficult.
export function getCookieOptions(admin: boolean) {
  return {
    // Admin can be strict because we don't run it in an iframe
    sameSite: admin ? ('strict' as const) : ('none' as const),
    secure: !isTesting(),
    maxAge: EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export default class SessionStore extends Store {
  constructor(private db: PrismaClient) {
    super();
  }

  get = async (
    sid: string,
    callback: (err?: unknown, session?: SessionData | null) => void
  ) => {
    let session: AuthSession | null = null;
    try {
      session = await this.db.authSession.findFirst({ where: { secret: sid } });
      if (session && DateTime.fromJSDate(session.expiresAt) < DateTime.now()) {
        // This makes a *ton* of logging since we don't clear cookies on expiration
        // captureMessage('Got expired session ID', {
        //   extra: { id: session.id },
        //   level: Severity.Debug,
        // });
        session = null;
      } else if (!session) {
        captureMessage('Unable to find session for sid', {
          extra: { sid },
          level: 'debug',
        });
      }
    } catch (e) {
      callback(e);
      return;
    }
    if (session) {
      const sessionData = {
        ...(session.data as Prisma.JsonObject),
        userId: session.userId,
        authType: session.type,
      };
      callback(null, sessionData as unknown as SessionData);
    } else {
      callback(null);
    }
  };

  set = (
    sid: string,
    session: SessionData,
    callback?: (err?: unknown) => void
  ) => {
    withErrorCallback(callback, async () => {
      const { authType, userId, ...data } = session;
      const expiresAt = getExpiration();
      // TODO: strip out Cookie methods so this is a JsonObject without casting.
      const castData = data as unknown as Prisma.JsonObject;
      const authSession = await this.db.authSession.upsert({
        create: {
          id: generateStaticId('auth'),
          expiresAt,
          secret: sid,
          // TODO: remove type fallback after done migrating
          type: authType,
          userId,
          data: castData,
        },
        update: {
          expiresAt,
          data: castData,
        },
        where: {
          secret: sid,
        },
      });
      if (authSession.type !== authType) {
        this.destroy(sid);
        const msg = `Attempt to change auth type from ${authSession.type} to ${authType} for ${authSession.id}`;
        captureMessage(msg);
        throw new Error(msg);
      }
      if (authSession.userId !== (userId || null)) {
        this.destroy(sid);
        const msg = `Attempt to change user ID from ${authSession.userId} to ${userId} for ${authSession.id}`;
        captureMessage(msg);
        throw new Error(msg);
      }
    });
  };

  destroy = (sid: string, callback?: (err?: unknown) => void) => {
    withErrorCallback(callback, async () => {
      const authSession = await this.db.authSession.findFirst({
        where: { secret: sid },
      });
      if (authSession) {
        await this.db.authSession.update({
          data: { expiresAt: new Date() },
          where: { id: authSession.id },
        });
      }
    });
  };

  touch = (
    sid: string,
    _session: SessionData,
    callback?: (err?: unknown) => void
  ) => {
    withErrorCallback(callback, () =>
      this.db.authSession.update({
        data: {
          expiresAt: getExpiration(),
        },
        where: {
          secret: sid,
        },
      })
    );
  };

  all = async (
    callback: (err: any, obj?: Record<string, SessionData> | null) => void
  ) => {
    callback('NOT IMPLEMENTED');
  };

  length = (callback: (err: any, length: number) => void) => {
    callback('NOT IMPLEMENTED', 0);
  };

  clear = (callback?: (err?: any) => void) => {
    callback?.('NOT IMPLEMENTED');
  };
}

function getExpiration() {
  return DateTime.now().plus({ days: EXPIRATION_DAYS }).toJSDate();
}

function withErrorCallback(
  callback: ((err?: any) => void) | undefined,
  fn: () => Promise<unknown>
) {
  return fn()
    .then(() => callback?.())
    .catch((e) => {
      callback?.(e);
      captureException(e);
    });
}
