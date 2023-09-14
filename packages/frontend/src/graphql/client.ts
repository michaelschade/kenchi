import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { RetryLink } from '@apollo/client/link/retry';
import { createUploadLink } from 'apollo-upload-client';
import { sha256 } from 'crypto-hash';
import { DefinitionNode } from 'graphql';
import { parse } from 'qs';

import { isDevelopment, isTest } from '../utils';
import { getCache } from './cache';
import CSRFLink, { hasCSRFToken } from './CSRFLink';
import { LoggingLink } from './LoggingLink';

const API_URL = `${process.env.REACT_APP_API_HOST}/graphql`;

const definitionIsMutation = (d: DefinitionNode) => {
  return d.kind === 'OperationDefinition' && d.operation === 'mutation';
};

let clientSingleton: ApolloClient<NormalizedCacheObject> | null = null;

export function getClient() {
  if (!clientSingleton) {
    const query = parse(window.location.search.substring(1));
    const extensionVersion = query.version as string;
    const extraHeaders = {
      'X-Version-Extension': extensionVersion,
      'X-Version-App': process.env.REACT_APP_SENTRY_VERSION,
    };

    const batchHttpLink = new BatchHttpLink({
      credentials: 'include',
      uri: API_URL,
      headers: extraHeaders,
    });
    const postHttpLink = createHttpLink({
      credentials: 'include',
      uri: API_URL,
      headers: extraHeaders,
    });
    const getHttpLink = createHttpLink({
      credentials: 'include',
      uri: API_URL,
      useGETForQueries: true,
      headers: {
        ...extraHeaders,
        // This has to be lower case or it gets overridden by a default...
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
    const uploadLink: ApolloLink = createUploadLink({
      credentials: 'include',
      uri: API_URL,
      headers: extraHeaders,
    });

    // If we don't have a CSRF token we'll fall back to GET requests so the
    // page loads more quickly.
    let link = new LoggingLink().concat(CSRFLink());
    if (!isTest()) {
      link = link.concat(createPersistedQueryLink({ sha256 }));
    }
    link = link.split(
      (op) =>
        !hasCSRFToken() && !op.query.definitions.some(definitionIsMutation),
      getHttpLink,
      ApolloLink.split(
        (op) => !!op.getContext().hasUpload,
        uploadLink,
        ApolloLink.split(
          (op) => !!op.getContext().noBatch || isTest(),
          postHttpLink,
          batchHttpLink
        )
      )
    );

    if (isDevelopment()) {
      // In case we're restarting the server...retry once a second for 5 seconds.
      link = new RetryLink({
        delay: { initial: 1000, max: 3000 },
        attempts: {
          max: 5,
          retryIf: (error) => error && error.statusCode === 502,
        },
      }).concat(link);
    }

    clientSingleton = new ApolloClient({
      cache: getCache(),
      link,
      resolvers: {},
    });
  }
  return clientSingleton;
}
