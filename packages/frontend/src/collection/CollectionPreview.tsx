import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { faArrowCircleRight } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';

import { CollectionListItemFragment } from '../graphql/generated';
import ActionButton from '../previewTile/ActionButton';
import ItemIcon from '../previewTile/PreviewIcon';
import PreviewTile, { PreviewRef } from '../previewTile/PreviewTile';
import { ItemTypeTag } from '../previewTile/Tags';
import { useSearchAnalytics } from '../search/useSearch';
import { sendToView } from '../utils/history';

type Props = {
  collection: CollectionListItemFragment;
  toggleCollapse?: () => void;
  searchIndex?: number;
  showTags?: boolean;
  style?: React.CSSProperties;
};

export default forwardRef(
  (
    { collection, toggleCollapse, searchIndex, style = {}, showTags }: Props,
    ref: React.Ref<PreviewRef>
  ) => {
    const history = useHistory();
    const { trackSearchEvent } = useSearchAnalytics();
    const divRef = useRef<HTMLDivElement>(null);

    const open = useCallback(() => {
      if (searchIndex !== undefined) {
        trackSearchEvent('click', collection.id, searchIndex + 1);
      }
      sendToView(history, collection);
    }, [searchIndex, history, collection, trackSearchEvent]);

    useImperativeHandle(
      ref,
      () => ({
        exec: open,
        open,
        toggleCollapse,
      }),
      [open, toggleCollapse]
    );

    const { name, description } = collection;

    const actionButtons = (
      <ActionButton
        primary={true}
        color="blue"
        label="open"
        icon={faArrowCircleRight}
        onClick={open}
      />
    );

    return (
      <PreviewTile
        ref={divRef}
        name={name}
        description={description}
        tags={showTags && <ItemTypeTag itemType="collection" />}
        icon={<ItemIcon item={collection} />}
        onClick={open}
        style={style}
        actionButtons={actionButtons}
      />
    );
  }
);
