// Import helpers first so everything can get properly mocked.
// eslint-disable-next-line simple-import-sort/imports
import {
  archiveTool,
  archiveWorkflow,
  createTestContext,
  createTool,
  createWorkflow,
  loginAndCreateOrg,
  updateTool,
  updateWorkflow,
} from './__helpers';

import * as queue from '../api/queue';
import { processJob } from '../api/queue/worker';
import { decodeId, encodeId } from '../api/utils';
import { User } from 'prisma-client';
import userFactory from './helpers/factories/user';
import collectionFactory from './helpers/factories/collection';

const queueEmail = jest.spyOn(queue, 'queueEmail');

const ctx = createTestContext();

let collectionId: string;
let user: User;
let adminUser: User;
let collectionUser: User;
let nonCollectionUser: User;

beforeAll(async () => {
  const [userToken] = await loginAndCreateOrg(ctx);
  const [, userId] = decodeId(userToken);
  const maybeUser = await ctx.app.db.user.findFirst({ where: { id: userId } });
  if (!maybeUser) {
    throw new Error('no user');
  }
  user = maybeUser;

  const collection = await collectionFactory.create({
    name: 'fun stuff',
    defaultPermissions: ['viewer'],
    description: 'wow what a description',
    organizationId: user?.organizationId,
  });

  collectionId = encodeId('coll', collection.id);

  adminUser = await userFactory.create({
    organizationId: user?.organizationId,
    isOrganizationAdmin: true,
    email: 'admin@test.com',
    wantsEditSuggestionEmails: true,
  });

  collectionUser = await userFactory.create({
    organizationId: user.organizationId,
    email: 'collection-user@test.com',
    wantsEditSuggestionEmails: true,
    collectionAcls: {
      create: {
        collectionId: collection.id,
        permissions: ['admin'],
      },
    },
  });

  nonCollectionUser = await userFactory.create({
    organizationId: user.organizationId,
    email: 'non-collection-user@test.com',
    wantsEditSuggestionEmails: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('tools', () => {
  it('sends email for suggesting a new tool', async () => {
    const tool = await createTool(ctx, {
      collectionId,
      branchType: 'suggestion',
    });

    const [, toolId] = decodeId(tool.id);
    await processJob({ name: 'toolMutation', toolId, action: 'create' });

    expect(queueEmail).toHaveBeenCalledTimes(2);
    expect(queueEmail).toHaveBeenCalledWith(
      collectionUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: true }),
      })
    );
    expect(queueEmail).toHaveBeenCalledWith(
      adminUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: true }),
      })
    );
    expect(queueEmail).not.toHaveBeenCalledWith(user.id, expect.anything());
    expect(queueEmail).not.toHaveBeenCalledWith(
      nonCollectionUser.id,
      expect.anything()
    );
  });

  it('sends email for suggesting an update to a published tool', async () => {
    const tool = await createTool(ctx, { collectionId });
    const [, toolId] = decodeId(tool.id);

    await processJob({ name: 'toolMutation', toolId, action: 'create' });

    expect(queueEmail).toHaveBeenCalledTimes(0);
    queueEmail.mockClear();

    const updatedTool = await updateTool(ctx, tool.id, {
      name: 'Test Automation (updated)',
      branchType: 'suggestion',
    });
    const [, updatedToolId] = decodeId(updatedTool.id);
    await processJob({
      name: 'toolMutation',
      toolId: updatedToolId,
      action: 'update',
    });

    expect(queueEmail).toHaveBeenCalledTimes(2);
    expect(queueEmail).toHaveBeenCalledWith(
      collectionUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: false }),
      })
    );
    expect(queueEmail).toHaveBeenCalledWith(
      adminUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: false }),
      })
    );
    expect(queueEmail).not.toHaveBeenCalledWith(user.id, expect.anything());
    expect(queueEmail).not.toHaveBeenCalledWith(
      nonCollectionUser.id,
      expect.anything()
    );
  });

  it('does not send email when tool already handled', async () => {
    const tool = await createTool(ctx, {
      collectionId,
      branchType: 'suggestion',
    });
    await archiveTool(ctx, tool.id);

    const [, toolId] = decodeId(tool.id);
    await processJob({ name: 'toolMutation', toolId, action: 'create' });

    expect(queueEmail).toHaveBeenCalledTimes(0);
  });
});

describe('workflows', () => {
  it('sends email for suggesting a new workflow', async () => {
    const workflow = await createWorkflow(ctx, {
      collectionId,
      branchType: 'suggestion',
    });

    const [, workflowId] = decodeId(workflow.id);
    await processJob({
      name: 'workflowMutation',
      workflowId,
      action: 'create',
    });

    expect(queueEmail).toHaveBeenCalledTimes(2);
    expect(queueEmail).toHaveBeenCalledWith(
      collectionUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: true }),
      })
    );
    expect(queueEmail).toHaveBeenCalledWith(
      adminUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: true }),
      })
    );
    expect(queueEmail).not.toHaveBeenCalledWith(user.id, expect.anything);
    expect(queueEmail).not.toHaveBeenCalledWith(
      nonCollectionUser.id,
      expect.anything()
    );
  });

  it('sends email for suggesting an update to a published workflow', async () => {
    const workflow = await createWorkflow(ctx, { collectionId });
    const [, workflowId] = decodeId(workflow.id);

    await processJob({
      name: 'workflowMutation',
      workflowId,
      action: 'create',
    });

    expect(queueEmail).toHaveBeenCalledTimes(0);
    queueEmail.mockClear();

    const updatedWorkflow = await updateWorkflow(ctx, workflow.id, {
      name: 'Test Workflow (updated)',
      branchType: 'suggestion',
    });
    const [, updatedWorkflowId] = decodeId(updatedWorkflow.id);
    await processJob({
      name: 'workflowMutation',
      workflowId: updatedWorkflowId,
      action: 'update',
    });

    expect(queueEmail).toHaveBeenCalledTimes(2);
    expect(queueEmail).toHaveBeenCalledWith(
      collectionUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: false }),
      })
    );
    expect(queueEmail).toHaveBeenCalledWith(
      adminUser.id,
      expect.objectContaining({
        type: 'newSuggestion',
        data: expect.objectContaining({ isNewItem: false }),
      })
    );
    expect(queueEmail).not.toHaveBeenCalledWith(user.id, expect.anything());
    expect(queueEmail).not.toHaveBeenCalledWith(
      nonCollectionUser.id,
      expect.anything()
    );
  });

  it('does not send email when workflow already handled', async () => {
    const workflow = await createWorkflow(ctx, {
      collectionId,
      branchType: 'suggestion',
    });
    await archiveWorkflow(ctx, workflow.id);

    const [, workflowId] = decodeId(workflow.id);
    await processJob({
      name: 'workflowMutation',
      workflowId,
      action: 'create',
    });

    expect(queueEmail).toHaveBeenCalledTimes(0);
  });
});
