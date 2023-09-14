import { getDB } from '../../../api/db';
import { decodeId } from '../../../api/utils';
import { createTestContext, loginAndCreateOrg } from '../../__helpers';
import externalDataReferenceFactory from '../../helpers/factories/externalDataReference';

let ctx = createTestContext();
let db: ReturnType<typeof getDB>;
let organizationId: number;
beforeAll(async () => {
  db = getDB();
  const [_userId, _collectionId, _orgStaticId] = await loginAndCreateOrg(ctx);
  const [_prefix, decodedId] = decodeId(_orgStaticId);
  organizationId = decodedId;
});

it('creates an external data reference for the organization', async () => {
  const data = {
    referenceType: 'tag',
    referenceSource: 'zendesk',
    label: 'Some label',
    referenceId: '543465',
  };
  const response = await ctx.client.request(
    `mutation Mutation($data: ExternalDataReferenceCreateInput!) {
        createExternalDataReference(data: $data) {
        externalDataReference {
          id
          referenceType
          referenceSource
          label
          referenceId
        }
        error {
          message
        }
      }
    }`,
    {
      data,
    }
  );

  const dataReference =
    response.createExternalDataReference.externalDataReference;
  expect(dataReference).toEqual(expect.objectContaining(data));
  const externalDataReference = await db.externalDataReference.findUnique({
    where: { id: dataReference.id },
  });
  expect(externalDataReference).toEqual(expect.objectContaining(data));
});

it('updates an external data reference', async () => {
  const externalDataReference = await externalDataReferenceFactory.create({
    organizationId,
  });

  const {
    updateExternalDataReference: {
      externalDataReference: {
        referenceSource: updatedReferenceSource,
        referenceType: updatedReferenceType,
        label: updatedLabel,
        referenceId: updatedReferenceId,
      },
    },
  } = await ctx.client.request(
    `mutation Mutation($id: ID!, $data: ExternalDataReferenceUpdateInput!) {
          updateExternalDataReference(id: $id, data: $data) {
          externalDataReference {
            id
            referenceType
            referenceSource
            label
            referenceId
          }
          error {
            message
          }
        }
      }`,
    {
      id: externalDataReference.id,
      data: {
        referenceType: 'tag',
        referenceSource: 'zendesk',
        label: externalDataReference.label + ' updated',
        referenceId: externalDataReference.referenceId + '1',
      },
    }
  );

  expect(updatedReferenceSource).toEqual('zendesk');
  expect(updatedReferenceType).toEqual('tag');
  expect(updatedLabel).toEqual(externalDataReference.label + ' updated');
  expect(updatedReferenceId).toEqual(externalDataReference.referenceId + '1');
  expect(
    await db.externalDataReference.findUnique({
      where: { id: externalDataReference.id },
    })
  ).toEqual(
    expect.objectContaining({
      referenceSource: updatedReferenceSource,
      referenceType: updatedReferenceType,
      label: updatedLabel,
      referenceId: updatedReferenceId,
    })
  );
});

it('allows partial updates', async () => {
  const externalDataReference = await externalDataReferenceFactory.create({
    organizationId,
  });

  const {
    updateExternalDataReference: {
      externalDataReference: { label: updatedLabel },
    },
  } = await ctx.client.request(
    `mutation Mutation($id: ID!, $data: ExternalDataReferenceUpdateInput!) {
            updateExternalDataReference(id: $id, data: $data) {
            externalDataReference {
              id
              referenceType
              referenceSource
              label
              referenceId
            }
            error {
              message
            }
          }
        }`,
    {
      id: externalDataReference.id,
      data: {
        label: externalDataReference.label + ' updated',
      },
    }
  );

  expect(updatedLabel).toEqual(externalDataReference.label + ' updated');
  expect(
    await db.externalDataReference.findUnique({
      where: { id: externalDataReference.id },
    })
  ).toEqual(
    expect.objectContaining({
      referenceSource: externalDataReference.referenceSource,
      referenceType: externalDataReference.referenceType,
      label: updatedLabel,
      referenceId: externalDataReference.referenceId,
    })
  );
});

it('treats null like an omitted field', async () => {
  const { id, referenceType, referenceSource, label, referenceId } =
    await externalDataReferenceFactory.create({
      organizationId,
    });

  // The following API call is essentially a No-op.
  const {
    updateExternalDataReference: {
      externalDataReference: updatedExternalDataReference,
    },
  } = await ctx.client.request(
    `mutation Mutation($id: ID!, $data: ExternalDataReferenceUpdateInput!) {
              updateExternalDataReference(id: $id, data: $data) {
              externalDataReference {
                id
                referenceType
                referenceSource
                label
                referenceId
              }
              error {
                message
              }
            }
          }`,
    {
      id,
      data: {
        referenceType: null,
        referenceSource: null,
        label: null,
        referenceId: null,
      },
    }
  );

  expect(updatedExternalDataReference).toEqual(
    expect.objectContaining({
      referenceType,
      referenceSource,
      label,
      referenceId,
    })
  );
  expect(
    await db.externalDataReference.findUnique({
      where: { id },
    })
  ).toEqual(
    expect.objectContaining({
      referenceSource,
      referenceType,
      label,
      referenceId,
    })
  );
});

it('archives an external data reference', async () => {
  const externalDataReference = await externalDataReferenceFactory.create({
    organizationId,
  });

  await ctx.client.request(
    `mutation Mutation($id: ID!) {
            archiveExternalDataReference(id: $id) {
            externalDataReference {
              id
            }
            error {
              message
            }
          }
        }`,
    {
      id: externalDataReference.id,
    }
  );

  expect(
    (
      await db.externalDataReference.findUnique({
        where: { id: externalDataReference.id },
      })
    )?.isArchived
  ).toBe(true);
});
