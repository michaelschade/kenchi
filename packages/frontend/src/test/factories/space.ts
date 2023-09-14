import { Factory } from 'fishery';
import { padStart } from 'lodash';

import { SpaceLatest } from '../../graphql/generated';
import { PartialCollection } from './collection';

export type PartialSpace = Pick<
  SpaceLatest,
  '__typename' | 'staticId' | 'name' | 'branchId' | 'settings' | 'widgets'
>;

class SpaceFactory extends Factory<PartialSpace> {
  containingCollections(collections: PartialCollection[]) {
    return this.params({
      widgets: collections.map((collection) => ({
        collectionId: collection.id,
        type: 'widget-collection',
        children: [{ text: '' }],
      })),
    });
  }
}

const spaceFactory = SpaceFactory.define(({ sequence }) => {
  const paddedSequence = padStart(sequence.toString(), 4, '0');
  return {
    __typename: 'SpaceLatest' as const,
    staticId: `spce-${paddedSequence}`,
    name: `Space ${paddedSequence}`,
    branchId: null,
    settings: null,
    widgets: [],
  };
});

export default spaceFactory;
