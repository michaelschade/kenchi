import { gql, useMutation } from '@apollo/client';

import { CollectionFragment, KenchiErrorFragment } from '../graphql/fragments';
import {
  CreateCollectionMutation,
  CreateCollectionMutationVariables,
} from '../graphql/generated';
import { trackEvent } from '../utils/analytics';
import ModifyCollection from './ModifyCollection';
import { QUERY } from './useCollections';

const CREATE_COLLECTION = gql`
  mutation CreateCollectionMutation($collectionData: CollectionInput!) {
    modify: createCollection(collectionData: $collectionData) {
      collection {
        ...CollectionFragment
      }
      error {
        ...KenchiErrorFragment
      }
    }
  }
  ${KenchiErrorFragment}
  ${CollectionFragment}
`;

export type CreateCollectionProps = {
  onBack: () => void;
  onCreate: (id: string) => void;
  onSelectExisting?: (id: string) => void;
  inputFieldsWrapper?: React.ComponentType;
  buttonWrapper?: React.ComponentType;
};

export default function CreateCollection({
  onBack,
  onCreate,
  onSelectExisting,
  inputFieldsWrapper,
  buttonWrapper,
}: CreateCollectionProps) {
  const [mutation, status] = useMutation<
    CreateCollectionMutation,
    CreateCollectionMutationVariables
  >(CREATE_COLLECTION, {
    refetchQueries: [{ query: QUERY }],
    awaitRefetchQueries: true,
    onCompleted: (createData) => {
      const collection = createData.modify.collection;
      if (!createData.modify.error && collection) {
        onCreate(collection.id);
        trackEvent({
          category: 'collections',
          action: 'create',
          label: 'Create collection',
          object: collection.id,
        });
      }
    },
  });

  return (
    <ModifyCollection
      collection={null}
      onBack={onBack}
      onSelectExisting={onSelectExisting}
      mutate={(collectionData) => mutation({ variables: { collectionData } })}
      mutationResult={status}
      inputFieldsWrapper={inputFieldsWrapper}
      buttonWrapper={buttonWrapper}
    />
  );
}
