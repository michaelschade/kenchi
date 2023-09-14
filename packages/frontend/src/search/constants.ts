// See https://github.com/kenchi/kenchi/blob/main/packages/frontend/src/start/README.md
export const DEMO_COLLECTION_NAME = 'Account Support';

// We want to throttle doing the search so that the search results begin
// appearing immediately on the first keystroke and update as the customer
// types, while still not firing off too many requests (as Algolia charges us
// per request).
export const ALGOLIA_SEARCH_THROTTLE_MS = 500;

// This makes the query param only update after the customer has stopped typing
// for a bit. The intention here is to avoid polluting history with a bunch of
// partially-typed queries.
export const DEBOUNCE_FOR_SET_SEARCH_QUERY_PARAM_MS = 500;

export const DEFAULT_HITS_PER_PAGE = 20;

export const CLIENT_SIDE_SEARCH_WEIGHT_FOR_COLLECTION_RESULTS = 1.25;
