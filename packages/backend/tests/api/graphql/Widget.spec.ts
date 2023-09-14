import { BranchTypeEnum } from 'prisma-client';

import { getDB } from '../../../api/db';
import { decodeId, encodeId } from '../../../api/utils';
import { createTestContext, loginWithoutOrg } from '../../__helpers';
import organizationFactory from '../../helpers/factories/organization';
import userFactory from '../../helpers/factories/user';
import widgetFactory from '../../helpers/factories/widget';

let ctx = createTestContext();
const WIDGET_CREATE_MUTATION = `mutation Mutation($data: WidgetCreateInput!) {
  createWidget(data: $data) {
      widget {
          id
          contents
          inputs
      }
      error {
          message
      }
  }
}`;
const WIDGET_UPDATE_MUTATION = `mutation Mutation($id: ID!, $data: WidgetUpdateInput!) {
  updateWidget(id: $id, data: $data) {
      widget {
          id
          contents
          inputs
      }
      error {
          message
      }
  }
}`;
const WIDGET_ARCHIVE_MUTATION = `mutation Mutation($id: ID!) {
  archiveWidget(id: $id) {
      widget {
          id
      }
      error {
          message
      }
  }
}`;
const data = {
  contents: [
    {
      type: 'paragraph',
      children: [{ text: 'Widget test content' }],
    },
  ],
  inputs: [
    {
      source: 'page',
      id: 'recipientName',
      placeholder: 'Recipient name',
    },
    {
      source: 'page',
      id: 'authorFirstName',
      placeholder: 'Author first name',
    },
  ],
};

const updateData = {
  contents: [
    {
      type: 'paragraph',
      children: [{ text: 'Updated widget test content' }],
    },
  ],
  inputs: [
    {
      source: 'page',
      id: 'recipientName',
      placeholder: 'Recipient name',
    },
    {
      source: 'page',
      id: 'authorName', // Changed from authorFirstName
      placeholder: 'Author name',
    },
  ],
};

async function createUser({
  shadowRecord,
  isOrganizationAdmin = true,
}: {
  shadowRecord: boolean;
  isOrganizationAdmin?: boolean;
}) {
  const organization = await organizationFactory.create({
    shadowRecord,
  });
  const user = await userFactory.create({
    organizationId: organization.id,
    isOrganizationAdmin,
  });
  return { user, organization };
}
let db: ReturnType<typeof getDB>;
beforeEach(async () => {
  db = getDB();
  db.authSession.deleteMany();
});

it.each([true, false])(
  'creates a widget for the organization when shadow record is %p',
  async (shadowRecord) => {
    const { user } = await createUser({
      shadowRecord,
      isOrganizationAdmin: true,
    });
    await loginWithoutOrg(ctx, user);
    const {
      createWidget: {
        widget: { id, contents, inputs },
      },
    } = await ctx.client.request(WIDGET_CREATE_MUTATION, {
      data,
    });

    expect(contents).toEqual(data.contents);
    expect(inputs).toEqual(data.inputs);

    const [, decodedId] = decodeId(id);
    const widget = await db.widget.findUnique({ where: { id: decodedId } });
    expect(widget!.organizationId).toEqual(user.organizationId);
  }
);

it('only allows organization admins to create widgets sources', async () => {
  const { user } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: false,
  });
  await loginWithoutOrg(ctx, user);
  await expect(
    ctx.client.request(WIDGET_CREATE_MUTATION, {
      data,
    })
  ).resolves.toMatchObject({ createWidget: { error: expect.anything() } });
});

it('updates a widget by creating a new latest version', async () => {
  const { user, organization } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: true,
  });
  const widget = await widgetFactory.create({
    organizationId: organization.id,
  });

  await loginWithoutOrg(ctx, user);
  const {
    updateWidget: {
      widget: { contents, inputs },
    },
  } = await ctx.client.request(WIDGET_UPDATE_MUTATION, {
    id: encodeId('wdgt', widget.id),
    data: updateData,
  });

  expect(contents).toEqual(updateData.contents);
  expect(inputs).toEqual(updateData.inputs);
  const previousWidget = await db.widget.findUnique({
    where: { id: widget.id },
  });
  const currentWidget = await db.widget.findFirst({
    where: {
      staticId: widget.staticId,
      isLatest: true,
      branchType: BranchTypeEnum.published,
    },
  });
  expect(currentWidget!.id).not.toEqual(previousWidget!.id);
  expect(previousWidget!.isLatest).toBe(false);
});

it('rejects the update when the widget is not the latest version', async () => {
  const { user, organization } = await createUser({
    shadowRecord: false,
    isOrganizationAdmin: true,
  });
  const outOfDateWidget = await widgetFactory.create({
    organizationId: organization.id,
    isLatest: false,
  });
  await widgetFactory.create({
    organizationId: organization.id,
    staticId: outOfDateWidget.staticId,
    isLatest: true,
  });

  await loginWithoutOrg(ctx, user);
  const {
    updateWidget: { error },
  } = await ctx.client.request(WIDGET_UPDATE_MUTATION, {
    id: encodeId('wdgt', outOfDateWidget.id),
    data: updateData,
  });

  expect(error).not.toBeNull();
});

it('archives a widget', async () => {
  const { user, organization } = await createUser({ shadowRecord: false });
  const widget = await widgetFactory.create({
    organizationId: organization.id,
  });
  await loginWithoutOrg(ctx, user);
  await ctx.client.request(WIDGET_ARCHIVE_MUTATION, {
    id: encodeId('wdgt', widget.id),
  });

  const archivedWidget = await db.widget.findUnique({
    where: { id: widget.id },
  });
  expect(archivedWidget!.isArchived).toEqual(true);
});

it('rejects archiving not the latest widget', async () => {
  const { user, organization } = await createUser({ shadowRecord: false });
  const previousWidget = await widgetFactory.create({
    organizationId: organization.id,
    isLatest: false,
  });
  await db.widget.findFirst({
    where: {
      staticId: previousWidget.staticId,
      isLatest: true,
      branchType: BranchTypeEnum.published,
    },
  });
  await loginWithoutOrg(ctx, user);
  const {
    archiveWidget: { error },
  } = await ctx.client.request(WIDGET_ARCHIVE_MUTATION, {
    id: encodeId('wdgt', previousWidget.id),
  });

  expect(error).not.toBeNull();
});
