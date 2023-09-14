import { Hit } from '@algolia/client-search';
import { BrowserContext } from '@playwright/test';
import { get, trimEnd } from 'lodash';
import { stringify } from 'qs';

export type MockSearchResults = Record<string, Array<Hit<{}>>>;

export const interceptSearchQueries = async (
  context: BrowserContext,
  mockSearchResults: Record<string, Array<Hit<{}>>>
): Promise<void> => {
  return context.route(
    /https:\/\/[a-z0-9-.]+\.(?:algolia\.net|algolianet\.com)\/.*/i,
    async (route, request) => {
      // The payload here is the query as an object ending with a colon. e.g,
      // '{"query":"test","filters":"","hitsPerPage":20,"userToken":"user_xxxx"}:'
      const searchQuery = JSON.parse(trimEnd(request.postData(), ':'));
      const results = get(mockSearchResults, searchQuery.query, []);

      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=UTF-8',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'X-Playwright-Search-Mock': 'true',
        },
        body: JSON.stringify({
          exhaustiveNbHits: true,
          exhaustiveTypo: true,
          hits: results,
          hitsPerPage: 20,
          nbHits: results.length,
          nbPages: Math.floor(results.length / 20),
          page: 0,
          params: stringify(searchQuery),
          processingTimeMS: 1,
          query: searchQuery.query,
        }),
      });
    }
  );
};
