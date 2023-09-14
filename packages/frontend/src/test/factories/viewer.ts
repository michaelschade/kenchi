import { Factory } from 'fishery';

import { LoginMutation, SpacesQuery } from '../../graphql/generated';
import userFactory from './user';

type PartialViewer = LoginMutation['modify']['viewer'] & SpacesQuery['viewer'];

const viewerFactory = Factory.define<PartialViewer>(({ associations }) => ({
  user: associations.user || userFactory.build(),
  organization: null,
  __typename: 'Viewer',
}));

export default viewerFactory;
