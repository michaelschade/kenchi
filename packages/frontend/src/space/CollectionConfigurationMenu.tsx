import { useCallback } from 'react';

import { faMinus, faPencilAlt, faPlus } from '@fortawesome/pro-solid-svg-icons';
import updateObj from 'immutability-helper';

import {
  MenuItemLink,
  MenuItemRadio,
  MenuRadioGroup,
  MenuSection,
} from '@kenchi/ui/lib/DropdownMenu';

import { CollectionListItemFragment } from '../graphql/generated';
import { useHasCollectionPermission } from '../graphql/useSettings';
import { trackEvent } from '../utils/analytics';
import {
  DEFAULT_SECTION_FIRST,
  FullSectionConfig,
  SortType,
} from './useSpaceSettings';
import { applyToSection, sectionCollapsed } from './utils';

const LIMIT_OPTIONS: number[] = [5, 10, 0];
const SORT_OPTIONS: [SortType, string][] = [
  ['alphabetical', 'Name'],
  ['topUsed', 'Your most used'],
];

enum ShowType {
  toolsFirst = 'toolsFirst',
  workflowsFirst = 'workflowsFirst',
  toolsOnly = 'toolsOnly',
  workflowsOnly = 'workflowsOnly',
}

const SHOW_OPTIONS: [ShowType, string][] = [
  [ShowType.workflowsFirst, 'Playbooks then Snippets'],
  [ShowType.toolsFirst, 'Snippets then Playbooks'],
  [ShowType.workflowsOnly, 'Only Playbooks'],
  [ShowType.toolsOnly, 'Only Snippets'],
];

function getShowOption(settings: FullSectionConfig): ShowType | null {
  if (settings.type === 'special') {
    return null;
  }

  const first = settings.userConfig.first || DEFAULT_SECTION_FIRST;

  if (settings.userConfig.tools && settings.userConfig.tools?.hidden) {
    return ShowType.workflowsOnly;
  } else if (
    settings.userConfig.workflows &&
    settings.userConfig.workflows?.hidden
  ) {
    return ShowType.toolsOnly;
  } else if (first === 'tools') {
    return ShowType.toolsFirst;
  } else {
    return ShowType.workflowsFirst;
  }
}

function ShowMenuList({
  settings,
  onSettingsChange,
}: {
  settings: FullSectionConfig;
  onSettingsChange: (settings: FullSectionConfig) => void;
}) {
  const setOption = useCallback(
    (option: ShowType) => {
      if (settings.type === 'special') {
        return;
      }
      let first: 'tools' | 'workflows' = 'workflows';
      let toolsHidden = false;
      let workflowsHidden = false;
      switch (option) {
        case ShowType.toolsFirst:
          first = 'tools';
          break;
        case ShowType.workflowsFirst:
          break;
        case ShowType.toolsOnly:
          first = 'tools';
          workflowsHidden = true;
          break;
        case ShowType.workflowsOnly:
          toolsHidden = true;
          break;
      }
      const newSettings = updateObj(settings, {
        userConfig: {
          first: { $set: first },
          tools: { hidden: { $set: toolsHidden } },
          workflows: { hidden: { $set: workflowsHidden } },
        },
      });
      onSettingsChange(newSettings);
    },
    [settings, onSettingsChange]
  );

  if (settings.type === 'special') {
    return null;
  }

  const currentOption = getShowOption(settings);

  return (
    <MenuSection title="Show...">
      <MenuRadioGroup
        value={currentOption?.toString()}
        onValueChange={(v) => setOption(v as ShowType)}
      >
        {SHOW_OPTIONS.map(([option, text]) => (
          <MenuItemRadio
            key={option}
            value={option.toString()}
            onSelect={(e) => e.preventDefault()}
          >
            {text}
          </MenuItemRadio>
        ))}
      </MenuRadioGroup>
    </MenuSection>
  );
}

export default function CollectionConfigurationMenu({
  collection,
  settings,
  onSettingsChange,
  onEditCollection,
  onToggleCollapse,
}: {
  collection: CollectionListItemFragment | null | undefined;
  settings: FullSectionConfig;
  onSettingsChange: (settings: FullSectionConfig) => void;
  onEditCollection: () => void;
  onToggleCollapse: () => void;
}) {
  const setLimit = useCallback(
    (limit: number) => {
      trackEvent({
        category: 'page_settings',
        action: 'set_limit',
        source: 'menu',
        value: limit,
      });
      onSettingsChange(applyToSection(settings, { limit }));
    },
    [settings, onSettingsChange]
  );

  const setSort = useCallback(
    (sort: SortType) => {
      trackEvent({
        category: 'page_settings',
        action: 'set_sort',
        source: 'menu',
      });
      onSettingsChange(applyToSection(settings, { sort }));
    },
    [settings, onSettingsChange]
  );

  const limit =
    settings.userConfig.type === 'collection'
      ? settings.userConfig.tools?.limit ??
        settings.userConfig.workflows?.limit ??
        5
      : settings.userConfig.limit ?? 5;
  const sort =
    settings.userConfig.type === 'collection'
      ? settings.userConfig.tools?.sort ??
        settings.userConfig.workflows?.sort ??
        'alphabetical'
      : settings.userConfig.sort ?? 'alphabetical';

  const showOption = getShowOption(settings);
  const hasMultipleTypesVisible =
    showOption === ShowType.workflowsFirst ||
    showOption === ShowType.toolsFirst;
  const canEditCollection = useHasCollectionPermission(
    collection?.id ?? null,
    'manage_collection_permissions'
  );

  const isCollapsed = sectionCollapsed(settings);

  return (
    <>
      {collection && canEditCollection && (
        <MenuItemLink icon={faPencilAlt} onClick={onEditCollection}>
          Edit
        </MenuItemLink>
      )}
      <MenuItemLink
        onClick={onToggleCollapse}
        icon={isCollapsed ? faPlus : faMinus}
      >
        {isCollapsed ? 'Expand' : 'Collapse'}
      </MenuItemLink>
      <ShowMenuList settings={settings} onSettingsChange={onSettingsChange} />
      <MenuSection title="Limit to...">
        <MenuRadioGroup
          value={limit.toString()}
          onValueChange={(v) => setLimit(parseInt(v))}
        >
          {LIMIT_OPTIONS.map((optionLimit) => {
            let name;
            if (optionLimit === 0) {
              switch (showOption) {
                case ShowType.workflowsFirst:
                case ShowType.toolsFirst:
                  name = 'Show everything';
                  break;
                case ShowType.toolsOnly:
                  name = 'Show all snippets';
                  break;
                case ShowType.workflowsOnly:
                  name = 'Show all playbooks';
                  break;
              }
            } else if (hasMultipleTypesVisible) {
              name = `${optionLimit} of each type`;
            } else {
              name = `${optionLimit} items`;
            }
            return (
              <MenuItemRadio
                key={optionLimit}
                value={optionLimit.toString()}
                onSelect={(e) => e.preventDefault()}
              >
                {name}
              </MenuItemRadio>
            );
          })}
        </MenuRadioGroup>
      </MenuSection>
      <MenuSection
        title={`Order${hasMultipleTypesVisible ? ' items' : ''} by...`}
      >
        <MenuRadioGroup
          value={sort}
          onValueChange={(v) => setSort(v as SortType)}
        >
          {SORT_OPTIONS.map(([optionSort, name]) => {
            return (
              <MenuItemRadio
                key={optionSort}
                value={optionSort}
                onSelect={(e) => e.preventDefault()}
              >
                {name}
              </MenuItemRadio>
            );
          })}
        </MenuRadioGroup>
      </MenuSection>
    </>
  );
}
