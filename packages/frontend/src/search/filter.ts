import { CollectionListItemFragment } from '../graphql/generated';
import { ListItemType } from '../list/useList';
import { isTool, isWorkflow } from '../utils/versionedNode';

export enum ObjectTypeEnum {
  playbook = 'playbook',
  snippet = 'snippet',
  collection = 'collection',
}

export type SearchFilters = {
  type?: ObjectTypeEnum | ObjectTypeEnum[];
  collectionIds?: string[];
  demoCollectionId?: string;
  shouldOnlyIncludeDemoCollection?: boolean;
};

export const translateFiltersToAlgoliaFiltersParam = (
  filters: SearchFilters
): string => {
  // See the filters syntax at https://www.algolia.com/doc/api-reference/api-parameters/filters/
  const {
    type,
    collectionIds,
    shouldOnlyIncludeDemoCollection,
    demoCollectionId,
  } = filters;
  const filtersArray = [];

  if (type) {
    const types = Array.isArray(type) ? type : [type];
    const typeFilter = types.map((type) => `type:${type}`).join(' OR ');
    filtersArray.push(`(${typeFilter})`);
  }

  if (collectionIds) {
    const collectionIdFilter = collectionIds
      .map((collectionId) => `collection.id:${collectionId}`)
      .join(' OR ');
    filtersArray.push(`(${collectionIdFilter})`);
  }

  if (shouldOnlyIncludeDemoCollection && demoCollectionId) {
    filtersArray.push(`(collection.id:${demoCollectionId})`);
  }

  return filtersArray.join(' AND ');
};

type FilterFn = (item: ListItemType | CollectionListItemFragment) => boolean;
type FilterFns = FilterFn[];

export const translateFiltersToFunction = (
  filters: SearchFilters
): FilterFn => {
  const {
    type,
    collectionIds,
    shouldOnlyIncludeDemoCollection,
    demoCollectionId,
  } = filters;
  const filterFns: FilterFns = [];

  if (type) {
    const types = Array.isArray(type) ? type : [type];
    const typeFilterFn = (item: ListItemType | CollectionListItemFragment) =>
      (item.__typename === 'Collection' &&
        types.includes(ObjectTypeEnum.collection)) ||
      (isWorkflow(item) && types.includes(ObjectTypeEnum.playbook)) ||
      (isTool(item) && types.includes(ObjectTypeEnum.snippet));
    filterFns.push(typeFilterFn);
  }

  if (collectionIds) {
    const collectionIdsArray = Array.isArray(collectionIds)
      ? collectionIds
      : [collectionIds];
    const collectionIdSet = new Set(collectionIdsArray);
    const collectionFilterFn = (
      item: CollectionListItemFragment | ListItemType
    ) => {
      const collectionId =
        item.__typename === 'Collection' ? item.id : item.collection.id;
      return collectionIdSet.has(collectionId);
    };
    filterFns.push(collectionFilterFn);
  }

  if (shouldOnlyIncludeDemoCollection && demoCollectionId) {
    const demoCollectionFilterFn: FilterFn = (item) => {
      const collectionId =
        item.__typename === 'Collection' ? item.id : item.collection.id;
      return collectionId === demoCollectionId;
    };
    filterFns.push(demoCollectionFilterFn);
  }

  return (item: ListItemType | CollectionListItemFragment) => {
    return filterFns.every((filterFn) => filterFn(item));
  };
};
