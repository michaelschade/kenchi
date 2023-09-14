/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DataSourceOutput: any;
  DataSourceRequest: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  InsertionPath: KenchiGQL.InsertionPath;
  Json: any;
  SlateNodeArray: KenchiGQL.SlateNodeArray;
  ToolConfiguration: any;
  ToolInput: KenchiGQL.ToolInput;
  /** The `Upload` scalar type represents a file upload. */
  Upload: File;
  WidgetInput: KenchiGQL.WidgetInput;
};

export type Admin = {
  __typename: 'Admin';
  migrations: Array<DatabaseMigration>;
  nonOrgDomains: Maybe<DomainConnection>;
  nonOrgUsers: UserConnection;
  notificationStats: Maybe<NotificationStats>;
  organization: Maybe<Organization>;
  organizations: OrganizationConnection;
  pageSnapshots: PageSnapshotConnection;
  toolRunLogs: ToolRunLogConnection;
  unprocessedLogs: Array<UnprocessedLog>;
  user: Maybe<User>;
};


export type AdminNonOrgDomainsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type AdminNonOrgUsersArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type AdminNotificationStatsArgs = {
  id: Scalars['ID'];
};


export type AdminOrganizationArgs = {
  googleDomain?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  name?: InputMaybe<Scalars['String']>;
};


export type AdminOrganizationsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type AdminPageSnapshotsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type AdminToolRunLogsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type AdminUserArgs = {
  id: Scalars['ID'];
};

export type AdminNode = {
  id: Scalars['ID'];
};

export type AuthSession = Node & {
  __typename: 'AuthSession';
  expiresAt: Scalars['DateTime'];
  id: Scalars['ID'];
  type: AuthTypeEnum;
};

export enum AuthTypeEnum {
  loginAs = 'loginAs',
  user = 'user'
}

export type BaseUser = {
  disabledAt: Maybe<Scalars['DateTime']>;
  email: Maybe<Scalars['String']>;
  familyName: Maybe<Scalars['String']>;
  givenName: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Maybe<Scalars['String']>;
  organization: Organization;
  picture: Maybe<Scalars['String']>;
};

export type BaseUserConnection = {
  __typename: 'BaseUserConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<BaseUserEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type BaseUserEdge = {
  __typename: 'BaseUserEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: BaseUser;
};

export type BooleanOutput = {
  __typename: 'BooleanOutput';
  error: Maybe<KenchiError>;
  success: Scalars['Boolean'];
};

export enum BranchTypeEnum {
  draft = 'draft',
  published = 'published',
  suggestion = 'suggestion'
}

export type BulkUpdateFiltersInput = {
  collectionIds?: InputMaybe<Array<Scalars['String']>>;
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  onlyPublished?: InputMaybe<Scalars['Boolean']>;
  staticIds?: InputMaybe<Array<Scalars['String']>>;
};

export type BulkUpdateOutput = {
  __typename: 'BulkUpdateOutput';
  error: Maybe<KenchiError>;
  success: Scalars['Boolean'];
  updatesByType: Maybe<Scalars['Json']>;
};

export type BulkUpdateReplaceInput = {
  from: Scalars['String'];
  to: Scalars['String'];
};

export type BulkUpdateUpdatesInput = {
  collectionId?: InputMaybe<Scalars['ID']>;
  fixMissingChildren?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  lineBreakRemoval?: InputMaybe<Scalars['String']>;
  removeIntro?: InputMaybe<Scalars['Boolean']>;
  removeOutro?: InputMaybe<Scalars['Boolean']>;
  replace?: InputMaybe<Array<BulkUpdateReplaceInput>>;
};

export type Collection = Node & {
  __typename: 'Collection';
  acl: Array<CollectionAcl>;
  defaultPermissions: Array<CollectionPermissionEnum>;
  description: Scalars['String'];
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isPrivate: Scalars['Boolean'];
  name: Scalars['String'];
  organization: Maybe<Organization>;
  relatedTools: ToolLatestConnection;
  toolCount: Scalars['Int'];
  toolSuggestions: Maybe<ToolLatestConnection>;
  tools: CollectionTools_Connection;
  topUsedTools: ToolLatestConnection;
  unwrappedPermissions: Array<Scalars['String']>;
  workflowCount: Scalars['Int'];
  workflowSuggestions: Maybe<WorkflowLatestConnection>;
  workflows: CollectionWorkflows_Connection;
};


export type CollectionRelatedToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type CollectionToolSuggestionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type CollectionToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  knownCollectionIds?: InputMaybe<Array<Scalars['ID']>>;
  updatedSince?: InputMaybe<Scalars['DateTime']>;
};


export type CollectionTopUsedToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type CollectionWorkflowSuggestionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type CollectionWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  knownCollectionIds?: InputMaybe<Array<Scalars['ID']>>;
  updatedSince?: InputMaybe<Scalars['DateTime']>;
};

export type CollectionAcl = {
  __typename: 'CollectionAcl';
  collection: Collection;
  id: Scalars['ID'];
  permissions: Array<CollectionPermissionEnum>;
  user: Maybe<LimitedUser>;
  userGroup: Maybe<UserGroup>;
};

export type CollectionAclInput = {
  permissions: Array<CollectionPermissionEnum>;
  userGroupId?: InputMaybe<Scalars['ID']>;
  userId?: InputMaybe<Scalars['ID']>;
};

export type CollectionConnection = {
  __typename: 'CollectionConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<CollectionEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type CollectionEdge = {
  __typename: 'CollectionEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: Collection;
};

export type CollectionInput = {
  acl: Array<CollectionAclInput>;
  defaultPermissions?: InputMaybe<Array<CollectionPermissionEnum>>;
  description: Scalars['String'];
  icon?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

export type CollectionOutput = {
  __typename: 'CollectionOutput';
  collection: Maybe<Collection>;
  error: Maybe<KenchiError>;
};

export enum CollectionPermissionEnum {
  admin = 'admin',
  publisher = 'publisher',
  viewer = 'viewer'
}

export type CollectionTools_Connection = {
  __typename: 'CollectionTools_Connection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<ToolLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
  removed: Array<Scalars['String']>;
};

export type CollectionWorkflows_Connection = {
  __typename: 'CollectionWorkflows_Connection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<WorkflowLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
  removed: Array<Scalars['String']>;
};

export type CreateOrganizationOutput = {
  __typename: 'CreateOrganizationOutput';
  error: Maybe<KenchiError>;
  sharedCollection: Maybe<Collection>;
  viewer: Viewer;
};

export type DataImport = Node & {
  __typename: 'DataImport';
  completedAt: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  initialData: Scalars['Json'];
  startedAt: Maybe<Scalars['DateTime']>;
  state: Maybe<Scalars['Json']>;
  type: DataImportTypeEnum;
  updatedAt: Scalars['DateTime'];
};

export type DataImportOutput = {
  __typename: 'DataImportOutput';
  dataImport: Maybe<DataImport>;
  error: Maybe<KenchiError>;
};

export enum DataImportTypeEnum {
  csv = 'csv',
  intercom = 'intercom',
  textExpander = 'textExpander',
  zendesk = 'zendesk'
}

export type DataSource = {
  __typename: 'DataSource';
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  name: Scalars['String'];
  organization: Organization;
  outputs: Scalars['Json'];
  requests: Scalars['Json'];
};

export type DataSourceCreateInput = {
  id: Scalars['String'];
  name: Scalars['String'];
  outputs: Array<Scalars['DataSourceOutput']>;
  requests: Array<Scalars['DataSourceRequest']>;
};

export type DataSourceGraphqlOutput = {
  __typename: 'DataSourceGraphqlOutput';
  dataSource: Maybe<DataSource>;
  error: Maybe<KenchiError>;
};

export type DataSourceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
  outputs?: InputMaybe<Array<Scalars['DataSourceOutput']>>;
  requests?: InputMaybe<Array<Scalars['DataSourceRequest']>>;
};

export type DatabaseMigration = {
  __typename: 'DatabaseMigration';
  id: Scalars['String'];
  runOn: Maybe<Scalars['DateTime']>;
};

export type Domain = Node & {
  __typename: 'Domain';
  customPlacements: Maybe<Scalars['Json']>;
  defaultOpen: Maybe<Scalars['Boolean']>;
  defaultSide: Maybe<Scalars['String']>;
  hosts: Array<Scalars['String']>;
  id: Scalars['ID'];
  inject: Maybe<Scalars['Boolean']>;
  injectHud: Maybe<Scalars['Boolean']>;
  injectSidebar: Maybe<Scalars['Boolean']>;
  /** @deprecated Use insertionPath */
  insertTextXPath: Maybe<Scalars['String']>;
  insertionPath: Maybe<Scalars['InsertionPath']>;
  isGmail: Maybe<Scalars['Boolean']>;
  name: Maybe<Scalars['String']>;
  trackSession: Maybe<Scalars['Boolean']>;
  variableExtractors: Maybe<Scalars['Json']>;
};

export type DomainConnection = {
  __typename: 'DomainConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<DomainEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type DomainEdge = {
  __typename: 'DomainEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: Domain;
};

export type ExternalDataReference = {
  __typename: 'ExternalDataReference';
  id: Scalars['ID'];
  label: Scalars['String'];
  organization: Maybe<Organization>;
  referenceId: Scalars['String'];
  referenceSource: Scalars['String'];
  referenceType: ExternalReferenceTypeEnum;
};

export type ExternalDataReferenceCreateInput = {
  label: Scalars['String'];
  referenceId: Scalars['String'];
  referenceSource: Scalars['String'];
  referenceType: ExternalReferenceTypeEnum;
};

export type ExternalDataReferenceOutput = {
  __typename: 'ExternalDataReferenceOutput';
  error: Maybe<KenchiError>;
  externalDataReference: Maybe<ExternalDataReference>;
};

export type ExternalDataReferenceUpdateInput = {
  label?: InputMaybe<Scalars['String']>;
  referenceId?: InputMaybe<Scalars['String']>;
  referenceSource?: InputMaybe<Scalars['String']>;
  referenceType?: InputMaybe<ExternalReferenceTypeEnum>;
};

export enum ExternalReferenceTypeEnum {
  tag = 'tag'
}

export type ExternalTag = {
  __typename: 'ExternalTag';
  id: Scalars['String'];
  intercomId: Maybe<Scalars['String']>;
  label: Scalars['String'];
  organization: Organization;
};

export type ExternalTagInput = {
  intercomId?: InputMaybe<Scalars['String']>;
  label: Scalars['String'];
};

export type ExternalTagOutput = {
  __typename: 'ExternalTagOutput';
  error: Maybe<KenchiError>;
  tag: Maybe<ExternalTag>;
};

export type GroupMemberInput = {
  isManager: Scalars['Boolean'];
  userId: Scalars['ID'];
};

export enum InsightsObjectGroupingEnum {
  collectionId = 'collectionId',
  staticId = 'staticId'
}

export type InsightsOutput = {
  __typename: 'InsightsOutput';
  data: Maybe<Scalars['Json']>;
  error: Maybe<KenchiError>;
  latestData: Maybe<Scalars['DateTime']>;
};

export enum InsightsTypeEnum {
  ratings = 'ratings',
  ratingsDetails = 'ratingsDetails',
  toolUsage = 'toolUsage',
  workflowUsage = 'workflowUsage'
}

export type KenchiError = {
  __typename: 'KenchiError';
  code: KenchiErrorCode;
  message: Maybe<Scalars['String']>;
  param: Maybe<Scalars['String']>;
  type: KenchiErrorType;
};

export enum KenchiErrorCode {
  alreadyExists = 'alreadyExists',
  alreadyModified = 'alreadyModified',
  insufficientPermission = 'insufficientPermission',
  invalidValue = 'invalidValue',
  notFound = 'notFound',
  unauthenticated = 'unauthenticated'
}

export enum KenchiErrorType {
  authenticationError = 'authenticationError',
  conflictError = 'conflictError',
  validationError = 'validationError'
}

export type LatestNode = {
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  /** A timestamp field only for use by useList that we use to compute when we last did a useList sync. */
  lastListFetch: Scalars['DateTime'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  topUsage: LatestNodeTopUsage_Connection;
};


export type LatestNodeTopUsageArgs = {
  after?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};

export type LatestNodeTopUsage_Connection = {
  __typename: 'LatestNodeTopUsage_Connection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<LatestNodeTopUsage_Edge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type LatestNodeTopUsage_Edge = {
  __typename: 'LatestNodeTopUsage_Edge';
  count: Scalars['Int'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: LimitedUser;
};

export type LimitedCollection = Node & {
  __typename: 'LimitedCollection';
  description: Scalars['String'];
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  organization: Maybe<Organization>;
};

export type LimitedUser = BaseUser & Node & {
  __typename: 'LimitedUser';
  disabledAt: Maybe<Scalars['DateTime']>;
  email: Maybe<Scalars['String']>;
  familyName: Maybe<Scalars['String']>;
  givenName: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Maybe<Scalars['String']>;
  organization: Organization;
  picture: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename: 'Mutation';
  archiveCollection: CollectionOutput;
  archiveDataSource: DataSourceGraphqlOutput;
  archiveExternalDataReference: ExternalDataReferenceOutput;
  archiveExternalTag: ExternalTagOutput;
  archiveWidget: WidgetOutput;
  bulkUpdateTools: BulkUpdateOutput;
  bulkUpdateWorkflows: BulkUpdateOutput;
  createCollection: CollectionOutput;
  createDataImport: DataImportOutput;
  createDataSource: DataSourceGraphqlOutput;
  createExternalDataReference: ExternalDataReferenceOutput;
  createExternalTag: ExternalTagOutput;
  createGroup: UserGroupOutput;
  createOrganization: CreateOrganizationOutput;
  createSpace: SpaceOutput;
  createTool: ToolOutput;
  createUser: UserOutput;
  createWidget: WidgetOutput;
  createWorkflow: WorkflowOutput;
  deleteTool: ToolOutput;
  deleteWorkflow: WorkflowOutput;
  disableUser: UserOutput;
  /** Login or register via Google token */
  login: ViewerOutput;
  loginAs: ViewerOutput;
  logout: ViewerOutput;
  markUserNotifications: UserNotificationOutput;
  mergeTool: ToolOutput;
  mergeWorkflow: WorkflowOutput;
  notifyProductChange: Notification;
  queueBackfill: Scalars['Boolean'];
  queueConfigureSearchIndex: Scalars['Boolean'];
  queueReindexAll: Scalars['Boolean'];
  requeueUnprocessedLogs: Scalars['Int'];
  restoreTool: ToolOutput;
  restoreWorkflow: WorkflowOutput;
  sendPageSnapshot: Scalars['Boolean'];
  sendToolRunLog: Scalars['Boolean'];
  sendUserFeedback: Scalars['Boolean'];
  setShortcuts: SetShortcutsOutput;
  setUserDomainSettings: Maybe<UserDomainSettingsOutput>;
  setUserItemSettings: Maybe<UserItemSettingsOutput>;
  setupLoginAs: Scalars['String'];
  updateCollection: CollectionOutput;
  updateDataImport: DataImportOutput;
  updateDataSource: DataSourceGraphqlOutput;
  updateDemoAccount: Scalars['Boolean'];
  updateExternalDataReference: ExternalDataReferenceOutput;
  updateExternalTag: ExternalTagOutput;
  updateGroup: UserGroupOutput;
  updateGroupMember: UserGroupOutput;
  updateOrganization: OrganizationOutput;
  updateSpace: SpaceOutput;
  updateSubscription: UserSubscriptionOutput;
  updateTool: ToolOutput;
  updateUser: UserOutput;
  updateUserSettings: UserOutput;
  updateWidget: WidgetOutput;
  updateWorkflow: WorkflowOutput;
  upgradeDB: UpgradeDbOutput;
  uploadFile: UploadFile;
};


export type MutationArchiveCollectionArgs = {
  id: Scalars['ID'];
};


export type MutationArchiveDataSourceArgs = {
  id: Scalars['ID'];
};


export type MutationArchiveExternalDataReferenceArgs = {
  id: Scalars['ID'];
};


export type MutationArchiveExternalTagArgs = {
  id: Scalars['ID'];
};


export type MutationArchiveWidgetArgs = {
  id: Scalars['ID'];
};


export type MutationBulkUpdateToolsArgs = {
  dryRun: Scalars['Boolean'];
  filters: BulkUpdateFiltersInput;
  migrationReason: Scalars['String'];
  updates: BulkUpdateUpdatesInput;
};


export type MutationBulkUpdateWorkflowsArgs = {
  dryRun: Scalars['Boolean'];
  filters: BulkUpdateFiltersInput;
  migrationReason: Scalars['String'];
  updates: BulkUpdateUpdatesInput;
};


export type MutationCreateCollectionArgs = {
  collectionData: CollectionInput;
};


export type MutationCreateDataImportArgs = {
  initialData: Scalars['Json'];
  type: DataImportTypeEnum;
};


export type MutationCreateDataSourceArgs = {
  data: DataSourceCreateInput;
};


export type MutationCreateExternalDataReferenceArgs = {
  data: ExternalDataReferenceCreateInput;
};


export type MutationCreateExternalTagArgs = {
  tagData: ExternalTagInput;
};


export type MutationCreateGroupArgs = {
  name: Scalars['String'];
  upsertMembers?: InputMaybe<Array<GroupMemberInput>>;
};


export type MutationCreateSpaceArgs = {
  spaceData: SpaceCreateInput;
};


export type MutationCreateToolArgs = {
  toolData: ToolCreateInput;
};


export type MutationCreateUserArgs = {
  email: Scalars['String'];
  groupIds?: InputMaybe<Array<Scalars['ID']>>;
  isOrganizationAdmin?: InputMaybe<Scalars['Boolean']>;
};


export type MutationCreateWidgetArgs = {
  data: WidgetCreateInput;
};


export type MutationCreateWorkflowArgs = {
  workflowData: WorkflowCreateInput;
};


export type MutationDeleteToolArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteWorkflowArgs = {
  id: Scalars['ID'];
};


export type MutationDisableUserArgs = {
  id: Scalars['ID'];
};


export type MutationLoginArgs = {
  token: Scalars['String'];
};


export type MutationLoginAsArgs = {
  sessionId?: InputMaybe<Scalars['String']>;
};


export type MutationMarkUserNotificationsArgs = {
  staticId?: InputMaybe<Scalars['String']>;
  types?: InputMaybe<Array<NotificationTypeEnum>>;
  userNotificationIds?: InputMaybe<Array<Scalars['ID']>>;
  viewed: Scalars['Boolean'];
};


export type MutationMergeToolArgs = {
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
  toolData: ToolUpdateInput;
};


export type MutationMergeWorkflowArgs = {
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
  workflowData: WorkflowUpdateInput;
};


export type MutationNotifyProductChangeArgs = {
  id: Scalars['ID'];
};


export type MutationQueueBackfillArgs = {
  end: Scalars['Int'];
  start: Scalars['Int'];
};


export type MutationRequeueUnprocessedLogsArgs = {
  day: Scalars['DateTime'];
};


export type MutationRestoreToolArgs = {
  id: Scalars['ID'];
};


export type MutationRestoreWorkflowArgs = {
  id: Scalars['ID'];
};


export type MutationSendPageSnapshotArgs = {
  snapshot: Scalars['Json'];
};


export type MutationSendToolRunLogArgs = {
  log: Scalars['Json'];
  toolId: Scalars['ID'];
};


export type MutationSendUserFeedbackArgs = {
  feedback: Scalars['String'];
  path: Scalars['String'];
  prompt: Scalars['String'];
};


export type MutationSetShortcutsArgs = {
  orgShortcut?: InputMaybe<Scalars['String']>;
  staticId: Scalars['String'];
  userShortcut?: InputMaybe<Scalars['String']>;
};


export type MutationSetUserDomainSettingsArgs = {
  userDomainSettingsData: UserDomainSettingsInput;
};


export type MutationSetUserItemSettingsArgs = {
  data: Scalars['Json'];
  staticId: Scalars['String'];
};


export type MutationSetupLoginAsArgs = {
  organizationId?: InputMaybe<Scalars['ID']>;
  userId?: InputMaybe<Scalars['ID']>;
};


export type MutationUpdateCollectionArgs = {
  collectionData: CollectionInput;
  id: Scalars['ID'];
};


export type MutationUpdateDataImportArgs = {
  id: Scalars['ID'];
  isComplete: Scalars['Boolean'];
  state?: InputMaybe<Scalars['Json']>;
};


export type MutationUpdateDataSourceArgs = {
  data: DataSourceUpdateInput;
  id: Scalars['ID'];
};


export type MutationUpdateDemoAccountArgs = {
  from: Scalars['DateTime'];
};


export type MutationUpdateExternalDataReferenceArgs = {
  data: ExternalDataReferenceUpdateInput;
  id: Scalars['ID'];
};


export type MutationUpdateExternalTagArgs = {
  id: Scalars['ID'];
  tagData: ExternalTagInput;
};


export type MutationUpdateGroupArgs = {
  id: Scalars['ID'];
  name: Scalars['String'];
  removeMembers?: InputMaybe<Array<Scalars['ID']>>;
  upsertMembers?: InputMaybe<Array<GroupMemberInput>>;
};


export type MutationUpdateGroupMemberArgs = {
  groupId: Scalars['ID'];
  manager?: InputMaybe<Scalars['Boolean']>;
  remove: Scalars['Boolean'];
  userId: Scalars['ID'];
};


export type MutationUpdateOrganizationArgs = {
  collectionsToShare?: InputMaybe<Array<Scalars['ID']>>;
  intercomCode?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  useGoogleDomain?: InputMaybe<Scalars['Boolean']>;
};


export type MutationUpdateSpaceArgs = {
  id: Scalars['ID'];
  spaceData: SpaceUpdateInput;
};


export type MutationUpdateSubscriptionArgs = {
  staticId: Scalars['String'];
  subscribed: Scalars['Boolean'];
};


export type MutationUpdateToolArgs = {
  id: Scalars['ID'];
  toolData: ToolUpdateInput;
};


export type MutationUpdateUserArgs = {
  groupId?: InputMaybe<Scalars['ID']>;
  groupIds?: InputMaybe<Array<Scalars['ID']>>;
  id: Scalars['ID'];
  isOrganizationAdmin?: InputMaybe<Scalars['Boolean']>;
};


export type MutationUpdateUserSettingsArgs = {
  wantsEditSuggestionEmails?: InputMaybe<Scalars['Boolean']>;
};


export type MutationUpdateWidgetArgs = {
  data: WidgetUpdateInput;
  id: Scalars['ID'];
};


export type MutationUpdateWorkflowArgs = {
  id: Scalars['ID'];
  workflowData: WorkflowUpdateInput;
};


export type MutationUploadFileArgs = {
  file?: InputMaybe<Scalars['Upload']>;
  url?: InputMaybe<Scalars['String']>;
};

export type Node = {
  id: Scalars['ID'];
};

export type Notification = {
  __typename: 'Notification';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  relatedNode: Maybe<Node>;
  type: NotificationTypeEnum;
};

export type NotificationStats = {
  __typename: 'NotificationStats';
  created: Scalars['Int'];
  dismissed: Scalars['Int'];
  viewed: Scalars['Int'];
};

export enum NotificationTypeEnum {
  create_org_prompt = 'create_org_prompt',
  new_user_welcome = 'new_user_welcome',
  product_major_change = 'product_major_change',
  tool_archived = 'tool_archived',
  tool_created = 'tool_created',
  tool_major_change = 'tool_major_change',
  workflow_archived = 'workflow_archived',
  workflow_created = 'workflow_created',
  workflow_major_change = 'workflow_major_change'
}

export type Organization = Node & {
  __typename: 'Organization';
  additionalGoogleDomains: Array<Scalars['String']>;
  collections: CollectionConnection;
  dataSources: Array<DataSource>;
  defaultSpaceWidgets: Maybe<Scalars['Json']>;
  /** @deprecated Now a map, need to expose something new */
  defaultUserGroup: Maybe<UserGroup>;
  disabledMessage: Maybe<Scalars['String']>;
  domains: DomainConnection;
  externalDataReferences: Array<ExternalDataReference>;
  /** @deprecated Transition to externalDataReferences */
  externalTags: Array<ExternalTag>;
  googleDomain: Maybe<Scalars['String']>;
  hasIntercomAccessToken: Scalars['Boolean'];
  id: Scalars['ID'];
  name: Maybe<Scalars['String']>;
  shadowRecord: Scalars['Boolean'];
  shortcuts: Array<Shortcut>;
  tools: ToolLatestConnection;
  updatedAt: Scalars['DateTime'];
  userGroups: UserGroupConnection;
  users: BaseUserConnection;
  workflows: WorkflowLatestConnection;
};


export type OrganizationCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type OrganizationDomainsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type OrganizationExternalDataReferencesArgs = {
  referenceSource: Scalars['String'];
  referenceType: ExternalReferenceTypeEnum;
};


export type OrganizationToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  updatedSince?: InputMaybe<Scalars['DateTime']>;
};


export type OrganizationUserGroupsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type OrganizationUsersArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  includeDisabled?: InputMaybe<Scalars['Boolean']>;
};


export type OrganizationWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  updatedSince?: InputMaybe<Scalars['DateTime']>;
};

export type OrganizationConnection = {
  __typename: 'OrganizationConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<OrganizationEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type OrganizationEdge = {
  __typename: 'OrganizationEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: Organization;
};

export type OrganizationOutput = {
  __typename: 'OrganizationOutput';
  error: Maybe<KenchiError>;
  organization: Maybe<Organization>;
};

/** PageInfo cursor, as defined in https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
export type PageInfo = {
  __typename: 'PageInfo';
  /** The cursor corresponding to the last nodes in edges. Null if the connection is empty. */
  endCursor: Maybe<Scalars['String']>;
  /** Used to indicate whether more edges exist following the set defined by the clients arguments. */
  hasNextPage: Scalars['Boolean'];
  /** Used to indicate whether more edges exist prior to the set defined by the clients arguments. */
  hasPreviousPage: Scalars['Boolean'];
  /** The cursor corresponding to the first nodes in edges. Null if the connection is empty. */
  startCursor: Maybe<Scalars['String']>;
};

export type PageSnapshot = AdminNode & {
  __typename: 'PageSnapshot';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  snapshot: Scalars['Json'];
  user: Maybe<User>;
};

export type PageSnapshotConnection = {
  __typename: 'PageSnapshotConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<PageSnapshotEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type PageSnapshotEdge = {
  __typename: 'PageSnapshotEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: PageSnapshot;
};

export type ProductChange = Node & {
  __typename: 'ProductChange';
  createdAt: Scalars['DateTime'];
  description: Scalars['SlateNodeArray'];
  id: Scalars['ID'];
  isMajor: Scalars['Boolean'];
  notification: Maybe<Notification>;
  title: Scalars['String'];
};

export type ProductChangeConnection = {
  __typename: 'ProductChangeConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<ProductChangeEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type ProductChangeEdge = {
  __typename: 'ProductChangeEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: ProductChange;
};

export type Query = {
  __typename: 'Query';
  admin: Maybe<Admin>;
  adminNode: Maybe<AdminNode>;
  insights: InsightsOutput;
  insightsRatingDetails: InsightsOutput;
  node: Maybe<Node>;
  versionedNode: Maybe<LatestNode>;
  viewer: Viewer;
};


export type QueryAdminNodeArgs = {
  id: Scalars['ID'];
};


export type QueryInsightsArgs = {
  collectionIds?: InputMaybe<Array<Scalars['ID']>>;
  endDate?: InputMaybe<Scalars['String']>;
  objectGrouping?: InputMaybe<InsightsObjectGroupingEnum>;
  startDate?: InputMaybe<Scalars['String']>;
  staticIds?: InputMaybe<Array<Scalars['ID']>>;
  type: InsightsTypeEnum;
};


export type QueryInsightsRatingDetailsArgs = {
  collectionIds?: InputMaybe<Array<Scalars['ID']>>;
  endDate?: InputMaybe<Scalars['String']>;
  startDate?: InputMaybe<Scalars['String']>;
  staticIds?: InputMaybe<Array<Scalars['ID']>>;
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};


export type QueryVersionedNodeArgs = {
  staticId: Scalars['String'];
};

export type SearchConfig = {
  __typename: 'SearchConfig';
  apiKey: Scalars['String'];
  apiKeyExpiration: Scalars['DateTime'];
  appId: Scalars['String'];
  indexName: Scalars['String'];
  lastUpdated: Scalars['DateTime'];
  shouldUseAlgolia: Scalars['Boolean'];
};

export type SetShortcutsOutput = {
  __typename: 'SetShortcutsOutput';
  error: Maybe<KenchiError>;
  orgShortcut: Maybe<Shortcut>;
  userShortcut: Maybe<Shortcut>;
};

export type Shortcut = {
  __typename: 'Shortcut';
  id: Scalars['ID'];
  latestNode: Maybe<LatestNode>;
  orgWide: Scalars['Boolean'];
  organization: Maybe<Organization>;
  shortcut: Maybe<Scalars['String']>;
  staticId: Scalars['String'];
  user: Maybe<LimitedUser>;
};

export type Space = {
  acl: Array<SpaceAcl>;
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<SpaceRevisionConnection>;
  branchedFrom: Maybe<SpaceRevision>;
  branches: SpaceLatestConnection;
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<SpaceRevision>;
  publishedVersions: SpaceRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  visibleToOrg: Scalars['Boolean'];
  widgets: Scalars['Json'];
};


export type SpaceBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type SpaceBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type SpacePublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};

export type SpaceAcl = {
  __typename: 'SpaceAcl';
  id: Scalars['ID'];
  staticId: Scalars['String'];
  user: Maybe<LimitedUser>;
  userGroup: Maybe<UserGroup>;
};

export type SpaceCreateInput = {
  name: Scalars['String'];
  visibleToGroupIds: Array<Scalars['ID']>;
  visibleToOrg: Scalars['Boolean'];
  widgets: Array<Scalars['Json']>;
};

export type SpaceLatest = LatestNode & Node & Space & VersionedNode & {
  __typename: 'SpaceLatest';
  acl: Array<SpaceAcl>;
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<SpaceRevisionConnection>;
  branchedFrom: Maybe<SpaceRevision>;
  branches: SpaceLatestConnection;
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  /** A timestamp field only for use by useList that we use to compute when we last did a useList sync. */
  lastListFetch: Scalars['DateTime'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<SpaceRevision>;
  publishedVersions: SpaceRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  topUsage: LatestNodeTopUsage_Connection;
  visibleToOrg: Scalars['Boolean'];
  widgets: Scalars['Json'];
};


export type SpaceLatestBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type SpaceLatestBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type SpaceLatestPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type SpaceLatestTopUsageArgs = {
  after?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};

export type SpaceLatestConnection = {
  __typename: 'SpaceLatestConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<SpaceLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type SpaceLatestEdge = {
  __typename: 'SpaceLatestEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: SpaceLatest;
};

export type SpaceOutput = {
  __typename: 'SpaceOutput';
  error: Maybe<KenchiError>;
  space: Maybe<SpaceLatest>;
};

export type SpaceRevision = Node & Space & VersionedNode & {
  __typename: 'SpaceRevision';
  acl: Array<SpaceAcl>;
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<SpaceRevisionConnection>;
  branchedFrom: Maybe<SpaceRevision>;
  branches: SpaceLatestConnection;
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<SpaceRevision>;
  publishedVersions: SpaceRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  visibleToOrg: Scalars['Boolean'];
  widgets: Scalars['Json'];
};


export type SpaceRevisionBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type SpaceRevisionBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type SpaceRevisionPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};

export type SpaceRevisionConnection = {
  __typename: 'SpaceRevisionConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<SpaceRevisionEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type SpaceRevisionEdge = {
  __typename: 'SpaceRevisionEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: SpaceRevision;
};

export type SpaceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
  visibleToGroupIds?: InputMaybe<Array<Scalars['ID']>>;
  visibleToOrg?: InputMaybe<Scalars['Boolean']>;
  widgets?: InputMaybe<Array<Scalars['Json']>>;
};

export type Tool = {
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<ToolRevisionConnection>;
  branchedFrom: Maybe<ToolRevision>;
  branches: ToolLatestConnection;
  collection: Collection;
  /** Collections where this tool is used */
  collections: CollectionConnection;
  component: Scalars['String'];
  configuration: Scalars['ToolConfiguration'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  inputs: Array<Scalars['ToolInput']>;
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<ToolRevision>;
  publishedVersions: ToolRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  workflows: WorkflowLatestConnection;
};


export type ToolBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type ToolCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type ToolPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type ToolCreateInput = {
  branchType: BranchTypeEnum;
  collectionId: Scalars['String'];
  component: Scalars['String'];
  configuration: Scalars['ToolConfiguration'];
  description: Scalars['String'];
  icon?: InputMaybe<Scalars['String']>;
  inputs: Array<Scalars['ToolInput']>;
  keywords: Array<Scalars['String']>;
  majorChangeDescription?: InputMaybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
};

export type ToolLatest = LatestNode & Node & Tool & VersionedNode & {
  __typename: 'ToolLatest';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<ToolRevisionConnection>;
  branchedFrom: Maybe<ToolRevision>;
  branches: ToolLatestConnection;
  collection: Collection;
  /** Collections where this tool is used */
  collections: CollectionConnection;
  component: Scalars['String'];
  configuration: Scalars['ToolConfiguration'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  inputs: Array<Scalars['ToolInput']>;
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  /** A timestamp field only for use by useList that we use to compute when we last did a useList sync. */
  lastListFetch: Scalars['DateTime'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<ToolRevision>;
  publishedVersions: ToolRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  topUsage: LatestNodeTopUsage_Connection;
  workflows: WorkflowLatestConnection;
};


export type ToolLatestBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolLatestBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type ToolLatestCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type ToolLatestPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolLatestTopUsageArgs = {
  after?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};


export type ToolLatestWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type ToolLatestConnection = {
  __typename: 'ToolLatestConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<ToolLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type ToolLatestEdge = {
  __typename: 'ToolLatestEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: ToolLatest;
};

export type ToolOutput = {
  __typename: 'ToolOutput';
  error: Maybe<KenchiError>;
  tool: Maybe<ToolLatest>;
};

export type ToolRevision = Node & Tool & VersionedNode & {
  __typename: 'ToolRevision';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<ToolRevisionConnection>;
  branchedFrom: Maybe<ToolRevision>;
  branches: ToolLatestConnection;
  collection: Collection;
  /** Collections where this tool is used */
  collections: CollectionConnection;
  component: Scalars['String'];
  configuration: Scalars['ToolConfiguration'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  inputs: Array<Scalars['ToolInput']>;
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<ToolRevision>;
  publishedVersions: ToolRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  workflows: WorkflowLatestConnection;
};


export type ToolRevisionBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolRevisionBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type ToolRevisionCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type ToolRevisionPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type ToolRevisionWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type ToolRevisionConnection = {
  __typename: 'ToolRevisionConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<ToolRevisionEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type ToolRevisionEdge = {
  __typename: 'ToolRevisionEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: ToolRevision;
};

export type ToolRunLog = AdminNode & {
  __typename: 'ToolRunLog';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  log: Scalars['Json'];
  tool: Maybe<ToolRevision>;
  user: Maybe<User>;
};

export type ToolRunLogConnection = {
  __typename: 'ToolRunLogConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<ToolRunLogEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type ToolRunLogEdge = {
  __typename: 'ToolRunLogEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: ToolRunLog;
};

export type ToolUpdateInput = {
  branchType?: InputMaybe<BranchTypeEnum>;
  collectionId?: InputMaybe<Scalars['String']>;
  component?: InputMaybe<Scalars['String']>;
  configuration?: InputMaybe<Scalars['ToolConfiguration']>;
  description?: InputMaybe<Scalars['String']>;
  icon?: InputMaybe<Scalars['String']>;
  inputs?: InputMaybe<Array<Scalars['ToolInput']>>;
  keywords?: InputMaybe<Array<Scalars['String']>>;
  majorChangeDescription?: InputMaybe<Scalars['SlateNodeArray']>;
  name?: InputMaybe<Scalars['String']>;
};

export type UnprocessedLog = {
  __typename: 'UnprocessedLog';
  count: Scalars['Int'];
  day: Scalars['DateTime'];
};

export type UploadFile = {
  __typename: 'UploadFile';
  error: Maybe<KenchiError>;
  url: Maybe<Scalars['String']>;
};

export type User = BaseUser & Node & {
  __typename: 'User';
  collections: CollectionConnection;
  disabledAt: Maybe<Scalars['DateTime']>;
  domainSettings: UserDomainSettingsConnection;
  draftTools: ToolLatestConnection;
  draftWorkflows: WorkflowLatestConnection;
  email: Maybe<Scalars['String']>;
  familyName: Maybe<Scalars['String']>;
  givenName: Maybe<Scalars['String']>;
  groups: Array<UserGroup>;
  hasTool: Scalars['Boolean'];
  hasWorkflow: Scalars['Boolean'];
  id: Scalars['ID'];
  magicItemSettings: UserItemSettingsConnection;
  majorToolChanges: ToolRevisionConnection;
  majorWorkflowChanges: WorkflowRevisionConnection;
  name: Maybe<Scalars['String']>;
  notifications: UserNotificationConnection;
  organization: Organization;
  organizationPermissions: Array<Scalars['String']>;
  picture: Maybe<Scalars['String']>;
  potentialGoogleDomain: Maybe<Scalars['String']>;
  shortcuts: Array<Shortcut>;
  spaces: SpaceLatestConnection;
  topUsedToolStaticIds: Array<Scalars['String']>;
  topUsedTools: ToolLatestConnection;
  topViewedWorkflowStaticIds: Array<Scalars['String']>;
  wantsEditSuggestionEmails: Scalars['Boolean'];
};


export type UserCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserDomainSettingsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserDraftToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserDraftWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserMagicItemSettingsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserMajorToolChangesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserMajorWorkflowChangesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserNotificationsArgs = {
  active?: InputMaybe<Scalars['Boolean']>;
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  staticId?: InputMaybe<Scalars['String']>;
};


export type UserSpacesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type UserTopUsedToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type UserConnection = {
  __typename: 'UserConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserDomainSettings = Node & {
  __typename: 'UserDomainSettings';
  domain: Domain;
  id: Scalars['ID'];
  injectHud: Maybe<Scalars['Boolean']>;
  open: Maybe<Scalars['Boolean']>;
  side: Maybe<Scalars['String']>;
};

export type UserDomainSettingsConnection = {
  __typename: 'UserDomainSettingsConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserDomainSettingsEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserDomainSettingsEdge = {
  __typename: 'UserDomainSettingsEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: UserDomainSettings;
};

export type UserDomainSettingsInput = {
  host: Scalars['String'];
  open?: InputMaybe<Scalars['Boolean']>;
  side?: InputMaybe<Scalars['String']>;
};

export type UserDomainSettingsOutput = {
  __typename: 'UserDomainSettingsOutput';
  userDomainSettings: UserDomainSettings;
};

export type UserEdge = {
  __typename: 'UserEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: User;
};

export type UserGroup = Node & {
  __typename: 'UserGroup';
  id: Scalars['ID'];
  isManager: Maybe<Scalars['Boolean']>;
  members: UserGroupMembers_Connection;
  name: Scalars['String'];
  organization: Organization;
};


export type UserGroupMembersArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type UserGroupConnection = {
  __typename: 'UserGroupConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserGroupEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserGroupEdge = {
  __typename: 'UserGroupEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: UserGroup;
};

export type UserGroupMembers_Connection = {
  __typename: 'UserGroupMembers_Connection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserGroupMembers_Edge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserGroupMembers_Edge = {
  __typename: 'UserGroupMembers_Edge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  isManager: Scalars['Boolean'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: BaseUser;
};

export type UserGroupOutput = {
  __typename: 'UserGroupOutput';
  error: Maybe<KenchiError>;
  group: Maybe<UserGroup>;
};

export type UserItemSettings = {
  __typename: 'UserItemSettings';
  data: Scalars['Json'];
  staticId: Scalars['String'];
};

export type UserItemSettingsConnection = {
  __typename: 'UserItemSettingsConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserItemSettingsEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserItemSettingsEdge = {
  __typename: 'UserItemSettingsEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: UserItemSettings;
};

export type UserItemSettingsOutput = {
  __typename: 'UserItemSettingsOutput';
  error: Maybe<KenchiError>;
  userItemSettings: Maybe<UserItemSettings>;
};

export type UserNotification = {
  __typename: 'UserNotification';
  createdAt: Scalars['DateTime'];
  dismissedAt: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  notification: Notification;
  viewedAt: Maybe<Scalars['DateTime']>;
};

export type UserNotificationConnection = {
  __typename: 'UserNotificationConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<UserNotificationEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type UserNotificationEdge = {
  __typename: 'UserNotificationEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: UserNotification;
};

export type UserNotificationOutput = {
  __typename: 'UserNotificationOutput';
  error: Maybe<KenchiError>;
  userNotifications: Maybe<Array<UserNotification>>;
};

export type UserOutput = {
  __typename: 'UserOutput';
  error: Maybe<KenchiError>;
  user: Maybe<User>;
};

export type UserSubscriptionOutput = {
  __typename: 'UserSubscriptionOutput';
  error: Maybe<KenchiError>;
  versionedNode: Maybe<VersionedNode>;
};

export type VersionedNode = {
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
};

export type Viewer = {
  __typename: 'Viewer';
  csrfToken: Scalars['String'];
  defaultDomains: DomainConnection;
  installUrl: Maybe<Scalars['String']>;
  organization: Maybe<Organization>;
  productChanges: ProductChangeConnection;
  searchConfig: Maybe<SearchConfig>;
  session: Maybe<AuthSession>;
  /** @deprecated Duh */
  trigger500: Scalars['Boolean'];
  /** @deprecated Duh */
  triggerAsync500: Scalars['Boolean'];
  uninstallUrl: Maybe<Scalars['String']>;
  user: Maybe<User>;
};


export type ViewerDefaultDomainsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type ViewerInstallUrlArgs = {
  previousVersion?: InputMaybe<Scalars['String']>;
  reason?: InputMaybe<Scalars['String']>;
  version?: InputMaybe<Scalars['String']>;
};


export type ViewerProductChangesArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type ViewerUninstallUrlArgs = {
  version?: InputMaybe<Scalars['String']>;
};

export type ViewerOutput = {
  __typename: 'ViewerOutput';
  error: Maybe<KenchiError>;
  viewer: Viewer;
};

export type Widget = {
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WidgetRevisionConnection>;
  branchedFrom: Maybe<WidgetRevision>;
  branches: WidgetLatestConnection;
  contents: Scalars['Json'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  inputs: Scalars['Json'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  previousVersion: Maybe<WidgetRevision>;
  publishedVersions: WidgetRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
};


export type WidgetBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WidgetBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WidgetPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};

export type WidgetCreateInput = {
  contents: Scalars['SlateNodeArray'];
  inputs?: InputMaybe<Array<Scalars['WidgetInput']>>;
};

export type WidgetLatest = LatestNode & Node & VersionedNode & Widget & {
  __typename: 'WidgetLatest';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WidgetRevisionConnection>;
  branchedFrom: Maybe<WidgetRevision>;
  branches: WidgetLatestConnection;
  contents: Scalars['Json'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  inputs: Scalars['Json'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  /** A timestamp field only for use by useList that we use to compute when we last did a useList sync. */
  lastListFetch: Scalars['DateTime'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  previousVersion: Maybe<WidgetRevision>;
  publishedVersions: WidgetRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  topUsage: LatestNodeTopUsage_Connection;
};


export type WidgetLatestBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WidgetLatestBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WidgetLatestPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WidgetLatestTopUsageArgs = {
  after?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};

export type WidgetLatestConnection = {
  __typename: 'WidgetLatestConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<WidgetLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type WidgetLatestEdge = {
  __typename: 'WidgetLatestEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: WidgetLatest;
};

export type WidgetOutput = {
  __typename: 'WidgetOutput';
  error: Maybe<KenchiError>;
  widget: Maybe<WidgetLatest>;
};

export type WidgetRevision = Node & VersionedNode & Widget & {
  __typename: 'WidgetRevision';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WidgetRevisionConnection>;
  branchedFrom: Maybe<WidgetRevision>;
  branches: WidgetLatestConnection;
  contents: Scalars['Json'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  inputs: Scalars['Json'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  previousVersion: Maybe<WidgetRevision>;
  publishedVersions: WidgetRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
};


export type WidgetRevisionBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WidgetRevisionBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WidgetRevisionPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};

export type WidgetRevisionConnection = {
  __typename: 'WidgetRevisionConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<WidgetRevisionEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type WidgetRevisionEdge = {
  __typename: 'WidgetRevisionEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: WidgetRevision;
};

export type WidgetUpdateInput = {
  contents?: InputMaybe<Scalars['Json']>;
  inputs?: InputMaybe<Array<Scalars['WidgetInput']>>;
};

export type Workflow = {
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WorkflowRevisionConnection>;
  branchedFrom: Maybe<WorkflowRevision>;
  branches: WorkflowLatestConnection;
  collection: Collection;
  contents: Scalars['SlateNodeArray'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  embeddedInWorkflows: WorkflowLatestConnection;
  embedsWorkflows: WorkflowLatestConnection;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  linksFromWorkflows: WorkflowLatestConnection;
  linksToWorkflows: WorkflowLatestConnection;
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<WorkflowRevision>;
  publishedVersions: WorkflowRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  tools: ToolLatestConnection;
};


export type WorkflowBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WorkflowEmbeddedInWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowEmbedsWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLinksFromWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLinksToWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type WorkflowCreateInput = {
  branchType: BranchTypeEnum;
  collectionId: Scalars['String'];
  contents: Scalars['SlateNodeArray'];
  description: Scalars['String'];
  icon?: InputMaybe<Scalars['String']>;
  keywords: Array<Scalars['String']>;
  majorChangeDescription?: InputMaybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
};

export type WorkflowLatest = LatestNode & Node & VersionedNode & Workflow & {
  __typename: 'WorkflowLatest';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WorkflowRevisionConnection>;
  branchedFrom: Maybe<WorkflowRevision>;
  branches: WorkflowLatestConnection;
  collection: Collection;
  contents: Scalars['SlateNodeArray'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  embeddedInWorkflows: WorkflowLatestConnection;
  embedsWorkflows: WorkflowLatestConnection;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  /** A timestamp field only for use by useList that we use to compute when we last did a useList sync. */
  lastListFetch: Scalars['DateTime'];
  linksFromWorkflows: WorkflowLatestConnection;
  linksToWorkflows: WorkflowLatestConnection;
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<WorkflowRevision>;
  publishedVersions: WorkflowRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  tools: ToolLatestConnection;
  topUsage: LatestNodeTopUsage_Connection;
};


export type WorkflowLatestBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowLatestBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WorkflowLatestEmbeddedInWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLatestEmbedsWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLatestLinksFromWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLatestLinksToWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLatestPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowLatestToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowLatestTopUsageArgs = {
  after?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  startDate?: InputMaybe<Scalars['String']>;
};

export type WorkflowLatestConnection = {
  __typename: 'WorkflowLatestConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<WorkflowLatestEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type WorkflowLatestEdge = {
  __typename: 'WorkflowLatestEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: WorkflowLatest;
};

export type WorkflowOutput = {
  __typename: 'WorkflowOutput';
  error: Maybe<KenchiError>;
  workflow: Maybe<WorkflowLatest>;
};

export type WorkflowRevision = Node & VersionedNode & Workflow & {
  __typename: 'WorkflowRevision';
  archiveReason: Maybe<Scalars['String']>;
  branchId: Maybe<Scalars['String']>;
  branchType: BranchTypeEnum;
  branchVersions: Maybe<WorkflowRevisionConnection>;
  branchedFrom: Maybe<WorkflowRevision>;
  branches: WorkflowLatestConnection;
  collection: Collection;
  contents: Scalars['SlateNodeArray'];
  createdAt: Scalars['DateTime'];
  createdByUser: LimitedUser;
  description: Scalars['String'];
  embeddedInWorkflows: WorkflowLatestConnection;
  embedsWorkflows: WorkflowLatestConnection;
  hasActiveNotifications: Maybe<Scalars['Boolean']>;
  icon: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isArchived: Scalars['Boolean'];
  isFirst: Scalars['Boolean'];
  isLatest: Scalars['Boolean'];
  keywords: Array<Scalars['String']>;
  linksFromWorkflows: WorkflowLatestConnection;
  linksToWorkflows: WorkflowLatestConnection;
  majorChangeDescription: Maybe<Scalars['SlateNodeArray']>;
  name: Scalars['String'];
  previousVersion: Maybe<WorkflowRevision>;
  publishedVersions: WorkflowRevisionConnection;
  settings: Maybe<UserItemSettings>;
  shortcuts: Maybe<Array<Shortcut>>;
  staticId: Scalars['String'];
  subscribed: Maybe<Scalars['Boolean']>;
  suggestedByUser: Maybe<LimitedUser>;
  tools: ToolLatestConnection;
};


export type WorkflowRevisionBranchVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowRevisionBranchesArgs = {
  after?: InputMaybe<Scalars['String']>;
  branchType?: InputMaybe<BranchTypeEnum>;
  createdByMe?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
};


export type WorkflowRevisionEmbeddedInWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowRevisionEmbedsWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowRevisionLinksFromWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowRevisionLinksToWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};


export type WorkflowRevisionPublishedVersionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
  onlyMajor?: InputMaybe<Scalars['Boolean']>;
};


export type WorkflowRevisionToolsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first: Scalars['Int'];
};

export type WorkflowRevisionConnection = {
  __typename: 'WorkflowRevisionConnection';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types */
  edges: Array<WorkflowRevisionEdge>;
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo */
  pageInfo: PageInfo;
};

export type WorkflowRevisionEdge = {
  __typename: 'WorkflowRevisionEdge';
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor */
  cursor: Scalars['String'];
  /** https://facebook.github.io/relay/graphql/connections.htm#sec-Node */
  node: WorkflowRevision;
};

export type WorkflowUpdateInput = {
  branchType?: InputMaybe<BranchTypeEnum>;
  collectionId?: InputMaybe<Scalars['String']>;
  contents?: InputMaybe<Scalars['SlateNodeArray']>;
  description?: InputMaybe<Scalars['String']>;
  icon?: InputMaybe<Scalars['String']>;
  keywords?: InputMaybe<Array<Scalars['String']>>;
  majorChangeDescription?: InputMaybe<Scalars['SlateNodeArray']>;
  name?: InputMaybe<Scalars['String']>;
};

export type UpgradeDbOutput = {
  __typename: 'upgradeDBOutput';
  stderr: Scalars['String'];
  stdout: Scalars['String'];
};

export type BackgroundDomainSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type BackgroundDomainSettingsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', defaultDomains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, hosts: Array<string>, inject: boolean | null, injectHud: boolean | null, injectSidebar: boolean | null, isGmail: boolean | null, defaultOpen: boolean | null, trackSession: boolean | null } }> }, user: { __typename: 'User', id: string, email: string | null, domainSettings: { __typename: 'UserDomainSettingsConnection', edges: Array<{ __typename: 'UserDomainSettingsEdge', node: { __typename: 'UserDomainSettings', id: string, open: boolean | null, injectHud: boolean | null, domain: { __typename: 'Domain', id: string, hosts: Array<string> } } }> } } | null, organization: { __typename: 'Organization', id: string, shadowRecord: boolean, domains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, hosts: Array<string>, inject: boolean | null, injectHud: boolean | null, injectSidebar: boolean | null, isGmail: boolean | null, defaultOpen: boolean | null, trackSession: boolean | null } }> } } | null } };

export type BackgroundDomainFragment = { __typename: 'Domain', id: string, hosts: Array<string>, inject: boolean | null, injectHud: boolean | null, injectSidebar: boolean | null, isGmail: boolean | null, defaultOpen: boolean | null, trackSession: boolean | null };

export type CreateCollectionMutationVariables = Exact<{
  collectionData: CollectionInput;
}>;


export type CreateCollectionMutation = { __typename: 'Mutation', modify: { __typename: 'CollectionOutput', collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, defaultPermissions: Array<CollectionPermissionEnum>, organization: { __typename: 'Organization', id: string, name: string | null } | null, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string } | null, userGroup: { __typename: 'UserGroup', id: string } | null }> } | null, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type CollectionQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type CollectionQuery = { __typename: 'Query', node: { __typename: 'AuthSession', id: string } | { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, defaultPermissions: Array<CollectionPermissionEnum>, organization: { __typename: 'Organization', id: string, name: string | null } | null, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string } | null, userGroup: { __typename: 'UserGroup', id: string } | null }> } | { __typename: 'DataImport', id: string } | { __typename: 'Domain', id: string } | { __typename: 'LimitedCollection', id: string } | { __typename: 'LimitedUser', id: string } | { __typename: 'Organization', id: string } | { __typename: 'ProductChange', id: string } | { __typename: 'SpaceLatest', id: string } | { __typename: 'SpaceRevision', id: string } | { __typename: 'ToolLatest', id: string } | { __typename: 'ToolRevision', id: string } | { __typename: 'User', id: string } | { __typename: 'UserDomainSettings', id: string } | { __typename: 'UserGroup', id: string } | { __typename: 'WidgetLatest', id: string } | { __typename: 'WidgetRevision', id: string } | { __typename: 'WorkflowLatest', id: string } | { __typename: 'WorkflowRevision', id: string } | null };

export type UpdateCollectionMutationVariables = Exact<{
  id: Scalars['ID'];
  collectionData: CollectionInput;
}>;


export type UpdateCollectionMutation = { __typename: 'Mutation', modify: { __typename: 'CollectionOutput', collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, defaultPermissions: Array<CollectionPermissionEnum>, organization: { __typename: 'Organization', id: string, name: string | null } | null, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string } | null, userGroup: { __typename: 'UserGroup', id: string } | null }> } | null, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type ViewCollectionQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ViewCollectionQuery = { __typename: 'Query', node: { __typename: 'AuthSession', id: string } | { __typename: 'Collection', name: string, icon: string | null, description: string, id: string, organization: { __typename: 'Organization', id: string } | null, workflows: { __typename: 'CollectionWorkflows_Connection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, embeddedInWorkflows: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', staticId: string, branchId: string | null } }> }, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, tools: { __typename: 'CollectionTools_Connection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, relatedTools: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, topUsedTools: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } } | { __typename: 'DataImport', id: string } | { __typename: 'Domain', id: string } | { __typename: 'LimitedCollection', name: string, icon: string | null, description: string, id: string } | { __typename: 'LimitedUser', id: string } | { __typename: 'Organization', id: string } | { __typename: 'ProductChange', id: string } | { __typename: 'SpaceLatest', id: string } | { __typename: 'SpaceRevision', id: string } | { __typename: 'ToolLatest', id: string } | { __typename: 'ToolRevision', id: string } | { __typename: 'User', id: string } | { __typename: 'UserDomainSettings', id: string } | { __typename: 'UserGroup', id: string } | { __typename: 'WidgetLatest', id: string } | { __typename: 'WidgetRevision', id: string } | { __typename: 'WorkflowLatest', id: string } | { __typename: 'WorkflowRevision', id: string } | null };

export type CollectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type CollectionsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, defaultPermissions: Array<CollectionPermissionEnum>, organization: { __typename: 'Organization', id: string, name: string | null } | null, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string } | null, userGroup: { __typename: 'UserGroup', id: string } | null }> } }> } } | null } };

export type SendUserFeedbackMutationVariables = Exact<{
  feedback: Scalars['String'];
  path: Scalars['String'];
  prompt: Scalars['String'];
}>;


export type SendUserFeedbackMutation = { __typename: 'Mutation', sendUserFeedback: boolean };

export type RestoreToolMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type RestoreToolMutation = { __typename: 'Mutation', restoreTool: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type RestoreWorkflowMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type RestoreWorkflowMutation = { __typename: 'Mutation', restoreWorkflow: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type OrganizationQueryVariables = Exact<{ [key: string]: never; }>;


export type OrganizationQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, name: string | null, hasIntercomAccessToken: boolean, shadowRecord: boolean } | null } };

export type UpdateOrganizationMutationVariables = Exact<{
  name?: InputMaybe<Scalars['String']>;
  intercomCode?: InputMaybe<Scalars['String']>;
}>;


export type UpdateOrganizationMutation = { __typename: 'Mutation', modify: { __typename: 'OrganizationOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, organization: { __typename: 'Organization', id: string, name: string | null, hasIntercomAccessToken: boolean } | null } };

export type CollectionPageQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type CollectionPageQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, hasIntercomAccessToken: boolean, shadowRecord: boolean } | null }, node: { __typename: 'AuthSession' } | { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, isArchived: boolean, acl: Array<{ __typename: 'CollectionAcl', user: { __typename: 'LimitedUser', id: string, name: string | null } | null, userGroup: { __typename: 'UserGroup', id: string, name: string } | null }>, workflows: { __typename: 'CollectionWorkflows_Connection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, branchId: string | null, staticId: string, name: string, icon: string | null, isArchived: boolean, createdAt: string } }> }, tools: { __typename: 'CollectionTools_Connection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, branchId: string | null, staticId: string, name: string, isArchived: boolean, createdAt: string } }> } } | { __typename: 'DataImport' } | { __typename: 'Domain' } | { __typename: 'LimitedCollection' } | { __typename: 'LimitedUser' } | { __typename: 'Organization' } | { __typename: 'ProductChange' } | { __typename: 'SpaceLatest' } | { __typename: 'SpaceRevision' } | { __typename: 'ToolLatest' } | { __typename: 'ToolRevision' } | { __typename: 'User' } | { __typename: 'UserDomainSettings' } | { __typename: 'UserGroup' } | { __typename: 'WidgetLatest' } | { __typename: 'WidgetRevision' } | { __typename: 'WorkflowLatest' } | { __typename: 'WorkflowRevision' } | null };

export type ArchiveCollectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ArchiveCollectionMutation = { __typename: 'Mutation', archiveCollection: { __typename: 'CollectionOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, collection: { __typename: 'Collection', id: string, isArchived: boolean } | null } };

export type CollectionsPageQueryVariables = Exact<{ [key: string]: never; }>;


export type CollectionsPageQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, hasIntercomAccessToken: boolean, shadowRecord: boolean } | null, user: { __typename: 'User', id: string, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', workflowCount: number, toolCount: number, defaultPermissions: Array<CollectionPermissionEnum>, id: string, name: string, icon: string | null, description: string, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string, email: string | null } | null, userGroup: { __typename: 'UserGroup', id: string, name: string } | null }>, organization: { __typename: 'Organization', id: string, name: string | null } | null } }> } } | null } };

export type SendRecordingMutationVariables = Exact<{
  snapshot: Scalars['Json'];
}>;


export type SendRecordingMutation = { __typename: 'Mutation', sendPageSnapshot: boolean };

export type CreateDataSourceMutationVariables = Exact<{
  dataSourceCreateInput: DataSourceCreateInput;
}>;


export type CreateDataSourceMutation = { __typename: 'Mutation', modify: { __typename: 'DataSourceGraphqlOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, dataSource: { __typename: 'DataSource', id: string, name: string, requests: any, outputs: any } | null } };

export type DataSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type DataSourcesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, dataSources: Array<{ __typename: 'DataSource', id: string, requests: any }> } | null } };

export type EditGroupFormQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type EditGroupFormQuery = { __typename: 'Query', node: { __typename: 'AuthSession' } | { __typename: 'Collection' } | { __typename: 'DataImport' } | { __typename: 'Domain' } | { __typename: 'LimitedCollection' } | { __typename: 'LimitedUser' } | { __typename: 'Organization' } | { __typename: 'ProductChange' } | { __typename: 'SpaceLatest' } | { __typename: 'SpaceRevision' } | { __typename: 'ToolLatest' } | { __typename: 'ToolRevision' } | { __typename: 'User' } | { __typename: 'UserDomainSettings' } | { __typename: 'UserGroup', id: string, name: string, members: { __typename: 'UserGroupMembers_Connection', edges: Array<{ __typename: 'UserGroupMembers_Edge', isManager: boolean, node: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } | { __typename: 'User', id: string, name: string | null, email: string | null } }> } } | { __typename: 'WidgetLatest' } | { __typename: 'WidgetRevision' } | { __typename: 'WorkflowLatest' } | { __typename: 'WorkflowRevision' } | null };

export type EditGroupFormMutationVariables = Exact<{
  id: Scalars['ID'];
  name: Scalars['String'];
  upsertMembers?: InputMaybe<Array<GroupMemberInput> | GroupMemberInput>;
  removeMembers?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;


export type EditGroupFormMutation = { __typename: 'Mutation', modify: { __typename: 'UserGroupOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, group: { __typename: 'UserGroup', id: string, name: string, members: { __typename: 'UserGroupMembers_Connection', edges: Array<{ __typename: 'UserGroupMembers_Edge', isManager: boolean, node: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } | { __typename: 'User', id: string, name: string | null, email: string | null } }> } } | null } };

export type GroupFormFragment = { __typename: 'UserGroup', id: string, name: string, members: { __typename: 'UserGroupMembers_Connection', edges: Array<{ __typename: 'UserGroupMembers_Edge', isManager: boolean, node: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } | { __typename: 'User', id: string, name: string | null, email: string | null } }> } };

export type NewGroupFormMutationVariables = Exact<{
  name: Scalars['String'];
  upsertMembers: Array<GroupMemberInput> | GroupMemberInput;
}>;


export type NewGroupFormMutation = { __typename: 'Mutation', modify: { __typename: 'UserGroupOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, group: { __typename: 'UserGroup', id: string, name: string } | null } };

export type GroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, userGroups: { __typename: 'UserGroupConnection', edges: Array<{ __typename: 'UserGroupEdge', node: { __typename: 'UserGroup', id: string, name: string } }> } } | null } };

export type ImportPageQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ImportPageQuery = { __typename: 'Query', node: { __typename: 'AuthSession' } | { __typename: 'Collection' } | { __typename: 'DataImport', id: string, createdAt: string, type: DataImportTypeEnum, initialData: any, startedAt: string | null, completedAt: string | null, state: any | null } | { __typename: 'Domain' } | { __typename: 'LimitedCollection' } | { __typename: 'LimitedUser' } | { __typename: 'Organization' } | { __typename: 'ProductChange' } | { __typename: 'SpaceLatest' } | { __typename: 'SpaceRevision' } | { __typename: 'ToolLatest' } | { __typename: 'ToolRevision' } | { __typename: 'User' } | { __typename: 'UserDomainSettings' } | { __typename: 'UserGroup' } | { __typename: 'WidgetLatest' } | { __typename: 'WidgetRevision' } | { __typename: 'WorkflowLatest' } | { __typename: 'WorkflowRevision' } | null };

export type ImportPageMutationVariables = Exact<{
  id: Scalars['ID'];
  state?: InputMaybe<Scalars['Json']>;
  isComplete: Scalars['Boolean'];
}>;


export type ImportPageMutation = { __typename: 'Mutation', modify: { __typename: 'DataImportOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, dataImport: { __typename: 'DataImport', id: string, completedAt: string | null, state: any | null } | null } };

export type WorkflowDraftsQueryVariables = Exact<{ [key: string]: never; }>;


export type WorkflowDraftsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, draftWorkflows: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } } | null } };

export type QuickstartQueryVariables = Exact<{ [key: string]: never; }>;


export type QuickstartQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, hasWorkflow: boolean, hasTool: boolean } | null, organization: { __typename: 'Organization', id: string, shadowRecord: boolean, users: { __typename: 'BaseUserConnection', edges: Array<{ __typename: 'BaseUserEdge', node: { __typename: 'LimitedUser', id: string } | { __typename: 'User', id: string } }> } } | null } };

export type ToolDraftsQueryVariables = Exact<{ [key: string]: never; }>;


export type ToolDraftsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, draftTools: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } } | null } };

export type SpaceEditorQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type SpaceEditorQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, name: string, widgets: any, visibleToOrg: boolean, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> } | { __typename: 'ToolLatest' } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest' } | null };

export type SpacesPageQueryVariables = Exact<{ [key: string]: never; }>;


export type SpacesPageQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, spaces: { __typename: 'SpaceLatestConnection', edges: Array<{ __typename: 'SpaceLatestEdge', node: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, name: string, widgets: any, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> } }> } } | null } };

export type CreateSpaceMutationVariables = Exact<{
  data: SpaceCreateInput;
}>;


export type CreateSpaceMutation = { __typename: 'Mutation', modify: { __typename: 'SpaceOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, space: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, name: string, widgets: any, visibleToOrg: boolean, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> } | null } };

export type UpdateSpaceMutationVariables = Exact<{
  id: Scalars['ID'];
  data: SpaceUpdateInput;
}>;


export type UpdateSpaceMutation = { __typename: 'Mutation', modify: { __typename: 'SpaceOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, space: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, name: string, widgets: any, visibleToOrg: boolean, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> } | null } };

export type ViewSuggestionQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type ViewSuggestionQuery = { __typename: 'Query', workflow: { __typename: 'SpaceLatest', staticId: string, branchId: string | null } | { __typename: 'ToolLatest', staticId: string, branchId: string | null } | { __typename: 'WidgetLatest', staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', staticId: string, branchId: string | null, id: string, icon: string | null, name: string, keywords: Array<string>, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, publishedVersions: { __typename: 'WorkflowRevisionConnection', edges: Array<{ __typename: 'WorkflowRevisionEdge', node: { __typename: 'WorkflowRevision', id: string } }> }, branchedFrom: { __typename: 'WorkflowRevision', isLatest: boolean, id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null, tool: { __typename: 'SpaceLatest', staticId: string, branchId: string | null } | { __typename: 'ToolLatest', staticId: string, branchId: string | null, id: string, name: string, keywords: Array<string>, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, publishedVersions: { __typename: 'ToolRevisionConnection', edges: Array<{ __typename: 'ToolRevisionEdge', node: { __typename: 'ToolRevision', id: string } }> }, branchedFrom: { __typename: 'ToolRevision', isLatest: boolean, id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | { __typename: 'WidgetLatest', staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', staticId: string, branchId: string | null } | null };

export type AcceptWorkflowSuggestionMutationVariables = Exact<{
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
}>;


export type AcceptWorkflowSuggestionMutation = { __typename: 'Mutation', mergeWorkflow: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type RejectWorkflowSuggestionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type RejectWorkflowSuggestionMutation = { __typename: 'Mutation', deleteWorkflow: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type AcceptToolSuggestionMutationVariables = Exact<{
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
}>;


export type AcceptToolSuggestionMutation = { __typename: 'Mutation', mergeTool: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type RejectToolSuggestionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type RejectToolSuggestionMutation = { __typename: 'Mutation', deleteTool: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type SuggestionsQueryVariables = Exact<{ [key: string]: never; }>;


export type SuggestionsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', id: string, workflowSuggestions: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', name: string, id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, branchedFrom: { __typename: 'WorkflowRevision', id: string, publishedVersions: { __typename: 'WorkflowRevisionConnection', edges: Array<{ __typename: 'WorkflowRevisionEdge', node: { __typename: 'WorkflowRevision', id: string, name: string } }> } } | null, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } } }> } | null, toolSuggestions: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', name: string, component: string, id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, branchedFrom: { __typename: 'ToolRevision', id: string, publishedVersions: { __typename: 'ToolRevisionConnection', edges: Array<{ __typename: 'ToolRevisionEdge', node: { __typename: 'ToolRevision', id: string, name: string } }> } } | null, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } } }> } | null } }> } } | null } };

type SuggestionFragment_SpaceLatest_ = { __typename: 'SpaceLatest', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_SpaceRevision_ = { __typename: 'SpaceRevision', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_ToolLatest_ = { __typename: 'ToolLatest', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_ToolRevision_ = { __typename: 'ToolRevision', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_WidgetLatest_ = { __typename: 'WidgetLatest', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_WidgetRevision_ = { __typename: 'WidgetRevision', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_WorkflowLatest_ = { __typename: 'WorkflowLatest', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

type SuggestionFragment_WorkflowRevision_ = { __typename: 'WorkflowRevision', id: string, staticId: string, createdAt: string, branchId: string | null, branchType: BranchTypeEnum, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } };

export type SuggestionFragment = SuggestionFragment_SpaceLatest_ | SuggestionFragment_SpaceRevision_ | SuggestionFragment_ToolLatest_ | SuggestionFragment_ToolRevision_ | SuggestionFragment_WidgetLatest_ | SuggestionFragment_WidgetRevision_ | SuggestionFragment_WorkflowLatest_ | SuggestionFragment_WorkflowRevision_;

export type UserDialogOutputFragment = { __typename: 'UserOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, user: { __typename: 'User', id: string, organizationPermissions: Array<string>, disabledAt: string | null, groups: Array<{ __typename: 'UserGroup', id: string, name: string }> } | null };

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String'];
  groupIds: Array<Scalars['ID']> | Scalars['ID'];
  isOrgAdmin: Scalars['Boolean'];
}>;


export type CreateUserMutation = { __typename: 'Mutation', modify: { __typename: 'UserOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, user: { __typename: 'User', id: string, organizationPermissions: Array<string>, disabledAt: string | null, groups: Array<{ __typename: 'UserGroup', id: string, name: string }> } | null } };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID'];
  groupIds: Array<Scalars['ID']> | Scalars['ID'];
  isOrgAdmin: Scalars['Boolean'];
}>;


export type UpdateUserMutation = { __typename: 'Mutation', modify: { __typename: 'UserOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, user: { __typename: 'User', id: string, organizationPermissions: Array<string>, disabledAt: string | null, groups: Array<{ __typename: 'UserGroup', id: string, name: string }> } | null } };

export type DisableUserMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DisableUserMutation = { __typename: 'Mutation', modify: { __typename: 'UserOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, user: { __typename: 'User', id: string, organizationPermissions: Array<string>, disabledAt: string | null, groups: Array<{ __typename: 'UserGroup', id: string, name: string }> } | null } };

export type UsersUserGroupFragment = { __typename: 'UserGroup', id: string, name: string };

export type AllUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type AllUsersQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, googleDomain: string | null, additionalGoogleDomains: Array<string>, defaultUserGroup: { __typename: 'UserGroup', id: string, name: string } | null, userGroups: { __typename: 'UserGroupConnection', edges: Array<{ __typename: 'UserGroupEdge', node: { __typename: 'UserGroup', id: string, name: string } }> }, users: { __typename: 'BaseUserConnection', edges: Array<{ __typename: 'BaseUserEdge', node: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null, disabledAt: string | null } | { __typename: 'User', organizationPermissions: Array<string>, id: string, name: string | null, email: string | null, disabledAt: string | null, groups: Array<{ __typename: 'UserGroup', id: string, name: string }> } }> } } | null } };

export type KenchiErrorFragment = { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null };

export type CollectionListItemFragment = { __typename: 'Collection', id: string, name: string, icon: string | null, description: string };

export type CollectionFragment = { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, defaultPermissions: Array<CollectionPermissionEnum>, organization: { __typename: 'Organization', id: string, name: string | null } | null, acl: Array<{ __typename: 'CollectionAcl', id: string, permissions: Array<CollectionPermissionEnum>, user: { __typename: 'LimitedUser', id: string } | null, userGroup: { __typename: 'UserGroup', id: string } | null }> };

export type ShortcutFragment = { __typename: 'Shortcut', id: string, staticId: string, shortcut: string | null, orgWide: boolean };

type WorkflowFragment_WorkflowLatest_ = { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } };

type WorkflowFragment_WorkflowRevision_ = { __typename: 'WorkflowRevision', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } };

export type WorkflowFragment = WorkflowFragment_WorkflowLatest_ | WorkflowFragment_WorkflowRevision_;

type ToolFragment_ToolLatest_ = { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } };

type ToolFragment_ToolRevision_ = { __typename: 'ToolRevision', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } };

export type ToolFragment = ToolFragment_ToolLatest_ | ToolFragment_ToolRevision_;

export type WorkflowListItemFragment = { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } };

type ToolListItemFragment_ToolLatest_ = { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } };

type ToolListItemFragment_ToolRevision_ = { __typename: 'ToolRevision', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } };

export type ToolListItemFragment = ToolListItemFragment_ToolLatest_ | ToolListItemFragment_ToolRevision_;

export type UserAvatarFragment = { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null };

type SpaceFragment_SpaceLatest_ = { __typename: 'SpaceLatest', staticId: string, branchId: string | null, name: string, widgets: any };

type SpaceFragment_SpaceRevision_ = { __typename: 'SpaceRevision', staticId: string, branchId: string | null, name: string, widgets: any };

export type SpaceFragment = SpaceFragment_SpaceLatest_ | SpaceFragment_SpaceRevision_;

type SpaceEditorFragment_SpaceLatest_ = { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, name: string, widgets: any, visibleToOrg: boolean, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> };

type SpaceEditorFragment_SpaceRevision_ = { __typename: 'SpaceRevision', id: string, staticId: string, branchId: string | null, name: string, widgets: any, visibleToOrg: boolean, acl: Array<{ __typename: 'SpaceAcl', userGroup: { __typename: 'UserGroup', id: string, name: string } | null }> };

export type SpaceEditorFragment = SpaceEditorFragment_SpaceLatest_ | SpaceEditorFragment_SpaceRevision_;

type VersionFragment_SpaceLatest_ = { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_SpaceRevision_ = { __typename: 'SpaceRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_ToolLatest_ = { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_ToolRevision_ = { __typename: 'ToolRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_WidgetLatest_ = { __typename: 'WidgetLatest', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_WidgetRevision_ = { __typename: 'WidgetRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_WorkflowLatest_ = { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

type VersionFragment_WorkflowRevision_ = { __typename: 'WorkflowRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } };

export type VersionFragment = VersionFragment_SpaceLatest_ | VersionFragment_SpaceRevision_ | VersionFragment_ToolLatest_ | VersionFragment_ToolRevision_ | VersionFragment_WidgetLatest_ | VersionFragment_WidgetRevision_ | VersionFragment_WorkflowLatest_ | VersionFragment_WorkflowRevision_;

export type MajorChangesQueryVariables = Exact<{
  productFirst: Scalars['Int'];
  productAfter?: InputMaybe<Scalars['String']>;
  workflowFirst: Scalars['Int'];
  workflowAfter?: InputMaybe<Scalars['String']>;
  toolFirst: Scalars['Int'];
  toolAfter?: InputMaybe<Scalars['String']>;
}>;


export type MajorChangesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', productChanges: { __typename: 'ProductChangeConnection', edges: Array<{ __typename: 'ProductChangeEdge', cursor: string, node: { __typename: 'ProductChange', id: string, title: string, description: KenchiGQL.SlateNodeArray, createdAt: string } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean } }, user: { __typename: 'User', id: string, majorToolChanges: { __typename: 'ToolRevisionConnection', edges: Array<{ __typename: 'ToolRevisionEdge', cursor: string, node: { __typename: 'ToolRevision', name: string, description: string, id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } } }> }, majorWorkflowChanges: { __typename: 'WorkflowRevisionConnection', edges: Array<{ __typename: 'WorkflowRevisionEdge', cursor: string, node: { __typename: 'WorkflowRevision', name: string, description: string, id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean } } } | null } };

export type NodeChangesQueryVariables = Exact<{
  staticId: Scalars['String'];
  onlyMajor: Scalars['Boolean'];
  first: Scalars['Int'];
  after?: InputMaybe<Scalars['String']>;
}>;


export type NodeChangesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, notifications: { __typename: 'UserNotificationConnection', edges: Array<{ __typename: 'UserNotificationEdge', node: { __typename: 'UserNotification', id: string } }> } } | null }, versionedNode: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null } | { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, publishedVersionsTool: { __typename: 'ToolRevisionConnection', edges: Array<{ __typename: 'ToolRevisionEdge', node: { __typename: 'ToolRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } } | { __typename: 'WidgetLatest', id: string, staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, publishedVersionsWorkflow: { __typename: 'WorkflowRevisionConnection', edges: Array<{ __typename: 'WorkflowRevisionEdge', node: { __typename: 'WorkflowRevision', id: string, staticId: string, branchId: string | null, createdAt: string, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isFirst: boolean, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null, givenName: string | null, familyName: string | null, picture: string | null } } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: string | null } } } | null };

export type DraftsQueryVariables = Exact<{ [key: string]: never; }>;


export type DraftsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, draftWorkflows: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, draftTools: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } } | null } };

export type OrgMembersQueryVariables = Exact<{ [key: string]: never; }>;


export type OrgMembersQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, shadowRecord: boolean, users: { __typename: 'BaseUserConnection', edges: Array<{ __typename: 'BaseUserEdge', node: { __typename: 'LimitedUser', id: string, email: string | null, name: string | null } | { __typename: 'User', id: string, email: string | null, name: string | null } }> }, userGroups: { __typename: 'UserGroupConnection', edges: Array<{ __typename: 'UserGroupEdge', node: { __typename: 'UserGroup', id: string, name: string, members: { __typename: 'UserGroupMembers_Connection', edges: Array<{ __typename: 'UserGroupMembers_Edge', isManager: boolean, node: { __typename: 'LimitedUser', id: string } | { __typename: 'User', id: string } }> } } }> } } | null } };

export type SettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SettingsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, disabledMessage: string | null, name: string | null, hasIntercomAccessToken: boolean, googleDomain: string | null, shadowRecord: boolean } | null, searchConfig: { __typename: 'SearchConfig', apiKey: string, apiKeyExpiration: string, appId: string, indexName: string, shouldUseAlgolia: boolean, lastUpdated: string } | null, session: { __typename: 'AuthSession', id: string, type: AuthTypeEnum } | null, user: { __typename: 'User', id: string, email: string | null, name: string | null, givenName: string | null, potentialGoogleDomain: string | null, organizationPermissions: Array<string>, wantsEditSuggestionEmails: boolean, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', id: string, unwrappedPermissions: Array<string> } }> } } | null } };

export type ShortcutsQueryVariables = Exact<{ [key: string]: never; }>;


export type ShortcutsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, shortcuts: Array<{ __typename: 'Shortcut', id: string, staticId: string, shortcut: string | null, orgWide: boolean }> } | null, user: { __typename: 'User', id: string, shortcuts: Array<{ __typename: 'Shortcut', id: string, staticId: string, shortcut: string | null, orgWide: boolean }> } | null } };

export type TopItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type TopItemsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, topUsedToolStaticIds: Array<string>, topViewedWorkflowStaticIds: Array<string> } | null } };

export type HudSpacesQueryVariables = Exact<{ [key: string]: never; }>;


export type HudSpacesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, spaces: { __typename: 'SpaceLatestConnection', edges: Array<{ __typename: 'SpaceLatestEdge', node: { __typename: 'SpaceLatest', staticId: string, branchId: string | null, name: string, widgets: any } }> } } | null } };

export type RatingDetailsQueryVariables = Exact<{
  collectionIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
  staticIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
  startDate?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
}>;


export type RatingDetailsQuery = { __typename: 'Query', insights: { __typename: 'InsightsOutput', latestData: string | null, data: any | null, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type InsightsQueryVariables = Exact<{
  collectionIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
  staticIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
  type: InsightsTypeEnum;
  objectGrouping: InsightsObjectGroupingEnum;
  startDate?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
}>;


export type InsightsQuery = { __typename: 'Query', insights: { __typename: 'InsightsOutput', latestData: string | null, data: any | null, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type SuggestionsForVersionedNodeQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type SuggestionsForVersionedNodeQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null } | { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, suggestions: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', name: string, icon: string | null, id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } } }> } } | { __typename: 'WidgetLatest', id: string, staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, suggestions: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', name: string, icon: string | null, id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } } }> } } | null };

type SuggestionsItemFragment_SpaceLatest_ = { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_SpaceRevision_ = { __typename: 'SpaceRevision', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_ToolLatest_ = { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_ToolRevision_ = { __typename: 'ToolRevision', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_WidgetLatest_ = { __typename: 'WidgetLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_WidgetRevision_ = { __typename: 'WidgetRevision', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_WorkflowLatest_ = { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

type SuggestionsItemFragment_WorkflowRevision_ = { __typename: 'WorkflowRevision', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean, createdByUser: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } };

export type SuggestionsItemFragment = SuggestionsItemFragment_SpaceLatest_ | SuggestionsItemFragment_SpaceRevision_ | SuggestionsItemFragment_ToolLatest_ | SuggestionsItemFragment_ToolRevision_ | SuggestionsItemFragment_WidgetLatest_ | SuggestionsItemFragment_WidgetRevision_ | SuggestionsItemFragment_WorkflowLatest_ | SuggestionsItemFragment_WorkflowRevision_;

export type ToolWithTopUsageQueryVariables = Exact<{
  staticId: Scalars['String'];
  startDate: Scalars['String'];
  endDate: Scalars['String'];
}>;


export type ToolWithTopUsageQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, topUsage: { __typename: 'LatestNodeTopUsage_Connection', edges: Array<{ __typename: 'LatestNodeTopUsage_Edge', count: number, node: { __typename: 'LimitedUser', id: string, email: string | null, familyName: string | null, givenName: string | null, name: string | null, picture: string | null } }> } } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest' } | null };

export type ListQueryVariables = Exact<{
  since?: InputMaybe<Scalars['DateTime']>;
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  knownCollectionIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;


export type ListQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', isPrivate: boolean, id: string, name: string, icon: string | null, description: string, tools: { __typename: 'CollectionTools_Connection', removed: Array<string>, edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', lastListFetch: string, id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, workflows: { __typename: 'CollectionWorkflows_Connection', removed: Array<string>, edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', lastListFetch: string, id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } } }> } } | null } };

export type LoginAsMutationVariables = Exact<{
  sessionId?: InputMaybe<Scalars['String']>;
}>;


export type LoginAsMutation = { __typename: 'Mutation', modify: { __typename: 'ViewerOutput', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, email: string | null } | null }, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type LoginMutationVariables = Exact<{
  token: Scalars['String'];
}>;


export type LoginMutation = { __typename: 'Mutation', modify: { __typename: 'ViewerOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, email: string | null } | null } } };

export type MarkNotificationsMutationVariables = Exact<{
  viewed: Scalars['Boolean'];
  staticId?: InputMaybe<Scalars['String']>;
  types?: InputMaybe<Array<NotificationTypeEnum> | NotificationTypeEnum>;
  userNotificationIds?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;


export type MarkNotificationsMutation = { __typename: 'Mutation', markUserNotifications: { __typename: 'UserNotificationOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, userNotifications: Array<{ __typename: 'UserNotification', id: string, viewedAt: string | null, dismissedAt: string | null, notification: { __typename: 'Notification', id: string, relatedNode: { __typename: 'AuthSession', id: string } | { __typename: 'Collection', id: string } | { __typename: 'DataImport', id: string } | { __typename: 'Domain', id: string } | { __typename: 'LimitedCollection', id: string } | { __typename: 'LimitedUser', id: string } | { __typename: 'Organization', id: string } | { __typename: 'ProductChange', id: string } | { __typename: 'SpaceLatest', hasActiveNotifications: boolean | null, id: string } | { __typename: 'SpaceRevision', hasActiveNotifications: boolean | null, id: string } | { __typename: 'ToolLatest', hasActiveNotifications: boolean | null, id: string } | { __typename: 'ToolRevision', hasActiveNotifications: boolean | null, id: string } | { __typename: 'User', id: string } | { __typename: 'UserDomainSettings', id: string } | { __typename: 'UserGroup', id: string } | { __typename: 'WidgetLatest', hasActiveNotifications: boolean | null, id: string } | { __typename: 'WidgetRevision', hasActiveNotifications: boolean | null, id: string } | { __typename: 'WorkflowLatest', hasActiveNotifications: boolean | null, id: string } | { __typename: 'WorkflowRevision', hasActiveNotifications: boolean | null, id: string } | null } }> | null } };

export type NotificationsQueryVariables = Exact<{
  active?: InputMaybe<Scalars['Boolean']>;
  first: Scalars['Int'];
  after?: InputMaybe<Scalars['String']>;
}>;


export type NotificationsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string, notifications: { __typename: 'UserNotificationConnection', edges: Array<{ __typename: 'UserNotificationEdge', node: { __typename: 'UserNotification', id: string, dismissedAt: string | null, viewedAt: string | null, notification: { __typename: 'Notification', id: string, type: NotificationTypeEnum, relatedNode: { __typename: 'AuthSession', id: string } | { __typename: 'Collection', id: string } | { __typename: 'DataImport', id: string } | { __typename: 'Domain', id: string } | { __typename: 'LimitedCollection', id: string } | { __typename: 'LimitedUser', id: string } | { __typename: 'Organization', id: string } | { __typename: 'ProductChange', id: string } | { __typename: 'SpaceLatest', staticId: string, branchId: string | null, id: string } | { __typename: 'SpaceRevision', staticId: string, branchId: string | null, id: string } | { __typename: 'ToolLatest', staticId: string, branchId: string | null, id: string } | { __typename: 'ToolRevision', staticId: string, branchId: string | null, id: string } | { __typename: 'User', id: string } | { __typename: 'UserDomainSettings', id: string } | { __typename: 'UserGroup', id: string } | { __typename: 'WidgetLatest', staticId: string, branchId: string | null, id: string } | { __typename: 'WidgetRevision', staticId: string, branchId: string | null, id: string } | { __typename: 'WorkflowLatest', staticId: string, branchId: string | null, id: string } | { __typename: 'WorkflowRevision', staticId: string, branchId: string | null, id: string } | null } } }> } } | null } };

export type UpdateSubscriptionMutationVariables = Exact<{
  staticId: Scalars['String'];
  subscribed: Scalars['Boolean'];
}>;


export type UpdateSubscriptionMutation = { __typename: 'Mutation', updateSubscription: { __typename: 'UserSubscriptionOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, versionedNode: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'SpaceRevision', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'ToolRevision', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'WidgetLatest', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'WidgetRevision', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | { __typename: 'WorkflowRevision', id: string, staticId: string, branchId: string | null, subscribed: boolean | null } | null } };

export type DomainSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type DomainSettingsQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', defaultDomains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null, variableExtractors: any | null, insertionPath: KenchiGQL.InsertionPath | null } }> }, organization: { __typename: 'Organization', id: string, shadowRecord: boolean, domains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null, variableExtractors: any | null, insertionPath: KenchiGQL.InsertionPath | null } }> } } | null, user: { __typename: 'User', id: string, domainSettings: { __typename: 'UserDomainSettingsConnection', edges: Array<{ __typename: 'UserDomainSettingsEdge', node: { __typename: 'UserDomainSettings', id: string, open: boolean | null, side: string | null, domain: { __typename: 'Domain', id: string, hosts: Array<string> } } }> } } | null } };

export type DomainFragment = { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null, variableExtractors: any | null, insertionPath: KenchiGQL.InsertionPath | null };

export type ExternalDataReferencesQueryVariables = Exact<{
  referenceType: ExternalReferenceTypeEnum;
  referenceSource: Scalars['String'];
}>;


export type ExternalDataReferencesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, shadowRecord: boolean, externalDataReferences: Array<{ __typename: 'ExternalDataReference', id: string, referenceType: ExternalReferenceTypeEnum, referenceSource: string, label: string, referenceId: string }> } | null } };

export type CreateExternalDataReferenceMutationVariables = Exact<{
  data: ExternalDataReferenceCreateInput;
}>;


export type CreateExternalDataReferenceMutation = { __typename: 'Mutation', modify: { __typename: 'ExternalDataReferenceOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, externalDataReference: { __typename: 'ExternalDataReference', id: string, referenceType: ExternalReferenceTypeEnum, referenceSource: string, referenceId: string, label: string } | null } };

export type UpdateExternalDataReferenceMutationVariables = Exact<{
  id: Scalars['ID'];
  data: ExternalDataReferenceUpdateInput;
}>;


export type UpdateExternalDataReferenceMutation = { __typename: 'Mutation', modify: { __typename: 'ExternalDataReferenceOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, externalDataReference: { __typename: 'ExternalDataReference', id: string, referenceType: ExternalReferenceTypeEnum, referenceSource: string, referenceId: string, label: string } | null } };

export type ProductChangeQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ProductChangeQuery = { __typename: 'Query', node: { __typename: 'AuthSession' } | { __typename: 'Collection' } | { __typename: 'DataImport' } | { __typename: 'Domain' } | { __typename: 'LimitedCollection' } | { __typename: 'LimitedUser' } | { __typename: 'Organization' } | { __typename: 'ProductChange', id: string, title: string, description: KenchiGQL.SlateNodeArray, createdAt: string } | { __typename: 'SpaceLatest' } | { __typename: 'SpaceRevision' } | { __typename: 'ToolLatest' } | { __typename: 'ToolRevision' } | { __typename: 'User' } | { __typename: 'UserDomainSettings' } | { __typename: 'UserGroup' } | { __typename: 'WidgetLatest' } | { __typename: 'WidgetRevision' } | { __typename: 'WorkflowLatest' } | { __typename: 'WorkflowRevision' } | null };

export type CapturePageSnapshotQueryVariables = Exact<{
  snapshot: Scalars['Json'];
}>;


export type CapturePageSnapshotQuery = { __typename: 'Mutation', sendPageSnapshot: boolean };

export type ImportLinkMutationVariables = Exact<{
  type: DataImportTypeEnum;
  initialData: Scalars['Json'];
}>;


export type ImportLinkMutation = { __typename: 'Mutation', createDataImport: { __typename: 'DataImportOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, dataImport: { __typename: 'DataImport', id: string } | null } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename: 'Mutation', logout: { __typename: 'ViewerOutput', viewer: { __typename: 'Viewer', user: { __typename: 'User', id: string } | null, organization: { __typename: 'Organization', id: string } | null } } };

export type UserSettingsMutationVariables = Exact<{
  wantsEditSuggestionEmails: Scalars['Boolean'];
}>;


export type UserSettingsMutation = { __typename: 'Mutation', updateUserSettings: { __typename: 'UserOutput', user: { __typename: 'User', id: string, wantsEditSuggestionEmails: boolean } | null } };

export type SetShortcutsMutationVariables = Exact<{
  staticId: Scalars['String'];
  orgShortcut?: InputMaybe<Scalars['String']>;
  userShortcut?: InputMaybe<Scalars['String']>;
}>;


export type SetShortcutsMutation = { __typename: 'Mutation', modify: { __typename: 'SetShortcutsOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, orgShortcut: { __typename: 'Shortcut', id: string, staticId: string, shortcut: string | null, orgWide: boolean } | null, userShortcut: { __typename: 'Shortcut', id: string, staticId: string, shortcut: string | null, orgWide: boolean } | null } };

export type UploadFileMutationVariables = Exact<{
  file?: InputMaybe<Scalars['Upload']>;
  url?: InputMaybe<Scalars['String']>;
}>;


export type UploadFileMutation = { __typename: 'Mutation', uploadFile: { __typename: 'UploadFile', url: string | null, error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null } };

export type ToolElementQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type ToolElementQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest' } | null };

export type ListCollectionFragment = { __typename: 'Collection', id: string, name: string, icon: string | null, description: string, tools: { __typename: 'CollectionTools_Connection', removed: Array<string>, edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> }, workflows: { __typename: 'CollectionWorkflows_Connection', removed: Array<string>, edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, isArchived: boolean, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null } } }> } };

export type SpacesQueryVariables = Exact<{ [key: string]: never; }>;


export type SpacesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string, defaultSpaceWidgets: any | null } | null, user: { __typename: 'User', id: string, magicItemSettings: { __typename: 'UserItemSettingsConnection', edges: Array<{ __typename: 'UserItemSettingsEdge', node: { __typename: 'UserItemSettings', staticId: string, data: any } }> }, spaces: { __typename: 'SpaceLatestConnection', edges: Array<{ __typename: 'SpaceLatestEdge', node: { __typename: 'SpaceLatest', staticId: string, branchId: string | null, name: string, widgets: any, settings: { __typename: 'UserItemSettings', staticId: string, data: any } | null } }> } } | null } };

export type CreateOrgMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOrgMutation = { __typename: 'Mutation', modify: { __typename: 'CreateOrganizationOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, sharedCollection: { __typename: 'Collection', id: string } | null, viewer: { __typename: 'Viewer', organization: { __typename: 'Organization', id: string } | null } } };

export type InviteUserMutationVariables = Exact<{
  email: Scalars['String'];
}>;


export type InviteUserMutation = { __typename: 'Mutation', createUser: { __typename: 'UserOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, user: { __typename: 'User', id: string, email: string | null } | null } };

export type UpdateOrgSettingsMutationVariables = Exact<{
  name?: InputMaybe<Scalars['String']>;
  useGoogleDomain?: InputMaybe<Scalars['Boolean']>;
  collectionsToShare?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;


export type UpdateOrgSettingsMutation = { __typename: 'Mutation', modify: { __typename: 'OrganizationOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, organization: { __typename: 'Organization', id: string, name: string | null, googleDomain: string | null } | null } };

export type PageSettingsMutationVariables = Exact<{
  staticId: Scalars['String'];
  data: Scalars['Json'];
}>;


export type PageSettingsMutation = { __typename: 'Mutation', setUserItemSettings: { __typename: 'UserItemSettingsOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, userItemSettings: { __typename: 'UserItemSettings', staticId: string, data: any } | null } | null };

export type UserItemSettingsFragment = { __typename: 'UserItemSettings', staticId: string, data: any };

export type ToolRelatedContentQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type ToolRelatedContentQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest', staticId: string, branchId: string | null } | { __typename: 'ToolLatest', staticId: string, branchId: string | null, workflows: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, name: string } }> }, collections: { __typename: 'CollectionConnection', edges: Array<{ __typename: 'CollectionEdge', node: { __typename: 'Collection', id: string, name: string } }> } } | { __typename: 'WidgetLatest', staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', staticId: string, branchId: string | null } | null };

export type CreateToolMutationVariables = Exact<{
  toolData: ToolCreateInput;
}>;


export type CreateToolMutation = { __typename: 'Mutation', modify: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type DeleteToolMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteToolMutation = { __typename: 'Mutation', modify: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type PublishToolMutationVariables = Exact<{
  id: Scalars['ID'];
  toolData: ToolUpdateInput;
}>;


export type PublishToolMutation = { __typename: 'Mutation', modify: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type UpdateToolMutationVariables = Exact<{
  id: Scalars['ID'];
  toolData: ToolUpdateInput;
}>;


export type UpdateToolMutation = { __typename: 'Mutation', modify: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type MergeToolMutationVariables = Exact<{
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
  toolData: ToolUpdateInput;
}>;


export type MergeToolMutation = { __typename: 'Mutation', modify: { __typename: 'ToolOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, tool: { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type MergeToolQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type MergeToolQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, branchedFrom: { __typename: 'ToolRevision', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, publishedVersions: { __typename: 'ToolRevisionConnection', edges: Array<{ __typename: 'ToolRevisionEdge', node: { __typename: 'ToolRevision', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } }> }, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest' } | null };

export type ToolRelatedWorkflowsQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type ToolRelatedWorkflowsQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest', staticId: string, branchId: string | null } | { __typename: 'ToolLatest', staticId: string, branchId: string | null, workflows: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, name: string, icon: string | null } }> } } | { __typename: 'WidgetLatest', staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', staticId: string, branchId: string | null } | null };

export type SendToolRunLogMutationVariables = Exact<{
  log: Scalars['Json'];
  toolId: Scalars['ID'];
}>;


export type SendToolRunLogMutation = { __typename: 'Mutation', sendToolRunLog: boolean };

export type ToolQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type ToolQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest', id: string, staticId: string, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, description: string, hasActiveNotifications: boolean | null, component: string, icon: string | null, inputs: Array<KenchiGQL.ToolInput>, configuration: any, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'ToolLatestConnection', edges: Array<{ __typename: 'ToolLatestEdge', node: { __typename: 'ToolLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest' } | null };

export type DomainSettingsMutationVariables = Exact<{
  host: Scalars['String'];
  open?: InputMaybe<Scalars['Boolean']>;
  side?: InputMaybe<Scalars['String']>;
}>;


export type DomainSettingsMutation = { __typename: 'Mutation', setUserDomainSettings: { __typename: 'UserDomainSettingsOutput', userDomainSettings: { __typename: 'UserDomainSettings', id: string, open: boolean | null, side: string | null } } | null };

export type MergeWorkflowMutationVariables = Exact<{
  fromId: Scalars['ID'];
  toId?: InputMaybe<Scalars['ID']>;
  workflowData: WorkflowUpdateInput;
}>;


export type MergeWorkflowMutation = { __typename: 'Mutation', mergeWorkflow: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type MergeWorkflowQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type MergeWorkflowQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest' } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, branchedFrom: { __typename: 'WorkflowRevision', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, publishedVersions: { __typename: 'WorkflowRevisionConnection', edges: Array<{ __typename: 'WorkflowRevisionEdge', node: { __typename: 'WorkflowRevision', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } }> }, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null };

export type CreateWorkflowMutationVariables = Exact<{
  workflowData: WorkflowCreateInput;
}>;


export type CreateWorkflowMutation = { __typename: 'Mutation', modify: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type DeleteWorkflowMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteWorkflowMutation = { __typename: 'Mutation', modify: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type PublishWorkflowMutationVariables = Exact<{
  id: Scalars['ID'];
  workflowData: WorkflowUpdateInput;
}>;


export type PublishWorkflowMutation = { __typename: 'Mutation', modify: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type UpdateWorkflowMutationVariables = Exact<{
  id: Scalars['ID'];
  workflowData: WorkflowUpdateInput;
}>;


export type UpdateWorkflowMutation = { __typename: 'Mutation', modify: { __typename: 'WorkflowOutput', error: { __typename: 'KenchiError', type: KenchiErrorType, code: KenchiErrorCode, message: string | null, param: string | null } | null, workflow: { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null } };

export type WorkflowQueryVariables = Exact<{
  staticId: Scalars['String'];
}>;


export type WorkflowQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest' } | { __typename: 'ToolLatest' } | { __typename: 'WidgetLatest' } | { __typename: 'WorkflowLatest', id: string, staticId: string, icon: string | null, name: string, keywords: Array<string>, branchId: string | null, branchType: BranchTypeEnum, subscribed: boolean | null, hasActiveNotifications: boolean | null, description: string, contents: KenchiGQL.SlateNodeArray, majorChangeDescription: KenchiGQL.SlateNodeArray | null, isArchived: boolean, archiveReason: string | null, createdAt: string, collection: { __typename: 'Collection', id: string, name: string, icon: string | null, description: string }, createdByUser: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null }, branches: { __typename: 'WorkflowLatestConnection', edges: Array<{ __typename: 'WorkflowLatestEdge', node: { __typename: 'WorkflowLatest', id: string, staticId: string, branchId: string | null, createdAt: string, isArchived: boolean } }> } } | null };
