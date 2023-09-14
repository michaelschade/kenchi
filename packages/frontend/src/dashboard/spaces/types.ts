import type { Collection } from '../../collection/useCollections';

type PlaceholderDragItem = {
  index: number;
  formState: WidgetFormState & {
    type: Extract<WidgetFormState['type'], 'collection-placeholder'>;
  };
};
type DragItemWithValue = {
  index: number;
  formState: WidgetFormState & {
    type: Extract<WidgetFormState['type'], 'collection'>;
  };
  // TODO: once we work in widgets, this should probably be a non-null config rather than a collection
  data: Collection;
};
export type DragItem = PlaceholderDragItem | DragItemWithValue;
export function isPlaceholderDragItem(
  dragItem: DragItem
): dragItem is PlaceholderDragItem {
  return dragItem.formState.type === 'collection-placeholder';
}

export type WidgetFormState = {
  // TODO: Once we support widgets there will be more types
  type: 'collection' | 'collection-placeholder';
  id: string;
  editing: boolean;
  error?: string;
};
