import { decodeId } from '../api/utils';
import { createTestContext, loginAndCreateOrg } from './__helpers';

const ctx = createTestContext();

async function setDomainSettings(variables: {
  host: string;
  open?: boolean;
  side?: string;
}) {
  const resp = await ctx.client.request(
    `mutation DomainSettingsMutation(
      $host: String!
      $open: Boolean
      $side: String
    ) {
      setUserDomainSettings(
        userDomainSettingsData: { host: $host, open: $open, side: $side }
      ) {
        userDomainSettings {
          id
          domain {
            id
            hosts
            insertTextXPath
          }
          injectHud
          open
          side
        }
      }
    }`,
    variables
  );
  return resp.setUserDomainSettings.userDomainSettings;
}

it('create new domain', async () => {
  await loginAndCreateOrg(ctx);

  const resp = await setDomainSettings({
    host: 'example.com',
    open: true,
    side: 'right',
  });

  expect(resp).toMatchObject({
    domain: { hosts: ['example.com'] },
    open: true,
    side: 'right',
  });
});

it('adds to an existing domain', async () => {
  const [userToken] = await loginAndCreateOrg(ctx);
  const [, userId] = decodeId(userToken);
  const user = await ctx.app.db.user.findUnique({
    where: { id: userId },
    rejectOnNotFound: true,
  });

  await ctx.app.db.domain.create({
    data: {
      organizationId: user.organizationId,
      hosts: ['example.com'],
      settings: { insertTextXPath: 'test' },
    },
  });

  const resp = await setDomainSettings({
    host: 'example.com',
    open: true,
    side: 'right',
  });

  expect(resp).toMatchObject({
    domain: {
      hosts: ['example.com'],
      insertTextXPath: 'test',
    },
    open: true,
    side: 'right',
  });
});

it('does not override previous data when updating user settings', async () => {
  await loginAndCreateOrg(ctx);

  const resp = await setDomainSettings({
    host: 'example.com',
    open: true,
  });

  expect(resp).toMatchObject({
    domain: { hosts: ['example.com'] },
    open: true,
    side: null,
  });

  const uds = await ctx.app.db.userDomainSettings.update({
    where: { id: decodeId(resp.id)[1] },
    data: { domainInterfaceOptions: { injectHud: true } },
  });

  expect(uds).toMatchObject({ domainInterfaceOptions: { injectHud: true } });

  const resp2 = await setDomainSettings({
    host: 'example.com',
    side: 'right',
  });

  expect(resp2).toMatchObject({
    domain: { hosts: ['example.com'] },
    open: true,
    side: 'right',
    injectHud: true,
  });
});
