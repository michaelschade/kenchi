import { getDB } from '../../../api/db';
import { decodeId } from '../../../api/utils';
import { createTestContext, loginAndCreateOrg } from '../../__helpers';
import externalDataReferenceFactory from '../../helpers/factories/externalDataReference';
import externalTagFactory from '../../helpers/factories/externalTag';

let ctx = createTestContext();
let db: ReturnType<typeof getDB>;
let organizationId: number;
describe('dual writing to ExternalDataReferences', () => {
  beforeAll(async () => {
    db = getDB();
    const [_userId, _collectionId, _orgStaticId] = await loginAndCreateOrg(ctx);
    const [_prefix, decodedId] = decodeId(_orgStaticId);
    organizationId = decodedId;
  });

  it('also creates an external data reference', async () => {
    const response = await ctx.client.request(
      `mutation Mutation($data: ExternalTagInput!) {
        createExternalTag(tagData: $data) {
        tag {
          id
          label
          intercomId
        }
        error {
          message
        }
      }
    }`,
      {
        data: {
          label: 'Some label',
          intercomId: '543465',
        },
      }
    );
    const tag = response.createExternalTag.tag;
    expect(tag).toEqual(
      expect.objectContaining({ label: 'Some label', intercomId: '543465' })
    );
    const externalDataReference = await db.externalDataReference.findUnique({
      where: { id: tag.id.replace('etag', 'edref') },
    });
    expect(externalDataReference).not.toBeNull();
    expect(externalDataReference).toEqual(
      expect.objectContaining({
        referenceSource: 'intercom',
        referenceType: 'tag',
        label: 'Some label',
        referenceId: '543465',
      })
    );
  });

  it('also updates an external data reference', async () => {
    const { id, label, intercomId } = await externalTagFactory.create({
      organizationId,
    });

    const externalDataReference = await externalDataReferenceFactory.create({
      id: id.replace('etag', 'edref'),
      organizationId,
      referenceSource: 'intercom',
      referenceType: 'tag',
      label,
      referenceId: intercomId!,
    });

    const {
      updateExternalTag: {
        tag: { label: updatedLabel, intercomId: updatedIntercomId },
      },
    } = await ctx.client.request(
      `mutation Mutation($id: ID!, $data: ExternalTagInput!) {
          updateExternalTag(id: $id, tagData: $data) {
          tag {
            id
            label
            intercomId
          }
          error {
            message
          }
        }
      }`,
      {
        id,
        data: {
          label: label + ' updated',
          intercomId: intercomId + '1',
        },
      }
    );

    expect(updatedLabel).toEqual(label + ' updated');
    expect(updatedIntercomId).toEqual(intercomId + '1');
    expect(
      await db.externalDataReference.findUnique({
        where: { id: externalDataReference.id },
      })
    ).toEqual(
      expect.objectContaining({
        label: updatedLabel,
        referenceId: updatedIntercomId,
      })
    );
  });

  it('also archives an external data reference', async () => {
    const { id, label, intercomId } = await externalTagFactory.create({
      organizationId,
    });

    const externalDataReference = await externalDataReferenceFactory.create({
      id: id.replace('etag', 'edref'),
      organizationId,
      referenceSource: 'intercom',
      referenceType: 'tag',
      label,
      referenceId: intercomId!,
    });

    await ctx.client.request(
      `mutation Mutation($id: ID!) {
            archiveExternalTag(id: $id) {
            tag {
              id
            }
            error {
              message
            }
          }
        }`,
      {
        id,
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
});
