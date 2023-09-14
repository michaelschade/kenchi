import classNames from 'classnames';
import { useDrop } from 'react-dnd';

import { DragItem } from './types';

type Props = {
  className?: string;
  children: React.ReactNode;
  type: string;
  accept: string[];
  onDrop: (item: DragItem) => void;
};

export const SpaceOrganizerZone = ({
  className,
  children,
  type,
  accept,
  onDrop,
}: Props) => {
  const [{ isOver, canDrop, sameType }, dropRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean; sameType: boolean }
  >({
    accept,
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      sameType: monitor.getItemType() === type,
    }),
  });

  return (
    <div
      ref={dropRef}
      className={classNames(className, { isOver, canDrop, sameType })}
    >
      {children}
    </div>
  );
};
