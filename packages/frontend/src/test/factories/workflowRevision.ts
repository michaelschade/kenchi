import { Factory } from 'fishery';
import { padStart } from 'lodash';

import { BranchTypeEnum, WorkflowRevision } from '../../graphql/generated';
import collectionFactory from './collection';
import {
  PartialWorkflow,
  workflowsConnection,
  workflowsRevisionsConnection,
} from './workflow';

export type PartialWorkflowRevision = Omit<PartialWorkflow, '__typename'> &
  Pick<WorkflowRevision, '__typename' | 'isLatest'>;

class WorkflowRevisionFactory extends Factory<PartialWorkflowRevision> {
  fromWorkflow(workflow: PartialWorkflow) {
    const {
      staticId,
      icon,
      name,
      keywords,
      subscribed,
      collection,
      description,
      contents,
      isArchived,
    } = workflow;
    return this.params({
      staticId,
      icon,
      name,
      keywords,
      subscribed,
      collection,
      description,
      contents,
      isArchived,
      isLatest: true,
    });
  }

  withBranchId() {
    return this.params({
      branchId: `wbrch_${padStart(this.sequence().toString(), 4, '0')}`,
    });
  }
}
const workflowRevisionFactory = WorkflowRevisionFactory.define(
  ({ sequence, associations }) => {
    const paddedSequence = padStart(sequence.toString(), 4, '0');
    return {
      __typename: 'WorkflowRevision' as const,
      id: `wref_${paddedSequence}`,
      staticId: `wrkf_${paddedSequence}`,
      icon: null,
      name: `Playbook ${paddedSequence}`,
      keywords: [],
      branchId: null,
      branchType: BranchTypeEnum.published,
      subscribed: true,
      hasActiveNotifications: false,
      collection: associations.collection || collectionFactory.build(),
      description: `This is playbook ${paddedSequence}`,
      // Contents could be a fancy factory that makes it easy to generate
      // the various nodes and children, but starting with the minimal thing for now.
      contents: [{ text: `Text content ${paddedSequence}` }],
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
      branches: workflowsConnection([]),
      branchedFrom: null,
      publishedVersions: workflowsRevisionsConnection([]),
    };
  }
);

export default workflowRevisionFactory;
