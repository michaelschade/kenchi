import { BranchTypeEnum, Prisma, Tool } from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import collectionFactory from './collection';
import Factory from './factory';
import { AcceptNullForField, withDbNull, WithoutNull } from './typeHelpers';
import userFactory from './user';

type CreateInput = AcceptNullForField<
  'majorChangeDescription' | 'metadata',
  Prisma.ToolUncheckedCreateInput
>;

type MungedTool = WithoutNull<'inputs' | 'configuration', Tool>;

const toolFactory = new (class extends Factory<CreateInput, MungedTool> {
  async defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<CreateInput>;
  }) {
    return {
      staticId: generateStaticId('tool'),
      name: `tool ${sequence}`,
      icon: null,
      description: '',
      keywords: ['skeleton', '32 bits'],
      isLatest: true,
      isArchived: false,
      branchType: BranchTypeEnum.published,
      collectionId:
        params.collectionId || (await collectionFactory.create()).id,
      createdByUserId:
        params.createdByUserId || (await userFactory.create()).id,
      component: 'GmailAction',
      configuration: {
        data: {
          slate: true,
          singleLine: false,
          rich: true,
          children: [{ children: [{ text: `Snippet ${sequence}` }] }],
        },
      },
      inputs: [],
    };
  }

  async persist(createParams: CreateInput) {
    const tool = await getDB().tool.create({
      data: {
        ...createParams,
        majorChangeDescription: withDbNull(createParams.majorChangeDescription),
        metadata: withDbNull(createParams.metadata),
      },
    });
    return tool as MungedTool;
  }
})();

export default toolFactory;
