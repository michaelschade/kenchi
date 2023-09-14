import { memo, useCallback } from 'react';

import isEqual from 'fast-deep-equal';

import {
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/generated';
import {
  IndicatorPositionEnum,
  SelectableListItem,
} from '../list/SelectableList';
import { PreviewRef } from '../previewTile/PreviewTile';
import { trackEvent } from '../utils/analytics';
import Header from './Header';
import SectionItems from './SectionItems';
import {
  FullSpecialSectionConfig,
  UpdateSpaceSettings,
} from './useSpaceSettings';
import { applyToSection, sectionCollapsed } from './utils';

type SectionProps = {
  name: React.ReactNode;
  icon?: string;
  sectionConfig: FullSpecialSectionConfig;
  sectionItems: (WorkflowListItemFragment | ToolListItemFragment)[];
  topMap: Record<string, number>;
  update: UpdateSpaceSettings;
};

const SpecialSection = memo(
  ({
    name,
    icon,
    sectionConfig,
    sectionItems,
    topMap,
    update,
  }: SectionProps) => {
    const toggleCollapse = useCallback(() => {
      trackEvent({
        category: 'page_settings',
        action: 'toggle_collapse',
        source: 'shortcut_item',
      });
      update(
        applyToSection(sectionConfig, {
          collapsed: !sectionCollapsed(sectionConfig),
        })
      );
    }, [update, sectionConfig]);

    if (sectionItems.length === 0) {
      return null;
    }

    const header = (
      <SelectableListItem<PreviewRef>
        indicatorPosition={IndicatorPositionEnum.topHeader}
      >
        {(ref) => (
          <Header
            ref={ref}
            name={name}
            icon={icon}
            settings={sectionConfig}
            onSettingsChange={update}
            loading={false}
          />
        )}
      </SelectableListItem>
    );

    const analyticsSource = sectionConfig.key
      .replace(/^_+/, '')
      .replace('_', '-')
      .toLowerCase();

    if (sectionCollapsed(sectionConfig)) {
      return header;
    }

    return (
      <>
        {header}
        <SectionItems
          baseConfig={sectionConfig.userConfig}
          sectionItems={sectionItems}
          analyticsSource={analyticsSource}
          toggleCollapse={toggleCollapse}
          topMap={topMap}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    const { sectionConfig: prevSectionConfig, ...prevRest } = prevProps;
    const { sectionConfig: nextSectionConfig, ...nextRest } = nextProps;
    for (var key in nextRest) {
      if ((prevRest as any)[key] !== (nextRest as any)[key]) {
        return false;
      }
    }

    return isEqual(prevSectionConfig, nextSectionConfig);
  }
);

export default SpecialSection;
