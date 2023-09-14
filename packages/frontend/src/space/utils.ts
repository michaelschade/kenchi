import { FullSectionConfig, UserBaseSectionConfig } from './useSpaceSettings';

export function sectionCollapsed(c: FullSectionConfig) {
  return c.userConfig.type === 'collection'
    ? c.userConfig.tools?.collapsed && c.userConfig.workflows?.collapsed
    : c.userConfig.collapsed;
}

export function applyToSection(
  sectionConfig: FullSectionConfig,
  update: Partial<UserBaseSectionConfig>
): FullSectionConfig {
  if (sectionConfig.type === 'collection') {
    return {
      ...sectionConfig,
      userConfig: {
        ...sectionConfig.userConfig,
        workflows: {
          ...sectionConfig.userConfig.workflows,
          ...update,
        },
        tools: {
          ...sectionConfig.userConfig.tools,
          ...update,
        },
      },
    };
  } else {
    return {
      ...sectionConfig,
      userConfig: {
        ...sectionConfig.userConfig,
        ...update,
      },
    };
  }
}
