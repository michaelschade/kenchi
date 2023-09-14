import { Factory } from 'fishery';

import {
  DraftsQuery,
  ListQuery,
  LoginMutation,
  SpacesQuery,
} from '../../graphql/generated';
import { PartialCollection } from './collection';
import connectionHelper from './connectionHelper';
import { PartialSpace } from './space';

const collectionsConnection = (collections: PartialCollection[]) => {
  const connections = connectionHelper<PartialUser['collections']>(
    'CollectionConnection',
    'CollectionEdge',
    collections
  );
  return { ...connections, removed: [] };
};

const spacesConnection = (spaces: PartialSpace[]) => {
  return connectionHelper<PartialUser['spaces']>(
    'SpaceLatestConnection',
    'SpaceLatestEdge',
    spaces
  );
};

export type PartialUser = NonNullable<
  DraftsQuery['viewer']['user'] &
    LoginMutation['modify']['viewer']['user'] &
    SpacesQuery['viewer']['user'] &
    ListQuery['viewer']['user']
>;

class UserFactory extends Factory<PartialUser> {
  withCollections(collections: PartialCollection[]) {
    return this.params({
      collections: collectionsConnection(collections),
    });
  }

  withSpaces(spaces: PartialSpace[]) {
    return this.params({ spaces: spacesConnection(spaces) });
  }
}

const userFactory = UserFactory.define(({ sequence }) => ({
  __typename: 'User' as const,
  id: `user_${sequence}`,
  email: `user${sequence}@example.com`,
  magicItemSettings: connectionHelper<PartialUser['magicItemSettings']>(
    'UserItemSettingsConnection',
    'UserItemSettingsEdge',
    []
  ),
  spaces: spacesConnection([]),
  collections: collectionsConnection([]),
  draftWorkflows: {
    __typename: 'WorkflowLatestConnection' as const,
    edges: [],
  },
  draftTools: {
    __typename: 'ToolLatestConnection' as const,
    edges: [],
  },
}));

export default userFactory;
