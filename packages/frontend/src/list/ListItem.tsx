import CollectionPreview from '../collection/CollectionPreview';
import { CollectionListItemFragment } from '../graphql/generated';
import { PreviewRef } from '../previewTile/PreviewTile';
import Tool from '../tool/Tool';
import { isWorkflow } from '../utils/versionedNode';
import WorkflowPreview from '../workflow/WorkflowPreview';
import { IndicatorPositionEnum, SelectableListItem } from './SelectableList';
import { ListItemType } from './useList';

type ListItemProps = {
  item: ListItemType | CollectionListItemFragment;
  analyticsSource: string;
  searchIndex?: number;
  toggleCollapse?: () => void;
  style?: React.CSSProperties;
  showTags?: boolean;
};
export default function ListItem({
  item,
  analyticsSource,
  searchIndex,
  toggleCollapse,
  showTags,
  style,
}: ListItemProps) {
  const defaultStyle = { marginBottom: '10px' };
  return (
    <SelectableListItem<PreviewRef>
      indicatorPosition={IndicatorPositionEnum.topPreviewTile}
    >
      {(ref) => {
        if (item.__typename === 'Collection') {
          return (
            <CollectionPreview
              collection={item}
              toggleCollapse={toggleCollapse}
              searchIndex={searchIndex}
              style={style || defaultStyle}
              showTags={showTags}
              ref={ref}
            />
          );
        } else if (isWorkflow(item)) {
          return (
            <WorkflowPreview
              workflow={item}
              toggleCollapse={toggleCollapse}
              searchIndex={searchIndex}
              style={style || defaultStyle}
              showTags={showTags}
              ref={ref}
            />
          );
        } else {
          return (
            <Tool
              tool={item}
              editType="page"
              analyticsSource={analyticsSource}
              searchIndex={searchIndex}
              toggleCollapse={toggleCollapse}
              style={style || defaultStyle}
              showTags={showTags}
              ref={ref}
            />
          );
        }
      }}
    </SelectableListItem>
  );
}
