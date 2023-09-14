import sortBy from 'lodash/sortBy';

import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/generated';
import ListItem from '../list/ListItem';
import {
  DEFAULT_SECTION_LIMIT,
  UserBaseSectionConfig,
} from './useSpaceSettings';

type ListItemFragment = WorkflowListItemFragment | ToolListItemFragment;
export type SectionItemsProps = {
  baseConfig?: UserBaseSectionConfig;
  sectionItems: ListItemFragment[];
  topMap: Record<string, number>;
  toggleCollapse: () => void;
  analyticsSource: string;
  lastItemStyle?: React.CSSProperties;
};

export default function SectionItems({
  baseConfig = {},
  sectionItems,
  topMap,
  toggleCollapse,
  analyticsSource,
  lastItemStyle,
}: SectionItemsProps) {
  let sort;
  switch (baseConfig.sort) {
    case 'topUsed':
      sort = (item: ToolListItemFragment | WorkflowListItemFragment) => {
        const eolAlphabetical = `9999-${item.name}`;
        if (!topMap) {
          return eolAlphabetical;
        }
        const index = topMap[item.staticId];
        return index === undefined ? eolAlphabetical : index.toString();
      };
      break;
    case 'alphabetical':
    default:
      sort = (item: ToolListItemFragment | WorkflowListItemFragment) =>
        item.name.toLowerCase();
      break;
  }
  let sortedItems = sortBy(sectionItems, sort);
  if (baseConfig.limit) {
    sortedItems = sortedItems.slice(
      0,
      baseConfig.limit || DEFAULT_SECTION_LIMIT
    );
  }

  return (
    <>
      {sortedItems.map((item, i) => (
        <ListItem
          key={item.id}
          item={item}
          analyticsSource={analyticsSource}
          toggleCollapse={toggleCollapse}
          style={i === sortedItems.length - 1 ? lastItemStyle : undefined}
        />
      ))}
    </>
  );
}
