import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { RetryLink } from '@apollo/client/link/retry';

const API_URL = `${process.env.REACT_APP_API_HOST}/graphql`;

const jsonDecode = (val: string) =>
  typeof val === 'string' ? JSON.parse(val) : val;

const workflowFields = {
  contents: { read: jsonDecode },
  majorChangeDescription: { read: jsonDecode },
};
const toolFields = {
  inputs: { read: jsonDecode },
  configuration: { read: jsonDecode },
  majorChangeDescription: { read: jsonDecode },
};

const cache = new InMemoryCache({
  possibleTypes: {
    // TODO: generate this from our schema?
    VersionedNode: [
      'Workflow',
      'WorkflowRevision',
      'WorkflowLatest',
      'ToolRevision',
      'ToolLatest',
    ],
    Workflow: ['WorkflowRevision', 'WorkflowLatest'],
    Tool: ['ToolRevision', 'ToolLatest'],
  },
  typePolicies: {
    Admin: {
      keyFields: [],
    },
    ToolRunLog: {
      fields: {
        log: { read: jsonDecode },
      },
    },
    PageSnapshot: {
      fields: {
        snapshot: { read: jsonDecode },
      },
    },
    Viewer: {
      keyFields: [],
    },
    Domain: {
      fields: {
        variableExtractors: { read: jsonDecode },
      },
    },
    UserItemSettings: {
      keyFields: ['staticId'],
    },
    ProductChange: {
      fields: {
        description: { read: jsonDecode },
      },
    },
    WorkflowRevision: {
      fields: workflowFields,
    },
    WorkflowLatest: {
      keyFields: ['staticId', 'branchId'],
      fields: workflowFields,
    },
    ToolRevision: {
      fields: toolFields,
    },
    ToolLatest: {
      keyFields: ['staticId', 'branchId'],
      fields: toolFields,
    },
  },
});

let clientSingleton: ApolloClient<NormalizedCacheObject> | null = null;

export function getClient() {
  if (!clientSingleton) {
    const extraHeaders = {
      'X-Version-App': process.env.REACT_APP_SENTRY_VERSION,
    };

    const httpLink = new BatchHttpLink({
      credentials: 'include',
      uri: API_URL,
      headers: extraHeaders,
    });

    // If we don't have a CSRF token we'll fall back to GET requests so the
    // page loads more quickly.
    let link: ApolloLink = httpLink;

    if (process.env.REACT_APP_ENV === 'development') {
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
      cache,
      link,
      resolvers: {},
    });
  }
  return clientSingleton;
}
