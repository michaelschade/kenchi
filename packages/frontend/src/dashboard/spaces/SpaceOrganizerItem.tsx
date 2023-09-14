import { useEffect, useRef } from 'react';

import { faFolder, faQuestion } from '@fortawesome/pro-solid-svg-icons';
import { useDrag, useDrop } from 'react-dnd';

import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';

import { ActionableItem } from '../../components/ActionableItem';
import { DragItem, isPlaceholderDragItem } from './types';

type Props = {
  type: string;
  item: DragItem;
  onHover?: (position: 'before' | 'after') => void;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
};

export const SpaceOrganizerItem = ({
  type,
  item,
  onHover,
  onAdd,
  onRemove,
  onEdit,
}: Props) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, dragRef, preview] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type,
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    preview(previewRef);
  }, [preview]);

  const [, dropRef] = useDrop<DragItem, void, void>({
    accept: ['selectedCollection', 'availableCollection'],
    hover: onHover
      ? (dragItem, monitor) => {
          if (!measureRef.current) return;

          const { bottom, top } = measureRef.current.getBoundingClientRect();
          const dropCenter = (bottom - top) / 2;

          const dragOffsetY = monitor.getClientOffset()?.y || 0;
          const dragY = dragOffsetY - top;

          onHover(dragY < dropCenter ? 'before' : 'after');
        }
      : undefined,
  });
  const { name, emoji, fallbackIcon } = isPlaceholderDragItem(item)
    ? {
        name: <em>'Select a collection'</em>,
        emoji: undefined,
        fallbackIcon: faQuestion,
      }
    : {
        name: item.data.name || <em>Unnamed</em>,
        emoji: item.data.icon,
        fallbackIcon: faFolder,
      };

  return (
    <div ref={dropRef}>
      <div ref={measureRef}>
        <ActionableItem
          ref={dragRef}
          previewRef={previewRef}
          draggable
          isDragging={isDragging}
          editing={item.formState.editing}
          label={
            <NameWithEmoji
              name={name}
              emoji={emoji}
              fallbackIcon={fallbackIcon}
            />
          }
          onAdd={onAdd}
          onRemove={onRemove}
          onEdit={onEdit}
          error={!!item.formState.error}
        />
      </div>
    </div>
  );
};
