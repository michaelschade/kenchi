import useDrafts from '../graphql/useDrafts';
import SpecialSection from './SpecialSection';
import { UserSpecialSectionConfig, useSpaceSettings } from './useSpaceSettings';

const SECTION_ID = '__DRAFTS';
export default function DraftsSection() {
  const { drafts } = useDrafts();

  const [settings, updateSettings] = useSpaceSettings();

  if (!drafts || drafts.length === 0) {
    return null;
  }

  let userConfig: UserSpecialSectionConfig;
  const potentialConfig = settings?.sections?.[SECTION_ID];
  if (potentialConfig && potentialConfig.type === 'special') {
    userConfig = potentialConfig;
  } else {
    userConfig = {
      type: 'special',
      sort: 'alphabetical',
      limit: 0,
    };
  }

  return (
    <SpecialSection
      name="Drafts"
      sectionConfig={{ type: 'special', key: SECTION_ID, userConfig }}
      sectionItems={drafts}
      topMap={{}}
      update={updateSettings}
    />
  );
}
