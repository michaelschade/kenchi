import { BranchTypeEnum, Prisma, Workflow } from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import collectionFactory from './collection';
import Factory from './factory';
import { AcceptNullForField, withDbNull, WithoutNull } from './typeHelpers';
import userFactory from './user';

type CreateInput = AcceptNullForField<
  'majorChangeDescription' | 'metadata',
  Prisma.WorkflowUncheckedCreateInput
>;

type MungedWorkflow = WithoutNull<'contents', Workflow>;

const workflowFactory = new (class extends Factory<
  CreateInput,
  MungedWorkflow
> {
  async defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<CreateInput>;
  }) {
    return {
      staticId: generateStaticId('wrkf'),
      name: `Workflow ${sequence}`,
      description: `Description of workflow ${sequence}`,
      contents: [
        {
          type: 'paragraph',
          children: [{ text: `Workflow content ${sequence}` }],
        },
      ],
      icon: null,
      keywords: ['joule', 'commute'],
      isLatest: true,
      isArchived: false,
      branchType: BranchTypeEnum.published,
      branchId: null,
      branchedFromId: null,
      collectionId:
        params.collectionId || (await collectionFactory.create()).id,
      createdByUserId:
        params.createdByUserId || (await userFactory.create()).id,
    };
  }

  async persist(createParams: CreateInput) {
    const workflow = await getDB().workflow.create({
      data: {
        ...createParams,
        majorChangeDescription: withDbNull(createParams.majorChangeDescription),
        metadata: withDbNull(createParams.metadata),
      },
    });
    return { ...workflow, contents: workflow.contents! };
  }
})();
export default workflowFactory;
