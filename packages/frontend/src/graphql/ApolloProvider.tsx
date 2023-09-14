import { useEffect, useState } from 'react';

import {
  ApolloClient,
  ApolloProvider as InternalApolloProvider,
  NormalizedCacheObject,
} from '@apollo/client';

import { getPersistorAsync } from './cache';
import { getClient } from './client';

const useApolloClient = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>();
  useEffect(() => {
    getPersistorAsync().then(() => {
      const localClient = getClient();
      setClient(localClient);
    });
  }, []);
  return client || null;
};

export default function ApolloProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const client = useApolloClient();
  if (!client) {
    return null;
  }

  return (
    <InternalApolloProvider client={client}>{children}</InternalApolloProvider>
  );
}
