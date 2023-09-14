import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { css } from '@emotion/react';
import {
  faArrowCircleRight,
  faChevronRight,
  faCog,
  faFolder,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { Link, useHistory } from 'react-router-dom';
import tw from 'twin.macro';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { MenuOpener } from '@kenchi/ui/lib/DropdownMenu';
import Emoji from '@kenchi/ui/lib/Emoji';
import { SectionHeader } from '@kenchi/ui/lib/Headers';

import EditCollectionModal from '../collection/EditCollectionModal';
import CreationMenu from '../components/CreationMenu';
import { CollectionListItemFragment } from '../graphql/generated';
import { useSelectableListItemContext } from '../list/SelectableList';
import ActionButton from '../previewTile/ActionButton';
import { PreviewRef } from '../previewTile/PreviewTile';
import { trackEvent } from '../utils/analytics';
import CollectionConfigurationMenu from './CollectionConfigurationMenu';
import { FullSectionConfig } from './useSpaceSettings';
import { applyToSection, sectionCollapsed } from './utils';

const style = css`
  display: flex;
  gap: 3px;
  align-items: center;
  white-space: nowrap;
  overflow-x: hidden;
  margin-bottom: 10px;

  h2 {
    flex-grow: 1;
    flex-shrink: 0;
    transition: flex-shrink 0.2s ease-in-out;
  }

  &:hover,
  &:active,
  &.selected {
    h2 {
      flex-shrink: 1;
    }
  }
`;

const headingStyle = css`
  display: inline-grid;
  grid-template-columns: 1fr max-content max-content;
  gap: 3px;
  align-items: center;

  & .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .split-type {
    color: hsla(1, 0%, 0%, 0.25);
    transform: scale(0.85);
  }
`;

const linkStyle = css`
  cursor: pointer;

  &:hover,
  &:focus {
    text-decoration: none;
  }

  .link-icon {
    color: rgb(109, 24, 105);
    width: 0;
    transform: scale(0);
    transition: transform 0.2s ease-in-out;

    .selected & {
      width: initial;
      transform: scale(0.9);
    }
  }
`;

type CollectionHeaderProps = {
  collection?: CollectionListItemFragment | null;
  name?: React.ReactNode;
  icon?: string;
  loading: boolean;
  settings: FullSectionConfig;
  onSettingsChange: (settings: FullSectionConfig) => void;
};

export default forwardRef(
  (
    {
      collection,
      name,
      icon,
      settings,
      onSettingsChange,
    }: CollectionHeaderProps,
    ref: React.Ref<PreviewRef>
  ) => {
    const { selected } = useSelectableListItemContext();
    const [creationMenuOpen, setCreationMenuOpen] = useState(false);
    const [configurationMenuOpen, setConfigurationMenuOpen] = useState(false);
    const [showEditCollectionModal, setShowEditCollectionModal] =
      useState(false);

    const openUrl = collection ? `/collections/${collection.id}` : null;
    const history = useHistory();

    const toggleCollapse = useCallback(
      (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          trackEvent({
            category: 'page_settings',
            action: 'toggle_collapse',
            source: 'menu',
          });
        } else {
          trackEvent({
            category: 'page_settings',
            action: 'toggle_collapse',
            source: 'shortcut_header',
          });
        }
        onSettingsChange(
          applyToSection(settings, { collapsed: !sectionCollapsed(settings) })
        );
      },
      [settings, onSettingsChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        exec: () => openUrl && history.push(openUrl),
        open: () => openUrl && history.push(openUrl),
        edit: () => {},
        toggleCollapse,
      }),
      [openUrl, history, toggleCollapse]
    );

    if (!name && !collection) {
      captureMessage(`Expected at least one of name or collection`, {
        extra: { settings },
      });
    }

    const title = name || collection?.name;

    const isCollapsed = sectionCollapsed(settings);

    const expansionTogglerIconContainerStyle = css`
      transform: rotate(${isCollapsed ? '0deg' : '90deg'});
      transition: transform 0.2s ease-in-out;
      width: 7px;
    `;

    // I am so sorry about this !important but it had to be done. Without this px width,
    // a subpixel rendering bug occurs in Chrome that makes the svg's visual width
    // change a bit when we apply a css transform rotation. And we need the !important
    // because otherwise the width from .svg-inline--fa.fa-w-10 wins, which I think comes
    // from FontAwesomeIcon
    const expansionTogglerIconStyle = css`
      width: 5px !important;
    `;

    const creationMenu = (
      <MenuOpener
        compact={true}
        menuContent={
          <CreationMenu
            analyticsCategory="collection-header"
            collectionId={collection?.id}
          />
        }
        onOpenChange={setCreationMenuOpen}
      >
        <ActionButton active={creationMenuOpen} color="grey" label="+ new" />
      </MenuOpener>
    );

    const configurationMenu = (
      <MenuOpener
        compact={true}
        css={css`
          width: 250px;
        `}
        menuContent={
          <CollectionConfigurationMenu
            collection={collection}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onEditCollection={() => setShowEditCollectionModal(true)}
            onToggleCollapse={toggleCollapse}
          />
        }
        onOpenChange={(open) => setConfigurationMenuOpen(open)}
      >
        <ActionButton
          color="grey"
          active={configurationMenuOpen}
          icon={faCog}
          title="Configure Collection"
        />
      </MenuOpener>
    );

    const heading = <span className="title">{title}</span>;

    return (
      <div
        css={style}
        className={
          selected || configurationMenuOpen || creationMenuOpen
            ? 'selected'
            : ''
        }
      >
        <div css={tw`flex-shrink-0 w-5`}>
          {icon && !collection?.icon && <Emoji emoji={icon} />}
          {!icon && collection?.icon && <Emoji emoji={collection.icon} />}
          {!icon && !collection?.icon && (
            <FontAwesomeIcon
              icon={faFolder}
              css={({ colors }: KenchiTheme) =>
                css`
                  color: ${colors.gray[7]};
                `
              }
              fixedWidth
            />
          )}
        </div>
        <SectionHeader>
          {openUrl ? (
            <Link to={openUrl} css={[headingStyle, linkStyle]}>
              {heading}
              <FontAwesomeIcon
                className="link-icon"
                icon={faArrowCircleRight}
                title="View collection"
              />
            </Link>
          ) : (
            <span css={headingStyle}>{heading}</span>
          )}
        </SectionHeader>
        {creationMenu}
        {configurationMenu}
        <ActionButton
          color="grey"
          onClick={toggleCollapse}
          title={`${isCollapsed ? 'Expand' : 'Collapse'} Collection (x)`}
        >
          <div css={expansionTogglerIconContainerStyle}>
            <FontAwesomeIcon
              icon={faChevronRight}
              size="sm"
              css={expansionTogglerIconStyle}
            />
          </div>
        </ActionButton>
        {collection && (
          <EditCollectionModal
            isOpen={showEditCollectionModal}
            id={collection.id}
            onBack={() => setShowEditCollectionModal(false)}
            onUpdate={() => setShowEditCollectionModal(false)}
          />
        )}
      </div>
    );
  }
);
