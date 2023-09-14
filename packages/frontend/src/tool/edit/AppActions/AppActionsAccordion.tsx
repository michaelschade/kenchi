import React, { ComponentType, ReactNode, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faTag,
  faTags,
  faUserEdit,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import omit from 'lodash/omit';

import { newSlateBlob } from '@kenchi/slate-tools/lib/utils';
import { Accordion } from '@kenchi/ui/lib/Accordion';
import { BaseButton } from '@kenchi/ui/lib/Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kenchi/ui/lib/Collapsible';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import { SidebarCardEmptyState } from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { ReactComponent as IntercomLogo } from '../../../logos/integrations/intercom.svg';
import { ReactComponent as ZendeskLogo } from '../../../logos/integrations/zendesk.svg';
import { pluralize } from '../../../utils';
import { IntercomTagsConfigurator } from './IntercomTagsConfigurator';
import {
  ZendeskAssignment,
  ZendeskAssignmentConfigurator,
} from './ZendeskAssignmentConfigurator';
import {
  iconForZendeskTicketStatus,
  tooltipForZendeskTicketStatus,
  ZendeskSetStatusConfigurator,
  ZendeskTicketStatusEnum,
} from './ZendeskSetStatusConfigurator';
import {
  iconForZendeskTags,
  tooltipForZendeskTags,
  ZendeskTagsConfig,
  ZendeskTagsConfigurator,
} from './ZendeskTagsConfigurator';

const INTERCOM_BLUE = '#0057ff';
const ZENDESK_KALE = '#03363D';

type ToolConfig = {
  data: unknown; // TBD
  intercomTags?: string[];
  zendeskTags?: ZendeskTagsConfig;
  zendeskSetTicketStatus?: ZendeskTicketStatusEnum;
  zendeskAssign?: ZendeskAssignment;
};

type ActionKeys = Exclude<keyof ToolConfig, 'data'>;

type ActionConfig<TKey, TValue> = {
  key: TKey;
  label: string;
  icon: (value: NonNullable<TValue>) => IconProp;
  tooltip: (value: NonNullable<TValue>) => ReactNode;
  configuratorComponent: ComponentType<{
    value: TValue;
    onChange: (value: TValue) => void;
  }>;
  isEnabled: (value: TValue) => boolean;
};

type AppConfig = {
  key: string;
  label: string;
  logo: ReactNode;
  brandColor: string;
  actionConfigs: ActionConfig<ActionKeys, any>[];
};

const actionConfigIdentityFn = <TKey,>(
  config: ActionConfig<
    TKey extends Exclude<keyof ToolConfig, 'data'> ? TKey : never,
    TKey extends Exclude<keyof ToolConfig, 'data'> ? ToolConfig[TKey] : never
  >
) => config;

const tooltipForAddTags = (value?: string[]) =>
  `Add ${pluralize((value || []).length, 'tag')}`;

const iconForTags = (value?: string[]) =>
  (value || []).length === 1 ? faTag : faTags;

const APP_CONFIGS: AppConfig[] = [
  {
    key: 'intercom',
    label: 'Intercom',
    logo: <IntercomLogo fill={INTERCOM_BLUE} />,
    brandColor: INTERCOM_BLUE,
    actionConfigs: [
      actionConfigIdentityFn({
        key: 'intercomTags',
        label: 'Add tags',
        tooltip: tooltipForAddTags,
        icon: iconForTags,
        isEnabled: (value?: string[]) => (value || []).length > 0,
        configuratorComponent: IntercomTagsConfigurator,
      }),
    ],
  },
  {
    key: 'zendesk',
    label: 'Zendesk',
    logo: <ZendeskLogo fill={ZENDESK_KALE} />,
    brandColor: ZENDESK_KALE,
    actionConfigs: [
      actionConfigIdentityFn({
        key: 'zendeskTags',
        label: 'Add tags',
        isEnabled: (value: ZendeskTagsConfig | undefined = {}) => {
          return (
            (value.tagsToAdd || []).length > 0 ||
            (value.tagsToRemove || []).length > 0 ||
            (value.tagsToSet || []).length > 0
          );
        },
        configuratorComponent: ZendeskTagsConfigurator,
        tooltip: tooltipForZendeskTags,
        icon: iconForZendeskTags,
      }),
      actionConfigIdentityFn({
        key: 'zendeskSetTicketStatus',
        label: 'Set status',
        isEnabled: (value: ZendeskTicketStatusEnum | undefined) =>
          Boolean(value),
        configuratorComponent: ZendeskSetStatusConfigurator,
        tooltip: tooltipForZendeskTicketStatus,
        icon: iconForZendeskTicketStatus,
      }),
      actionConfigIdentityFn({
        key: 'zendeskAssign',
        label: 'Assign ticket',
        isEnabled: (value: ZendeskAssignment | undefined) => Boolean(value),
        configuratorComponent: ZendeskAssignmentConfigurator,
        tooltip: () => 'Assign to self',
        icon: () => faUserEdit,
      }),
    ],
  },
];

const TriggerContentContainer = styled.div`
  display: grid;
  gap: 0.5rem;
  align-items: center;
  grid-template-columns: 1.5rem minmax(0, 1fr) auto;
  text-align: left;
`;

type PropsForAppActionsAccordion = {
  toolConfig: ToolConfig;
  onChangeToolConfig: (toolConfig: ToolConfig) => void;
  disabled?: boolean;
};

export const AppActionsAccordion = ({
  toolConfig,
  onChangeToolConfig,
  disabled = false,
}: PropsForAppActionsAccordion) => {
  const appConfigsWithEnabledActions = APP_CONFIGS.filter((appConfig) => {
    return appConfig.actionConfigs.some((actionConfig) => {
      return actionConfig.isEnabled(toolConfig?.[actionConfig.key]);
    });
  });

  const [tab, setTab] = useState('enabled');
  const tabs = [
    {
      label: 'Enabled',
      value: 'enabled',
      count: appConfigsWithEnabledActions.length,
    },
    {
      label: '+ Add actions',
      value: 'all',
      disabled,
    },
  ];

  const appConfigs =
    tab === 'enabled' ? appConfigsWithEnabledActions : APP_CONFIGS;

  const sections = Object.values(appConfigs).map((appConfig) => {
    const { key, label, logo, brandColor, actionConfigs } = appConfig;

    const renderedConfigs = actionConfigs.map((actionConfig, index) => {
      const {
        label,
        configuratorComponent: ActionConfigComponent,
        key,
      } = actionConfig;
      return (
        <React.Fragment key={key}>
          <Collapsible
            css={css`
              width: 100%;
            `}
          >
            <CollapsibleTrigger asChild>
              <BaseButton
                css={({ colors }: KenchiTheme) => css`
                  display: flex;
                  width: 100%;
                  gap: 0.5rem;
                  align-items: center;
                  padding: 0.75rem;
                  border: none;
                  h3 {
                    color: ${actionConfig.isEnabled(
                      toolConfig?.[actionConfig.key]
                    )
                      ? colors.gray[12]
                      : colors.gray[10]};
                    font-weight: 600;
                    transition: color 0.1s ease-in-out;
                  }
                  &:hover,
                  &:focus-visible {
                    h3 {
                      color: ${colors.gray[12]};
                    }
                  }
                `}
              >
                <h3>{label}</h3>
                {actionConfig.isEnabled(toolConfig?.[actionConfig.key]) && (
                  <FontAwesomeIcon icon={faCheck} size="xs" />
                )}
              </BaseButton>
            </CollapsibleTrigger>
            <CollapsibleContent
              css={css`
                display: grid;
                grid-template-columns: minmax(0, 1fr);
              `}
            >
              <div
                css={css`
                  padding: 0 0.75rem 0.75rem 0.75rem;
                `}
              >
                <ActionConfigComponent
                  onChange={(value) => {
                    const toolConfigBeforeUpdate = {
                      ...toolConfig,
                      data: toolConfig?.data ?? newSlateBlob({ rich: true }),
                    };
                    // We drop undefined values from the config because
                    // fast-deep-equal considers {} and { stuff: undefined } to be not
                    // equal. If a key wasn't present at first and then we set it to
                    // undefined (instead of removing it), that the "Publish" button
                    // would appear, as if there were changes, when there really
                    // aren't.
                    const toolConfigWithUpdate =
                      value === undefined
                        ? omit(toolConfigBeforeUpdate, [key])
                        : {
                            ...toolConfigBeforeUpdate,
                            [key]: value,
                          };

                    onChangeToolConfig(toolConfigWithUpdate);
                  }}
                  value={toolConfig?.[key]}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
          {index < actionConfigs.length - 1 && (
            <div
              css={css`
                padding: 0 0.75rem;
              `}
            >
              <Separator />
            </div>
          )}
        </React.Fragment>
      );
    });

    const content = (
      <div
        css={css`
          border-left: 2px solid ${brandColor};
          border-right: 2px solid ${brandColor};
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        `}
      >
        {renderedConfigs}
      </div>
    );

    const stateSummariesForEnabledActions = appConfig.actionConfigs
      .filter((actionConfig) =>
        actionConfig.isEnabled(toolConfig?.[actionConfig.key])
      )
      .map((actionConfig) => {
        const value = toolConfig?.[actionConfig.key];
        const icon = actionConfig.icon(value);
        const tooltip = actionConfig.tooltip(value);
        return (
          <div
            key={actionConfig.key}
            css={({ colors }: KenchiTheme) => css`
              color: ${colors.gray[8]};
              &:hover {
                color: ${colors.gray[9]};
              }
              transition: color 0.1s ease-in-out;
            `}
          >
            <Tooltip overlay={tooltip} placement="top" mouseEnterDelay={0}>
              <FontAwesomeIcon icon={icon} size="sm" />
            </Tooltip>
          </div>
        );
      });

    return {
      label: (
        <TriggerContentContainer>
          {logo}
          {label}
          <div
            css={css`
              display: grid;
              grid-auto-flow: column;
              gap: 0.5rem;
              align-items: center;
            `}
          >
            {stateSummariesForEnabledActions}
          </div>
        </TriggerContentContainer>
      ),
      content,
      key,
    };
  });

  return (
    <>
      <ContentCardTabs options={tabs} value={tab} onChange={setTab} />
      <Accordion sections={sections} />
      {tab === 'enabled' && appConfigs.length === 0 && (
        <SidebarCardEmptyState>No actions enabled</SidebarCardEmptyState>
      )}
    </>
  );
};
