import Bull from 'bull';
import { Prisma } from 'prisma-client';

import { Email } from './jobs/handleEmail';

export const mainQueueName = 'main';

export type CRUDAction = 'create' | 'update' | 'delete';

export type LogJob = {
  name: 'log';
  id: number;
  data: Prisma.JsonObject;
  createdAt: Date;
  userId?: number;
};

export type ToolMutationJob = {
  name: 'toolMutation';
  toolId: number;
  action: CRUDAction;
};

export type WorkflowMutationJob = {
  name: 'workflowMutation';
  workflowId: number;
  action: CRUDAction;
};

export type CollectionMutationJob = {
  name: 'collectionMutation';
  collectionId: number;
  action: CRUDAction;
};

export type UserJob = {
  name: 'login' | 'newUser';
  userId: number;
  createdAt: Date;
};

export type TestJob = {
  name: 'test';
  x: number;
  y: number;
};

export type EmailJob = {
  name: 'email';
  userId: number;
  email: Email;
};

type BackfillJob = {
  name: 'backfill';
  logId: number;
};

type ReindexAllJob = {
  name: 'reindexAll';
};

type ConfigureSearchIndexJob = {
  name: 'configureSearchIndex';
};

export type JobType =
  | LogJob
  | ToolMutationJob
  | WorkflowMutationJob
  | CollectionMutationJob
  | UserJob
  | TestJob
  | EmailJob
  | BackfillJob
  | ReindexAllJob
  | ConfigureSearchIndexJob;

// Since the GQL types reference this file we need to lazily instantiate the
// queue otherwise reflection never exits
let queue: Bull.Queue<JobType> | null = null;
export function getQueue() {
  if (!queue) {
    queue = new Bull<JobType>(mainQueueName, {
      redis: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
      },
      defaultJobOptions: {
        // Keep our job stack small-ish so we don't run out of memory
        removeOnComplete: 20000,
      },
    });
  }
  return queue;
}

export const queueJob = (job: JobType) => getQueue().add(job);

export function queueWorkflowMutation(workflowId: number, action: CRUDAction) {
  return queueJob({ name: 'workflowMutation', workflowId, action });
}

export function queueToolMutation(toolId: number, action: CRUDAction) {
  return queueJob({ name: 'toolMutation', toolId, action });
}

export function queueEmail(userId: number, email: Email) {
  return queueJob({ name: 'email', userId, email });
}

export function queueCollectionMutation(
  collectionId: number,
  action: CRUDAction
) {
  return queueJob({ name: 'collectionMutation', collectionId, action });
}

export function queueLog(
  id: number,
  data: Prisma.JsonObject,
  createdAt: Date,
  userId?: number
) {
  return getQueue().add({ name: 'log', id, data, createdAt, userId });
}

export function queueLogin(userId: number) {
  return getQueue().add({ name: 'login', userId, createdAt: new Date() });
}

export function queueNewUser(userId: number) {
  return getQueue().add({ name: 'newUser', userId, createdAt: new Date() });
}

export function queueTest(x: number, y: number) {
  return getQueue().add({ name: 'test', x, y });
}
