import { useCallback } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { captureMessage } from '@sentry/react';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert, { NotFoundAlert } from '../components/ErrorAlert';
import { CollectionFragment, KenchiErrorFragment } from '../graphql/fragments';
import {
  CollectionListItemFragment as CollectionListItemFragmentType,
  CollectionQuery,
  CollectionQueryVariables,
  UpdateCollectionMutation,
  UpdateCollectionMutationVariables,
} from '../graphql/generated';
import { trackEvent } from '../utils/analytics';
import ModifyCollection from './ModifyCollection';

const QUERY = gql`
  query CollectionQuery($id: ID!) {
    node(id: $id) {
      id
      ... on Collection {
        ...CollectionFragment
      }
    }
  }
  ${CollectionFragment}
`;

const UPDATE_COLLECTION = gql`
  mutation UpdateCollectionMutation(
    $id: ID!
    $collectionData: CollectionInput!
  ) {
    modify: updateCollection(id: $id, collectionData: $collectionData) {
      collection {
        ...CollectionFragment
      }
      error {
        ...KenchiErrorFragment
      }
    }
  }
  ${CollectionFragment}
  ${KenchiErrorFragment}
`;

export type EditCollectionProps = {
  id: string;
  onBack: () => void;
  onUpdate: (collection: CollectionListItemFragmentType) => void;
  inputFieldsWrapper?: React.ComponentType;
  buttonWrapper?: React.ComponentType;
};

export default function EditCollection({
  id,
  onBack,
  onUpdate,
  inputFieldsWrapper,
  buttonWrapper,
}: EditCollectionProps) {
  const { data, loading, error } = useQuery<
    CollectionQuery,
    CollectionQueryVariables
  >(QUERY, { variables: { id } });
  const collection = data?.node?.__typename === 'Collection' ? data.node : null;

  const [updateCollection, updateCollectionResult] = useMutation<
    UpdateCollectionMutation,
    UpdateCollectionMutationVariables
  >(UPDATE_COLLECTION, {
    onCompleted: (updateData) => {
      const collection = updateData.modify.collection;
      if (collection) {
        onUpdate(collection);
        trackEvent({
          category: 'collections',
          action: 'update',
          label: 'Update collection',
          object: collection.id,
        });
      }
    },
  });

  const mutate = useCallback(
    (collectionData: UpdateCollectionMutationVariables['collectionData']) => {
      if (!collection) {
        return;
      }
      updateCollection({
        variables: {
          id: collection.id,
          collectionData,
        },
      });
    },
    [updateCollection, collection]
  );

  if (!collection) {
    if (loading) {
      return <LoadingSpinner name="edit collection" />;
    } else if (error) {
      return <ErrorAlert title="Error loading Collection" error={error} />;
    } else {
      captureMessage('Collection not found');
      return <NotFoundAlert title="Collection not found" />;
    }
  }

  return (
    <ModifyCollection
      collection={collection}
      onBack={onBack}
      mutate={mutate}
      mutationResult={updateCollectionResult}
      inputFieldsWrapper={inputFieldsWrapper}
      buttonWrapper={buttonWrapper}
    />
  );
}
