import { Factory } from 'fishery';
import { padStart } from 'lodash';

import {
  BranchTypeEnum,
  ViewSuggestionQuery,
  WorkflowFragment,
  WorkflowLatest,
} from '../../graphql/generated';
import collectionFactory from './collection';
import connectionHelper from './connectionHelper';
import workflowRevisionFactory, {
  PartialWorkflowRevision,
} from './workflowRevision';

export const workflowsConnection = (workflows: PartialWorkflow[]) => {
  return connectionHelper<PartialWorkflow['branches']>(
    'WorkflowLatestConnection',
    'WorkflowLatestEdge',
    workflows
  );
};

export const workflowsRevisionsConnection = (
  workflowRevisions: PartialWorkflowRevision[]
) => {
  return connectionHelper<PartialWorkflow['publishedVersions']>(
    'WorkflowRevisionConnection',
    'WorkflowRevisionEdge',
    workflowRevisions
  );
};

type SuggestionWorkflow = Extract<
  ViewSuggestionQuery['workflow'],
  { __typename: 'WorkflowLatest' }
>;

export type PartialWorkflow = Omit<WorkflowFragment, '__typename'> &
  Pick<SuggestionWorkflow, 'publishedVersions' | 'branchedFrom'> &
  Pick<WorkflowLatest, '__typename' | 'lastListFetch'>;

class WorkflowFactory extends Factory<PartialWorkflow> {
  withBranches(branches: PartialWorkflow[]) {
    return this.params({ branches: workflowsConnection(branches) });
  }

  withBranchId() {
    return this.params({
      branchId: `wbrch_${padStart(this.sequence().toString(), 4, '0')}`,
    });
  }

  isSuggestion({
    originalContents,
  }: {
    originalContents?: KenchiGQL.SlateNodeArray;
  }) {
    return this.withBranchId().afterBuild((workflow) => {
      workflow.branchType = BranchTypeEnum.suggestion;
      workflow.branches = workflowsConnection([workflow]);
      workflow.branchedFrom = workflowRevisionFactory
        .fromWorkflow(workflow)
        .build({ contents: originalContents });
    });
  }

  fromRevision(workflowRevision: PartialWorkflowRevision) {
    const {
      id,
      staticId,
      icon,
      name,
      keywords,
      branchId,
      subscribed,
      collection,
      description,
      contents,
      createdAt,
    } = workflowRevision;
    return this.params({
      id,
      staticId,
      icon,
      name,
      keywords,
      branchId,
      subscribed,
      collection,
      description,
      contents,
      createdAt,
    });
  }
}
const workflowFactory = WorkflowFactory.define(({ sequence, associations }) => {
  const paddedSequence = padStart(sequence.toString(), 4, '0');

  return {
    __typename: 'WorkflowLatest' as const,
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
    archiveReason: null,
    createdAt: new Date().toLocaleDateString(),
    lastListFetch: new Date().toLocaleDateString(),
    // The type limited user is actually a little complicated,
    // there are a number of shapes that all have this __typename
    // for now hack in a user but this should delgate to a factory
    createdByUser: {
      __typename: 'LimitedUser' as const,
      email: `user${paddedSequence}@kenchi.com`,
      id: `user_${paddedSequence}`,
      name: `Firstname${paddedSequence} Surname${paddedSequence}`,
    },
    branches: associations.branches || workflowsConnection([]),
    branchedFrom: null,
    publishedVersions: workflowsRevisionsConnection([
      workflowRevisionFactory.build({ id: `wref_${paddedSequence}` }),
    ]),
  };
});

export default workflowFactory;
