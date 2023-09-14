import { Factory } from 'fishery';
import { padStart } from 'lodash';

import {
  BranchTypeEnum,
  ToolFragment,
  ToolLatest,
} from '../../graphql/generated';
import collectionFactory from './collection';
import connectionHelper from './connectionHelper';

export type PartialTool = ToolFragment &
  Pick<ToolLatest, 'lastListFetch' | '__typename'>;

export const toolsConnection = (tools: PartialTool[]) => {
  return connectionHelper<PartialTool['branches']>(
    'ToolLatestConnection',
    'ToolLatestEdge',
    tools
  );
};

const toolFactory = Factory.define<PartialTool>(
  ({ sequence, associations }) => {
    // If tools are ever sorted by a field that contains the sequence,
    // padding with leading zeroes makes arrays easier to deal with.
    const paddedSequence = padStart(sequence.toString(), 4, '0');
    return {
      __typename: 'ToolLatest',
      id: `trev_${paddedSequence}`,
      staticId: `tool_${paddedSequence}`,
      icon: '/path/to/icon.png',
      name: `Snippet ${paddedSequence}`,
      keywords: [],
      branchId: null,
      branchType: BranchTypeEnum.published,
      hasActiveNotifications: false,
      collection: associations.collection || collectionFactory.build(),
      description: `This is snippet ${paddedSequence}`,
      component: 'GmailAction',
      inputs: [],
      configuration: {},
      majorChangeDescription: null,
      isArchived: false,
      archiveReason: null,
      createdAt: new Date().toLocaleDateString(),
      lastListFetch: new Date().toLocaleDateString(),
      // The type limited user is actually a little complicated,
      // there are a number of shapes that all have this __typename
      // for now hack in a user but this should delgate to a factory
      createdByUser: {
        __typename: 'LimitedUser',
        email: `user${paddedSequence}@kenchi.com`,
        id: `user_${paddedSequence}`,
        name: `Firstname${paddedSequence} Surname${paddedSequence}`,
      },
      branches: toolsConnection([]),
    };
  }
);

export default toolFactory;
