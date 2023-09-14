import { gql, useQuery } from '@apollo/client';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { useHistory, useParams } from 'react-router-dom';

import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../components/ErrorAlert';
import {
  ProductChangeQuery,
  ProductChangeQueryVariables,
} from '../graphql/generated';
import Renderer from '../slate/Renderer';

const QUERY = gql`
  query ProductChangeQuery($id: ID!) {
    node(id: $id) {
      ... on ProductChange {
        id
        title
        description
        createdAt
      }
    }
  }
`;

export default function ViewProductChange() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const { data, loading, error } = useQuery<
    ProductChangeQuery,
    ProductChangeQueryVariables
  >(QUERY, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  const productChange =
    data?.node?.__typename === 'ProductChange' ? data.node : null;

  if (!productChange) {
    if (loading) {
      return <Loading name="view product change" />;
    } else if (error) {
      return <ErrorAlert title="Error loading product change" error={error} />;
    } else {
      return <NotFoundAlert title="Product change not found" />;
    }
  }

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />

        <SectionHeader>{productChange.title}</SectionHeader>
      </HeaderBar>

      <ContentContainer>
        <Renderer contents={productChange.description} />
      </ContentContainer>
    </>
  );
}
