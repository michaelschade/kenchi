import { connectionPlugin, makeSchema } from 'nexus';
import { $settings } from 'nexus-prisma';
import path from 'path';

import { isAdmin, isDevelopment } from '../utils';
// Admin
import * as Admin from './admin/Admin';
import * as AdminNode from './admin/AdminNode';
import * as BulkUpdate from './admin/BulkUpdate';
import * as DatabaseMigration from './admin/DatabaseMigration';
import * as DemoAccount from './admin/DemoAccount';
import * as LoginAs from './admin/LoginAs';
import * as AdminNotification from './admin/Notification';
import * as PageSnapshot from './admin/PageSnapshot';
import * as Queue from './admin/Queue';
import * as ToolRunLog from './admin/ToolRunLog';
// Backend
import * as AuthSession from './AuthSession';
import * as Collection from './Collection';
import * as DataImport from './DataImport';
import * as DataSource from './DataSource';
import * as Domain from './Domain';
import * as Enums from './Enums';
import * as ExternalDataReference from './ExternalDataReference';
import * as ExternalTag from './ExternalTag';
import * as Feedback from './Feedback';
import * as Insights from './Insights';
import * as KenchiError from './KenchiError';
import * as Node from './Node';
import * as Notification from './Notification';
import * as Organization from './Organization';
import * as ProductChange from './ProductChange';
import * as Scalars from './Scalars';
import * as Shortcut from './Shortcut';
import * as Space from './Space';
import * as Tool from './Tool';
import * as Upload from './Upload';
import * as User from './User';
import * as UserDomainSettings from './UserDomainSettings';
import * as UserGroup from './UserGroup';
import * as UserItemSettings from './UserItemSettings';
import * as UserNotification from './UserNotification';
import * as VersionedNode from './VersionedNode';
import * as Viewer from './Viewer';
import * as Widget from './Widget';
import * as Workflow from './Workflow';

export function shouldMakeAdminSchema() {
  return isAdmin() || isDevelopment();
}

export default function makeKenchiSchema(generateArtifacts: boolean) {
  $settings({
    prismaClientContextField: 'db',
  });

  let admin: unknown[] = [];
  if (generateArtifacts || shouldMakeAdminSchema()) {
    admin = [
      ...Object.values(Admin),
      ...Object.values(AdminNode),
      ...Object.values(BulkUpdate),
      ...Object.values(DatabaseMigration),
      ...Object.values(DemoAccount),
      ...Object.values(AdminNotification),
      ...Object.values(PageSnapshot),
      ...Object.values(Queue),
      ...Object.values(ToolRunLog),
      ...Object.values(LoginAs),
    ];
  }

  return makeSchema({
    types: [
      ...Object.values(AuthSession),
      ...Object.values(Collection),
      ...Object.values(DataImport),
      ...Object.values(DataSource),
      ...Object.values(Domain),
      ...Object.values(Enums),
      ...Object.values(ExternalDataReference),
      ...Object.values(ExternalTag),
      ...Object.values(Feedback),
      ...Object.values(Insights),
      ...Object.values(KenchiError),
      ...Object.values(Node),
      ...Object.values(Notification),
      ...Object.values(Organization),
      ...Object.values(ProductChange),
      ...Object.values(Scalars),
      ...Object.values(Shortcut),
      ...Object.values(Space),
      ...Object.values(Tool),
      ...Object.values(Upload),
      ...Object.values(User),
      ...Object.values(UserDomainSettings),
      ...Object.values(UserGroup),
      ...Object.values(UserItemSettings),
      ...Object.values(UserNotification),
      ...Object.values(VersionedNode),
      ...Object.values(Viewer),
      ...Object.values(Widget),
      ...Object.values(Workflow),
      ...admin,
    ],
    shouldGenerateArtifacts: generateArtifacts,
    outputs: {
      schema: path.join(__dirname, '../../api.graphql'),
      typegen: path.join(
        __dirname,
        '../../node_modules/@types/nexus-typegen/index.d.ts'
      ),
    },
    nonNullDefaults: {
      output: true,
      input: false,
    },
    sourceTypes: {
      skipTypes: [
        'Query',
        'Mutation',
        'Subscription',
        /(.*?)Edge/,
        /(.*?)Connection/,
        /(.*?)Output/,
      ],
      modules: [
        {
          module: path.join(__dirname, './backingTypes.ts'),
          alias: 'backingTypes',
        },
        {
          module: require.resolve('prisma-client/index.d.ts'),
          alias: 'prisma',
        },
      ],
    },
    contextType: {
      module: path.join(__dirname, '../auth/contextType.ts'),
      export: 'Context',
    },
    plugins: [connectionPlugin({ disableBackwardPagination: true })],
  });
}

if (require.main === module) {
  const start = new Date().getTime();
  makeKenchiSchema(true);
  console.log(`Generated Nexus Schema in ${new Date().getTime() - start}ms`);
}
