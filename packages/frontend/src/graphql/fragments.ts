import { gql } from '@apollo/client';

export const KenchiErrorFragment = gql`
  fragment KenchiErrorFragment on KenchiError {
    type
    code
    message
    param
  }
`;

export const CollectionListItemFragment = gql`
  fragment CollectionListItemFragment on Collection {
    id
    name
    icon
    description
  }
`;

export const CollectionFragment = gql`
  fragment CollectionFragment on Collection {
    id
    name
    icon
    description
    organization {
      id
      name
    }
    acl {
      id
      user {
        id
      }
      userGroup {
        id
      }
      permissions
    }
    defaultPermissions
  }
`;

export const ShortcutFragment = gql`
  fragment ShortcutFragment on Shortcut {
    id
    staticId
    shortcut
    orgWide
  }
`;

export const WorkflowFragment = gql`
  fragment WorkflowFragment on Workflow {
    id
    staticId
    icon
    name
    keywords
    branchId
    branchType
    subscribed
    hasActiveNotifications
    collection {
      ...CollectionListItemFragment
    }
    description
    contents
    majorChangeDescription
    isArchived
    archiveReason
    createdAt
    createdByUser {
      id
      name
      email
    }
    branches(createdByMe: true, branchType: suggestion, first: 1) {
      edges {
        node {
          id
          staticId
          branchId
          createdAt
          isArchived
        }
      }
    }
  }
  ${CollectionListItemFragment}
`;

export const ToolFragment = gql`
  fragment ToolFragment on Tool {
    id
    staticId
    name
    keywords
    branchId
    branchType
    description
    hasActiveNotifications
    collection {
      ...CollectionListItemFragment
    }
    component
    icon
    inputs
    configuration
    majorChangeDescription
    isArchived
    archiveReason
    createdAt
    createdByUser {
      id
      name
      email
    }
    branches(createdByMe: true, branchType: suggestion, first: 1) {
      edges {
        node {
          id
          staticId
          branchId
          createdAt
          isArchived
        }
      }
    }
  }
  ${CollectionListItemFragment}
`;

export const WorkflowListItemFragment = gql`
  fragment WorkflowListItemFragment on WorkflowLatest {
    id
    staticId
    icon
    name
    keywords
    branchId
    branchType
    collection {
      id
      name
      icon
    }
    description
    isArchived
    createdAt
  }
`;

export const ToolListItemFragment = gql`
  fragment ToolListItemFragment on Tool {
    id
    staticId
    name
    keywords
    branchId
    branchType
    description
    collection {
      id
      name
      icon
    }
    component
    icon
    inputs
    configuration
    isArchived
    createdAt
  }
`;

export const UserAvatarFragment = gql`
  fragment UserAvatarFragment on LimitedUser {
    id
    email
    familyName
    givenName
    name
    picture
  }
`;

export const SpaceFragment = gql`
  fragment SpaceFragment on Space {
    staticId
    branchId
    name
    widgets
  }
`;

export const SpaceEditorFragment = gql`
  fragment SpaceEditorFragment on Space {
    id
    staticId
    branchId
    name
    widgets
    visibleToOrg
    acl {
      userGroup {
        id
        name
      }
    }
  }
`;
