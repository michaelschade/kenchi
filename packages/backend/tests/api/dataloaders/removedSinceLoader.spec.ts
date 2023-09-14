import removedSinceLoader from '../../../api/dataloaders/removedSinceLoader';
import collectionFactory from '../../helpers/factories/collection';
import toolFactory from '../../helpers/factories/tool';

type TestTool = Awaited<ReturnType<typeof toolFactory.create>>;

async function makeMovedTool(
  originalCollectionId: number,
  steps = 2
): Promise<TestTool[]> {
  const rtn: TestTool[] = [];
  for (let i = 0; i < steps; i++) {
    rtn.push(
      await toolFactory.create({
        isLatest: false,
        ...(i === 0
          ? { collectionId: originalCollectionId }
          : { previousVersionId: rtn[i - 1].id }),
      })
    );
  }
  return rtn;
}

it('single collection IDs', async () => {
  const collection = await collectionFactory.create();
  const [tool1] = await makeMovedTool(collection.id, 3);
  const [tool2] = await makeMovedTool(collection.id, 3);

  const res = await removedSinceLoader('tools').load([
    collection.id,
    new Date(tool1.createdAt.getTime() - 1000),
  ]);
  expect(res).toStrictEqual([tool1.staticId, tool2.staticId]);
});

it('multiple collection IDs', async () => {
  const collection1 = await collectionFactory.create();
  const [tool1a] = await makeMovedTool(collection1.id);
  const [tool1b] = await makeMovedTool(collection1.id);
  const collection2 = await collectionFactory.create();
  const [tool2] = await makeMovedTool(collection2.id);

  const [res1, res2] = await Promise.all([
    removedSinceLoader('tools').load([
      collection1.id,
      new Date(tool1a.createdAt.getTime() - 1000),
    ]),
    removedSinceLoader('tools').load([
      collection2.id,
      new Date(tool2.createdAt.getTime() - 1000),
    ]),
  ]);
  expect(res1).toStrictEqual([tool1a.staticId, tool1b.staticId]);
  expect(res2).toStrictEqual([tool2.staticId]);
});

it('respects different since params across multiple collection IDs', async () => {
  const collection1 = await collectionFactory.create();
  const collection2 = await collectionFactory.create();

  const [tool1a] = await makeMovedTool(collection1.id);
  const [_tool2a] = await makeMovedTool(collection2.id);
  const [tool1b] = await makeMovedTool(collection1.id);
  const [tool2b] = await makeMovedTool(collection2.id);

  const [res1, res2] = await Promise.all([
    removedSinceLoader('tools').load([
      collection1.id,
      new Date(tool1a.createdAt.getTime() - 1000),
    ]),
    removedSinceLoader('tools').load([
      collection2.id,
      new Date(tool2b.createdAt.getTime() - 1),
    ]),
  ]);
  expect(res1).toStrictEqual([tool1a.staticId, tool1b.staticId]);
  expect(res2).toStrictEqual([tool2b.staticId]);
});

it('handles all-sinceless queries', async () => {
  const collection1 = await collectionFactory.create();
  await makeMovedTool(collection1.id);
  const collection2 = await collectionFactory.create();
  await makeMovedTool(collection2.id);

  const [res1, res2] = await Promise.all([
    removedSinceLoader('tools').load([collection1.id, null]),
    removedSinceLoader('tools').load([collection2.id, null]),
  ]);
  expect(res1).toStrictEqual([]);
  expect(res2).toStrictEqual([]);
});
