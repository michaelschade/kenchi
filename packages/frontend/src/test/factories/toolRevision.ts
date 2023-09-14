import { Factory } from 'fishery';
import { padStart } from 'lodash';

import { BranchTypeEnum, ToolRevision } from '../../graphql/generated';
import collectionFactory from './collection';
import { PartialTool, toolsConnection } from './tool';

export type PartialToolRevision = Omit<PartialTool, '__typename'> &
  Pick<ToolRevision, '__typename' | 'isLatest'>;

class ToolRevisionFactory extends Factory<PartialToolRevision> {
  fromTool(workflow: PartialTool) {
    const {
      staticId,
      icon,
      name,
      keywords,
      collection,
      description,
      component,
      inputs,
      configuration,
      isArchived,
    } = workflow;
    return this.params({
      staticId,
      icon,
      name,
      keywords,
      collection,
      description,
      component,
      inputs,
      configuration,
      isArchived,
      isLatest: true,
    });
  }

  withBranchId() {
    return this.params({
      branchId: `tbrch_${padStart(this.sequence().toString(), 4, '0')}`,
    });
  }
}
const toolRevisionFactory = ToolRevisionFactory.define(
  ({ sequence, associations }) => {
    const paddedSequence = padStart(sequence.toString(), 4, '0');
    return {
      __typename: 'ToolRevision' as const,
      id: `trev_${paddedSequence}`,
      staticId: `tool_${paddedSequence}`,
      icon: null,
      name: `Snippet revision ${paddedSequence}`,
      keywords: [],
      branchId: null,
      branchType: BranchTypeEnum.published,
      subscribed: true,
      hasActiveNotifications: false,
      collection: associations.collection || collectionFactory.build(),
      description: `This is snippet revision ${paddedSequence}`,
      component: 'GmailAction',
      inputs: [],
      configuration: {},
      majorChangeDescription: null,
      isArchived: false,
      isLatest: true,
      archiveReason: null,
      createdAt: new Date().toLocaleDateString(),
      lastListFetch: new Date().toLocaleDateString(),
      // The type limited user is actually a little complicated,
      // there are a number of shapes that all have this __typename
      // for now hack in a user but this should delegate to a factory
      createdByUser: {
        __typename: 'LimitedUser' as const,
        email: `user${paddedSequence}@kenchi.com`,
        id: `user_${paddedSequence}`,
        name: `Firstname${paddedSequence} Surname${paddedSequence}`,
      },
      branches: toolsConnection([]),
    };
  }
);

export default toolRevisionFactory;
