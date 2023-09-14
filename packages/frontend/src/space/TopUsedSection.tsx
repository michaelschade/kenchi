import { useCallback, useMemo } from 'react';

import useTopItems from '../graphql/useTopItems';
import useList, { useFlatList } from '../list/useList';
import SpecialSection from './SpecialSection';
import { UserSpecialSectionConfig, useSpaceSettings } from './useSpaceSettings';

const SECTION_ID = '__TOP_USED';
export default function TopUsedSection() {
  const { topUsedToolStaticIds } = useTopItems({
    fetchPolicy: 'cache-and-network',
  });
  const topUsedMap = useMemo(() => {
    const map: Record<string, number> = {};
    topUsedToolStaticIds?.forEach((staticId, i) => (map[staticId] = i));
    return map;
  }, [topUsedToolStaticIds]);

  const { collections } = useList();
  const items = useFlatList(
    collections,
    useCallback(
      (item) => !!topUsedMap && item.staticId in topUsedMap,
      [topUsedMap]
    )
  );

  const [settings, updateSettings] = useSpaceSettings();

  const totalItems = useMemo(
    () =>
      collections?.edges.reduce(
        (count, c) => c.node.tools.edges.length + count,
        0
      ) || 0,
    [collections]
  );

  if (totalItems < 5) {
    return null;
  }

  if (!topUsedToolStaticIds || topUsedToolStaticIds.length === 0) {
    return null;
  }

  let userConfig: UserSpecialSectionConfig;
  const potentialConfig = settings?.sections?.[SECTION_ID];
  if (potentialConfig && potentialConfig.type === 'special') {
    userConfig = potentialConfig;
  } else {
    userConfig = {
      type: 'special',
      sort: 'topUsed',
      limit: 5,
    };
  }

  return (
    <SpecialSection
      name="Your Top Snippets"
      sectionConfig={{ type: 'special', key: SECTION_ID, userConfig }}
      sectionItems={items}
      topMap={topUsedMap}
      update={updateSettings}
      icon="🌟"
    />
  );
}
