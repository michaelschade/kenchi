import {
  faArrowLeft,
  faFileInvoice,
  faMagic,
} from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';

import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';

import Tile from '../components/Tile';
import { useSimpleQueryParams } from '../utils/useQueryParams';

export default function New() {
  const [{ collectionId }] = useSimpleQueryParams();

  const history = useHistory();

  const query = collectionId ? `?collectionId=${collectionId}` : '';
  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />
        <SectionHeader>What are you creating?</SectionHeader>
      </HeaderBar>

      <ContentContainer>
        <Tile
          icon={faFileInvoice}
          onClick={() => history.push(`/playbooks/new${query}`)}
          title="Playbook"
          description="Your knowledge base and tooling fused into one. Package up documentation, snippets, and even custom internal tools into one place to share best practices across your entire team."
        />

        <Tile
          icon={faMagic}
          onClick={() => history.push(`/snippets/new${query}`)}
          title="Snippet"
          description="Replace all the tedious parts of your day with quick shortcuts. Paste text, control Gmail, open tabs&mdash;you name it. All the little things you do every day, now done in a single tap."
        />
      </ContentContainer>
    </>
  );
}
