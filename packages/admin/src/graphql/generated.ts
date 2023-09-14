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
  DateTime: any;
  InsertionPath: any;
  Json: any;
  SlateNodeArray: any;
  ToolConfiguration: any;
  ToolInput: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export enum AuthTypeEnum {
  loginAs = 'loginAs',
  user = 'user'
}

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

export type BulkUpdateReplaceInput = {
  from: Scalars['String'];
  to: Scalars['String'];
};

export type BulkUpdateUpdatesInput = {
  collectionId?: InputMaybe<Scalars['ID']>;
  fixMissingChildren?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  removeIntro?: InputMaybe<Scalars['Boolean']>;
  removeOutro?: InputMaybe<Scalars['Boolean']>;
  replace?: InputMaybe<Array<BulkUpdateReplaceInput>>;
};

export type CollectionAclInput = {
  permissions: Array<CollectionPermissionEnum>;
  userGroupId?: InputMaybe<Scalars['ID']>;
  userId?: InputMaybe<Scalars['ID']>;
};

export type CollectionInput = {
  acl: Array<CollectionAclInput>;
  defaultPermissions?: InputMaybe<Array<CollectionPermissionEnum>>;
  description: Scalars['String'];
  icon?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

export enum CollectionPermissionEnum {
  admin = 'admin',
  publisher = 'publisher',
  viewer = 'viewer'
}

export enum DataImportTypeEnum {
  csv = 'csv',
  intercom = 'intercom',
  textExpander = 'textExpander',
  zendesk = 'zendesk'
}

export type DataSourceCreateInput = {
  name: Scalars['String'];
  outputs: Array<Scalars['DataSourceOutput']>;
  requests: Array<Scalars['DataSourceRequest']>;
};

export type DataSourceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
  outputs?: InputMaybe<Array<Scalars['DataSourceOutput']>>;
  requests?: InputMaybe<Array<Scalars['DataSourceRequest']>>;
};

export type ExternalDataReferenceCreateInput = {
  label: Scalars['String'];
  referenceId: Scalars['String'];
  referenceSource: Scalars['String'];
  referenceType: ExternalReferenceTypeEnum;
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

export type ExternalTagInput = {
  intercomId?: InputMaybe<Scalars['String']>;
  label: Scalars['String'];
};

export type GroupMemberInput = {
  isManager: Scalars['Boolean'];
  userId: Scalars['ID'];
};

export enum InsightsObjectGroupingEnum {
  collectionId = 'collectionId',
  staticId = 'staticId'
}

export enum InsightsTypeEnum {
  ratings = 'ratings',
  ratingsDetails = 'ratingsDetails',
  toolUsage = 'toolUsage',
  workflowUsage = 'workflowUsage'
}

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

export type SpaceCreateInput = {
  name: Scalars['String'];
  visibleToGroupIds: Array<Scalars['ID']>;
  visibleToOrg: Scalars['Boolean'];
  widgets: Array<Scalars['Json']>;
};

export type SpaceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
  visibleToGroupIds?: InputMaybe<Array<Scalars['ID']>>;
  visibleToOrg?: InputMaybe<Scalars['Boolean']>;
  widgets?: InputMaybe<Array<Scalars['Json']>>;
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

export type UserDomainSettingsInput = {
  host: Scalars['String'];
  open?: InputMaybe<Scalars['Boolean']>;
  side?: InputMaybe<Scalars['String']>;
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

export type RequeueQueryVariables = Exact<{ [key: string]: never; }>;


export type RequeueQuery = { __typename: 'Query', admin: { __typename: 'Admin', unprocessedLogs: Array<{ __typename: 'UnprocessedLog', day: any, count: number }> } | null };

export type QueueBackfillMutationVariables = Exact<{
  start: Scalars['Int'];
  end: Scalars['Int'];
}>;


export type QueueBackfillMutation = { __typename: 'Mutation', queueBackfill: boolean };

export type UpdateDemoAccountMutationVariables = Exact<{
  from: Scalars['DateTime'];
}>;


export type UpdateDemoAccountMutation = { __typename: 'Mutation', result: boolean };

export type QueueConfigureSearchIndexMutationVariables = Exact<{ [key: string]: never; }>;


export type QueueConfigureSearchIndexMutation = { __typename: 'Mutation', result: boolean };

export type QueueReindexMutationVariables = Exact<{ [key: string]: never; }>;


export type QueueReindexMutation = { __typename: 'Mutation', result: boolean };

export type RequeueUnprocessedLogsMutationVariables = Exact<{
  day: Scalars['DateTime'];
}>;


export type RequeueUnprocessedLogsMutation = { __typename: 'Mutation', requeueUnprocessedLogs: number };

export type DbQueryVariables = Exact<{ [key: string]: never; }>;


export type DbQuery = { __typename: 'Query', admin: { __typename: 'Admin', migrations: Array<{ __typename: 'DatabaseMigration', id: string, runOn: any | null }> } | null };

export type UpgradeMutationVariables = Exact<{ [key: string]: never; }>;


export type UpgradeMutation = { __typename: 'Mutation', upgradeDB: { __typename: 'upgradeDBOutput', stdout: string, stderr: string } };

export type DomainFragment = { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, isGmail: boolean | null, variableExtractors: any | null, insertTextXPath: string | null, inject: boolean | null, injectSidebar: boolean | null, injectHud: boolean | null, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null };

export type OrgDomainSettingsQueryVariables = Exact<{
  orgId: Scalars['ID'];
}>;


export type OrgDomainSettingsQuery = { __typename: 'Query', admin: { __typename: 'Admin', organization: { __typename: 'Organization', id: string, name: string | null, googleDomain: string | null, domains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, isGmail: boolean | null, variableExtractors: any | null, insertTextXPath: string | null, inject: boolean | null, injectSidebar: boolean | null, injectHud: boolean | null, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null } }> } } | null } | null };

export type GlobalDomainSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GlobalDomainSettingsQuery = { __typename: 'Query', admin: { __typename: 'Admin', nonOrgDomains: { __typename: 'DomainConnection', edges: Array<{ __typename: 'DomainEdge', node: { __typename: 'Domain', id: string, name: string | null, hosts: Array<string>, isGmail: boolean | null, variableExtractors: any | null, insertTextXPath: string | null, inject: boolean | null, injectSidebar: boolean | null, injectHud: boolean | null, defaultOpen: boolean | null, defaultSide: string | null, customPlacements: any | null } }> } | null } | null };

export type UserDomainSettingsQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;


export type UserDomainSettingsQuery = { __typename: 'Query', admin: { __typename: 'Admin', user: { __typename: 'User', id: string, name: string | null, email: string | null, organization: { __typename: 'Organization', id: string } | null, domainSettings: { __typename: 'UserDomainSettingsConnection', edges: Array<{ __typename: 'UserDomainSettingsEdge', node: { __typename: 'UserDomainSettings', id: string, open: boolean | null, side: string | null, injectHud: boolean | null, domain: { __typename: 'Domain', id: string, name: string | null, hosts: Array<string> } } }> } } | null } | null };

export type ProductChangesQueryVariables = Exact<{ [key: string]: never; }>;


export type ProductChangesQuery = { __typename: 'Query', viewer: { __typename: 'Viewer', productChanges: { __typename: 'ProductChangeConnection', edges: Array<{ __typename: 'ProductChangeEdge', cursor: string, node: { __typename: 'ProductChange', id: string, title: string, description: any, createdAt: any, notification: { __typename: 'Notification', id: string, createdAt: any } | null } }> } } };

export type ProductChangeStatsQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ProductChangeStatsQuery = { __typename: 'Query', admin: { __typename: 'Admin', notificationStats: { __typename: 'NotificationStats', created: number, viewed: number, dismissed: number } | null } | null };

export type NotifyProductChangeMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type NotifyProductChangeMutation = { __typename: 'Mutation', notifyProductChange: { __typename: 'Notification', id: string, createdAt: any } };

export type ObjectQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type ObjectQuery = { __typename: 'Query', versionedNode: { __typename: 'SpaceLatest', id: string, staticId: string, branchId: string | null } | { __typename: 'ToolLatest', name: string, icon: string | null, description: string, component: string, configuration: any, id: string, staticId: string, branchId: string | null } | { __typename: 'WorkflowLatest', name: string, icon: string | null, description: string, contents: any, id: string, staticId: string, branchId: string | null } | null };

export type OrgsQueryVariables = Exact<{ [key: string]: never; }>;


export type OrgsQuery = { __typename: 'Query', admin: { __typename: 'Admin', organizations: { __typename: 'OrganizationConnection', edges: Array<{ __typename: 'OrganizationEdge', node: { __typename: 'Organization', id: string, name: string | null } }> } } | null };

export type OrgQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type OrgQuery = { __typename: 'Query', admin: { __typename: 'Admin', organization: { __typename: 'Organization', id: string, name: string | null, googleDomain: string | null, users: { __typename: 'BaseUserConnection', edges: Array<{ __typename: 'BaseUserEdge', node: { __typename: 'LimitedUser', id: string, name: string | null, email: string | null } | { __typename: 'User', id: string, name: string | null, email: string | null } }> } } | null } | null };

export type NonOrgUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type NonOrgUsersQuery = { __typename: 'Query', admin: { __typename: 'Admin', nonOrgUsers: { __typename: 'UserConnection', edges: Array<{ __typename: 'UserEdge', node: { __typename: 'User', id: string, name: string | null, email: string | null } }> } } | null };

export type PageSnapshotQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type PageSnapshotQuery = { __typename: 'Query', adminNode: { __typename: 'PageSnapshot', id: string, createdAt: any, snapshot: any, user: { __typename: 'User', id: string, email: string | null } | null } | { __typename: 'ToolRunLog' } | null };

export type ToolRunLogQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type ToolRunLogQuery = { __typename: 'Query', adminNode: { __typename: 'PageSnapshot' } | { __typename: 'ToolRunLog', id: string, createdAt: any, log: any, tool: { __typename: 'ToolRevision', id: string, name: string, staticId: string, configuration: any } | null, user: { __typename: 'User', id: string, email: string | null } | null } | null };

export type DemoOrgUserQueryVariables = Exact<{ [key: string]: never; }>;


export type DemoOrgUserQuery = { __typename: 'Query', admin: { __typename: 'Admin', organization: { __typename: 'Organization', updatedAt: any, users: { __typename: 'BaseUserConnection', edges: Array<{ __typename: 'BaseUserEdge', node: { __typename: 'LimitedUser', id: string, email: string | null } | { __typename: 'User', id: string, email: string | null } }> } } | null } | null };

export type SetupLoginAsMutationVariables = Exact<{
  orgId?: InputMaybe<Scalars['ID']>;
  userId?: InputMaybe<Scalars['ID']>;
}>;


export type SetupLoginAsMutation = { __typename: 'Mutation', setupLoginAs: string };
