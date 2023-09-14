/* eslint-disable import/first */
import { instrument } from '../honeycomb';

const beeline = instrument('worker');
import * as Sentry from '@sentry/node';
import { captureException } from '@sentry/node';
import { TrackClient } from 'customerio-node';
import type { Span } from 'honeycomb-beeline';
import { Prisma } from 'prisma-client';
import { URL } from 'url';

import getConfig from '../config';
import { getDB } from '../db';
import { CREATE_ORG_NOTIF_ID } from '../graphql/Notification';
import { generateStaticId, initSentry, isDevelopment } from '../utils';
import { getQueue, JobType } from '.';
import { handleEmail } from './jobs/handleEmail';
import {
  handleCollectionReindex,
  handleConfigureSearchIndex,
  handleReindexAll,
  handleToolReindex,
  handleWorkflowReindex,
} from './jobs/handleSearchIndexUpdate';
import {
  handleToolMutation,
  handleWorkflowMutation,
} from './jobs/handleVersionedNodeMutation';

const db = getDB();
const TOOL_RUNS_BEFORE_CREATE_ORG_PROMPT = 2;

let _cio: TrackClient;
function getCIO() {
  if (!_cio) {
    const siteId = process.env.CUSTOMERIO_TRACKING_SITE_ID;
    const apiKey = process.env.CUSTOMERIO_TRACKING_API_KEY;
    if (!siteId || !apiKey) {
      throw new Error('Missing env vars CUSTOMERIO_TRACKING_{SITE_ID|API_KEY}');
    }
    _cio = new TrackClient(siteId, apiKey);
  }
  return _cio;
}

function finishTrace(span: Span | undefined, error?: unknown) {
  if (!span || !beeline) {
    return;
  }
  if (error) {
    if (error instanceof Error) {
      span.addContext({
        'job.result': 'failed',
        'job.error': error.name,
        'job.errorMessage': error.message,
      });
    } else {
      span.addContext({
        'job.result': 'failed',
        'job.error': error,
      });
    }
  } else {
    span.addContext({ 'job.result': 'completed' });
  }
  beeline.finishTrace(span);
}

export default function main() {
  console.log('starting worker');

  initSentry();

  const queue = getQueue();
  queue.on('error', (err) => {
    console.error(err);
    captureException(err);
  });
  queue.on('completed', (job) => {
    console.log(`completed job ${job.id}: ${job.data.name}`);
  });
  queue.on('failed', (job, err) => {
    console.log(`failed job ${job.id} with error ${err}`);
    console.error(err);
    captureException(err);
  });

  queue.process(async (job) => {
    let rootSpan = beeline?.startTrace({
      'meta.type': 'queue',
      name: 'job',
      'job.id': job.id,
      'job.type': job.data.name,
      // TODO: maybe consolidate on a single global "id" field?
      'job.data.id': 'id' in job.data ? job.data.id : undefined,
      'job.data.userId': 'userId' in job.data ? job.data.userId : undefined,
      'job.data.toolId': 'toolId' in job.data ? job.data.toolId : undefined,
      'job.data.workflowId':
        'workflowId' in job.data ? job.data.workflowId : undefined,
    });
    Sentry.setContext('job', { jobId: job.id, ...job.data });
    try {
      await processJob(job.data);
    } catch (e) {
      finishTrace(rootSpan, e);
      throw e;
    }
    finishTrace(rootSpan);
  });
}

export async function processJob(data: JobType) {
  switch (data.name) {
    case 'log':
      await handleLog(data.id, data.data, data.createdAt, data.userId);
      await db.log.update({
        where: {
          id: data.id,
        },
        data: {
          processedAt: new Date(),
        },
      });
      return;
    case 'toolMutation':
      await handleToolMutation(data.toolId, data.action);
      await handleToolReindex(data.toolId);
      return;
    case 'workflowMutation':
      await handleWorkflowMutation(data.workflowId, data.action);
      await handleWorkflowReindex(data.workflowId);
      return;
    case 'collectionMutation':
      await handleCollectionReindex(data.collectionId);
      return;
    case 'login':
      await handleLogin(data.userId, data.createdAt);
      return;
    case 'newUser':
      await handleNewUser(data.userId, data.createdAt);
      return;
    case 'email':
      await handleEmail(data.userId, data.email);
      return;
    case 'backfill':
      await handleBackfill(data.logId);
      return;
    case 'reindexAll':
      await handleReindexAll();
      return;
    case 'configureSearchIndex':
      await handleConfigureSearchIndex();
      return;
    case 'test':
      return data.x + data.y;
    default:
      throw new Error(`Unexpected job: ${(data as any).name}`);
  }
}

async function handleLog(
  id: number,
  data: Prisma.JsonObject,
  createdAt: Date,
  userId?: number
) {
  if (!('action' in data)) {
    console.warn('Found a log entry without an action, ignoring', id);
    return;
  }

  // We often use prod CIO because the dev enviornment doesn't have
  // the same transactional messages. Don't accidentally track data.
  if (!isDevelopment()) {
    if (userId && data.action !== 'page_view') {
      getCIO().track(userId, { name: data.action });
    }
  }

  const conversationId = getConversationId(data.pageUrl);

  switch (data.action) {
    case 'run_directly':
    case 'run_from_modal':
      if (typeof data.object !== 'string') {
        console.warn('Found a run action without an object', id);
        return;
      }
      if (!userId) {
        console.warn('Found a run action without a userId', id);
        return;
      }
      await handleToolRun(conversationId, data.object, createdAt, userId);
      break;
    case 'page_view':
      if (typeof data.path !== 'string') {
        console.warn('Found a page view without a path', id);
        return;
      }
      if (!userId) {
        console.warn('Found a page view without a userId', id);
        return;
      }
      await handlePageView(conversationId, data.path, createdAt, userId);
      break;
  }
}

async function handleBackfill(logId: number) {
  const log = await db.log.findFirst({
    where: { id: logId, processedAt: null },
  });
  if (!log) {
    return;
    // throw new Error('Missing log!');
  }
  const data = log.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid log data format');
  }
  const conversationId = getConversationId(data.pageUrl);
  switch (data.action) {
    case 'run_directly':
    case 'run_from_modal':
      if (typeof data.object !== 'string') {
        throw new Error('Missing static id in tool run');
      }
      if (!log.userId) {
        console.warn('Tool run without user ID', log.id);
        return;
      }
      await db.userToolRun.create({
        data: {
          runAt: log.createdAt,
          staticId: data.object,
          userId: log.userId,
          conversationId,
        },
      });
      break;
    case 'page_view':
      if (typeof data.path !== 'string') {
        throw new Error('Missing path in page view');
      }
      const match = data.path.match(/^\/(workflows|playbooks)\/(\w+)$/);
      if (match) {
        const staticId = match[2];
        if (typeof data.path !== 'string') {
          console.warn('Found a page view without a path', log.id);
          return;
        }
        if (!log.userId) {
          console.warn('Workflow view without user ID', log.id);
          return;
        }
        await db.userWorkflowView.create({
          data: {
            viewedAt: log.createdAt,
            staticId,
            userId: log.userId,
            conversationId,
          },
        });
      }
      break;
  }
  await db.log.update({
    where: { id: logId },
    data: { processedAt: new Date() },
  });
}

export function getConversationId(url: Prisma.JsonValue | undefined) {
  if (typeof url !== 'string') {
    return null;
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    console.log('Got invalid URL');
    return null;
  }
  if (parsedUrl.host === 'app.intercom.com') {
    const pathParts = parsedUrl.pathname.split('/');

    const conversationsIndex = pathParts.findIndex((p) =>
      p.startsWith('conversation')
    );
    if (conversationsIndex !== -1) {
      const conversationId = pathParts[conversationsIndex + 1];
      return conversationId;
    }
  }
  return null;
}

async function handleToolRun(
  conversationId: string | null,
  staticId: string,
  createdAt: Date,
  userId: number,
  revisionId?: number
) {
  const [userToolRun, user] = await Promise.all([
    db.userToolRun.create({
      data: {
        runAt: createdAt,
        revisionId,
        staticId,
        userId,
        conversationId,
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    }),
  ]);

  if (!user) {
    return;
  }

  await db.userSubscription.upsert({
    create: {
      userId: user.id,
      staticId,
      subscribed: true,
    },
    update: {
      subscribed: true,
    },
    where: {
      userId_staticId: {
        userId: user.id,
        staticId,
      },
    },
  });

  if (user.organization.shadowRecord) {
    // Use ID to avoid race condition
    const count = await db.userToolRun.count({
      where: { userId: user.id, id: { lte: userToolRun.id } },
    });
    if (count === TOOL_RUNS_BEFORE_CREATE_ORG_PROMPT) {
      await db.userNotification.create({
        data: {
          id: generateStaticId('unotif'),
          userId,
          notificationId: CREATE_ORG_NOTIF_ID,
        },
      });
    }
  }
}

async function handlePageView(
  conversationId: string | null,
  path: string,
  createdAt: Date,
  userId: number,
  revisionId?: number
) {
  if (!isDevelopment()) {
    getCIO().trackPageView(userId, `${getConfig().appHost}${path}`);
  }

  const match = path.match(/^\/(workflows|playbooks)\/(\w+)$/);
  if (!match) {
    return;
  }
  const staticId = match[2];

  await db.userWorkflowView.create({
    data: {
      viewedAt: createdAt,
      revisionId,
      staticId,
      userId,
      conversationId,
    },
  });

  await db.userSubscription.upsert({
    create: {
      userId: userId,
      staticId,
      subscribed: true,
    },
    update: {
      subscribed: true,
    },
    where: {
      userId_staticId: {
        userId: userId,
        staticId,
      },
    },
  });
}

async function handleLogin(userId: number, _createdAt: Date) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Login event from invalid user');
  }
  const userinfo = user.userinfoLatest as Prisma.JsonObject | null;

  const cio = getCIO();
  await cio.identify(user.id, {
    email: user.email,
    created_at: Math.floor(user.createdAt.getTime() / 1000),
    name: userinfo?.name,
    first_name: userinfo?.given_name,
    organization_id: user.organizationId,
  });
  await cio.track(user.id, { name: 'login' });
}

async function handleNewUser(userId: number, _createdAt: Date) {
  // NOOP
}

if (require.main === module) {
  main();
}
