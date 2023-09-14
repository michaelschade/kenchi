import { BranchTypeEnum, Prisma, Widget } from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import Factory from './factory';
import organizationFactory from './organization';
import { AcceptNullForField, withDbNull, WithoutNull } from './typeHelpers';
import userFactory from './user';

type CreateInput = AcceptNullForField<
  'majorChangeDescription' | 'metadata',
  Prisma.WidgetUncheckedCreateInput
>;

type MungedWidget = WithoutNull<'contents', Widget>;

const widgetFactory = new (class extends Factory<CreateInput, MungedWidget> {
  async defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<CreateInput>;
  }) {
    return {
      staticId: generateStaticId('wdgt'),
      contents: [
        {
          type: 'paragraph',
          children: [{ text: `Widget content ${sequence}` }],
        },
      ],
      inputs: [],
      isLatest: true,
      isArchived: false,
      branchType: BranchTypeEnum.published,
      branchId: null,
      branchedFromId: null,
      organizationId:
        params.organizationId || (await organizationFactory.create()).id,
      createdByUserId:
        params.createdByUserId || (await userFactory.create()).id,
    };
  }

  async persist(createParams: CreateInput) {
    const widget = await getDB().widget.create({
      data: {
        ...createParams,
        majorChangeDescription: withDbNull(createParams.majorChangeDescription),
        metadata: withDbNull(createParams.metadata),
      },
    });
    return { ...widget, contents: widget.contents! };
  }
})();
export default widgetFactory;
