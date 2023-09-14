import { forwardRef, memo, useCallback, useImperativeHandle } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import isEqual from 'fast-deep-equal';
import { useHistory } from 'react-router-dom';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Eyebrow } from '@kenchi/ui/lib/Headers';
import { Link } from '@kenchi/ui/lib/Text';

import {
  CollectionListItemFragment,
  ToolListItemFragment,
  WorkflowListItemFragment,
} from '../graphql/generated';
import {
  IndicatorPositionEnum,
  SelectableListItem,
} from '../list/SelectableList';
import { PreviewRef } from '../previewTile/PreviewTile';
import { formatNumber, pluralize } from '../utils';
import { trackEvent } from '../utils/analytics';
import Header from './Header';
import SectionItems from './SectionItems';
import {
  DEFAULT_SECTION_FIRST,
  DEFAULT_SECTION_LIMIT,
  FullCollectionSectionConfig,
  UpdateSpaceSettings,
  UserBaseSectionConfig,
} from './useSpaceSettings';
import { applyToSection, sectionCollapsed } from './utils';

const SectionSubheader = styled(Eyebrow)`
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const listTextStyle = ({ colors }: KenchiTheme) => css`
  display: block;
  color: ${colors.gray[11]};
  font-size: 0.8em;
  font-weight: 400;
  margin-bottom: 10px;
  transition: color 0.2s ease-in-out;

  &.show-more {
    text-align: center;
    margin-bottom: 5px;
  }

  .selectable-selected &,
  &:hover {
    text-decoration: none;
    color: ${colors.gray[12]};
  }
`;

type ShowMoreProps = {
  baseConfig: UserBaseSectionConfig | undefined;
  baseNumber: number;
  baseName: 'snippet' | 'playbook';
  otherConfig: UserBaseSectionConfig | undefined;
  otherNumber: number;
  otherName: 'snippet' | 'playbook';
  collection: CollectionListItemFragment;
  toggleCollapse: () => void;
  additionalNumber?: number;
  additionalName?: string;
};

function needsShowMore(
  baseConfig: UserBaseSectionConfig | undefined,
  baseNumber: number,
  otherConfig: UserBaseSectionConfig | undefined,
  otherNumber: number
) {
  const limit = baseConfig?.limit || DEFAULT_SECTION_LIMIT;
  const showingAll = limit === 0 || limit >= baseNumber;
  const otherHidden = otherConfig?.hidden === true;
  return !showingAll || (otherHidden && otherNumber > 0);
}

const ShowMoreImpl = forwardRef(
  (
    {
      collection,
      baseConfig,
      baseNumber,
      baseName,
      otherConfig,
      otherNumber,
      otherName,
      toggleCollapse,
    }: ShowMoreProps,
    ref: React.Ref<PreviewRef>
  ) => {
    const openUrl = `/collections/${collection.id}`;
    const history = useHistory();

    useImperativeHandle(
      ref,
      () => ({
        exec: () => history.push(openUrl),
        open: () => history.push(openUrl),
        edit: () => {},
        toggleCollapse,
      }),
      [openUrl, history, toggleCollapse]
    );

    const limit = baseConfig?.limit ?? DEFAULT_SECTION_LIMIT;
    const showingAll = limit === 0 || limit >= baseNumber;
    const otherHidden = !!otherConfig?.hidden;

    let text;
    if (!showingAll) {
      if (otherHidden && otherNumber > 0) {
        text = `See ${pluralize(
          baseNumber - limit,
          `more ${baseName}`
        )} and ${pluralize(otherNumber, otherName)}`;
      } else {
        text = `See ${formatNumber(baseNumber - limit)} more`;
      }
    } else if (otherHidden) {
      text = `See ${pluralize(otherNumber, otherName)}`;
    } else {
      return null;
    }

    return (
      <Link
        className="show-more"
        css={listTextStyle}
        onClick={() => history.push(openUrl)}
      >
        {text}
      </Link>
    );
  }
);

function ShowMore(props: ShowMoreProps) {
  return (
    <SelectableListItem<PreviewRef>
      indicatorPosition={IndicatorPositionEnum.baseline}
    >
      {(ref) => <ShowMoreImpl ref={ref} {...props} />}
    </SelectableListItem>
  );
}

type SectionProps = {
  sectionConfig: FullCollectionSectionConfig;
  workflows: { node: WorkflowListItemFragment }[];
  tools: { node: ToolListItemFragment }[];
  topMap: Record<string, number>;
  update: UpdateSpaceSettings;
};

const CollectionSection = memo(
  ({ sectionConfig, workflows, tools, topMap, update }: SectionProps) => {
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

    const history = useHistory();

    const header = (
      <SelectableListItem<PreviewRef>
        indicatorPosition={IndicatorPositionEnum.topHeader}
      >
        {(ref) => (
          <Header
            ref={ref}
            collection={sectionConfig.collection}
            settings={sectionConfig}
            onSettingsChange={update}
            loading={false}
          />
        )}
      </SelectableListItem>
    );

    if (sectionCollapsed(sectionConfig)) {
      return header;
    }

    if (workflows.length === 0 && tools.length === 0) {
      return (
        <>
          {header}
          <p css={listTextStyle}>
            This collection doesn't have any snippets or playbooks yet. Don't
            worry,{' '}
            <Link
              onClick={() =>
                history.push(`/new?collectionId=${sectionConfig.collection.id}`)
              }
            >
              it's easy to fix that
            </Link>
            !
          </p>
        </>
      );
    }

    const analyticsSource = `${sectionConfig.key}-section`;

    const showTools =
      tools.length > 0 && !sectionConfig.userConfig.tools?.hidden;
    const showWorkflows =
      workflows.length > 0 && !sectionConfig.userConfig.workflows?.hidden;

    const toolsElems: React.ReactNode[] = [];
    if (showTools) {
      if (showWorkflows) {
        toolsElems.push(
          <SectionSubheader key="tools-header">Snippets</SectionSubheader>
        );
      }
      const showMore = needsShowMore(
        sectionConfig.userConfig.tools,
        tools.length,
        sectionConfig.userConfig.workflows,
        workflows.length
      );
      toolsElems.push(
        <SectionItems
          key="tools"
          baseConfig={sectionConfig.userConfig.tools}
          sectionItems={tools.map((e) => e.node)}
          analyticsSource={analyticsSource}
          toggleCollapse={toggleCollapse}
          topMap={topMap}
          // If there are extra items, shorten the margin behind the last preview tile and add a show more link
          lastItemStyle={showMore ? { marginBottom: '5px' } : undefined}
        />
      );
      if (showMore) {
        toolsElems.push(
          <ShowMore
            key="tools-show-more"
            collection={sectionConfig.collection}
            baseConfig={sectionConfig.userConfig.tools}
            baseNumber={tools.length}
            baseName="snippet"
            otherConfig={sectionConfig.userConfig.workflows}
            otherNumber={workflows.length}
            otherName="playbook"
            toggleCollapse={toggleCollapse}
          />
        );
      }
    }

    const workflowsElems: React.ReactNode[] = [];
    if (showWorkflows) {
      if (showTools) {
        workflowsElems.push(
          <SectionSubheader key="workflows-header">Playbooks</SectionSubheader>
        );
      }
      const showMore = needsShowMore(
        sectionConfig.userConfig.workflows,
        workflows.length,
        sectionConfig.userConfig.tools,
        tools.length
      );
      workflowsElems.push(
        <SectionItems
          key="workflows"
          baseConfig={sectionConfig.userConfig.workflows}
          sectionItems={workflows.map((e) => e.node)}
          analyticsSource={analyticsSource}
          toggleCollapse={toggleCollapse}
          topMap={topMap}
          // If there are extra items, shorten the margin behind the last preview tile and add a show more link
          lastItemStyle={showMore ? { marginBottom: '5px' } : undefined}
        />
      );
      if (showMore) {
        workflowsElems.push(
          <ShowMore
            key="workflows-show-more"
            collection={sectionConfig.collection}
            baseConfig={sectionConfig.userConfig.workflows}
            baseNumber={workflows.length}
            baseName="playbook"
            otherConfig={sectionConfig.userConfig.tools}
            otherNumber={tools.length}
            otherName="snippet"
            toggleCollapse={toggleCollapse}
          />
        );
      }
    }

    const first = sectionConfig.userConfig.first || DEFAULT_SECTION_FIRST;
    return (
      <>
        {header}
        {first === 'tools'
          ? [toolsElems, workflowsElems]
          : [workflowsElems, toolsElems]}
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

export default CollectionSection;
