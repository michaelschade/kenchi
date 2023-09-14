import escapeStringRegexp from 'escape-string-regexp';
import { countBy, last, maxBy, sortBy } from 'lodash';
import qs from 'qs';

import { RecordingNetworkRequest } from '@kenchi/commands';
import Result, { failure, success } from '@kenchi/shared/lib/Result';

import { EMAIL_REGEX, randomString } from '../../utils';
import {
  ComputedValue,
  DataSource,
  DataSourceRequest,
  ResponseBodyPath,
} from './types';

type EnhancedRecordingEntry = Omit<RecordingNetworkRequest, 'url'> & {
  url: URL;
  pathParts: string[];
  queryParams: qs.ParsedQs;
};

export default class FetchRecordingProcessor {
  public entries: EnhancedRecordingEntry[];
  public lastUrl: URL;
  private requests: DataSourceRequest[] = [];
  private entryIdToRequestIdx: Record<string, number> = {};

  constructor({
    networkRequests,
    lastUrl,
  }: {
    networkRequests: RecordingNetworkRequest[];
    lastUrl: string;
  }) {
    this.lastUrl = new URL(lastUrl);
    this.entries = [];
    this.entries = sortBy(
      networkRequests.map((e) => {
        const url = new URL(e.url);
        return {
          ...e,
          url: url,
          pathParts: url.pathname.split('/'),
          queryParams: qs.parse(url.search, { ignoreQueryPrefix: true }),
        };
      }),
      'startedAt'
    );
  }

  private searchResponseBodies(
    value: string | RegExp,
    {
      beforeId,
      searchKeyNames,
    }: { beforeId?: string; searchKeyNames?: boolean } = {}
  ) {
    let entries = this.entries;
    if (beforeId) {
      const idx = this.entries.findIndex((e) => e.id === beforeId);
      if (idx === -1) {
        throw new Error();
      }
      entries = this.entries.slice(0, idx - 1);
    }
    const requestIdToMatches: Record<string, ResponseBodyPath[]> = {};
    entries.forEach((e) => {
      let res;
      if (searchKeyNames) {
        res = objectContainsKey(e.responseBody, value);
      } else {
        res = objectContains(e.responseBody, value);
      }
      if (res.length > 0) {
        requestIdToMatches[e.id] = res.map((r) => r[0]);
      }
    });
    return requestIdToMatches;
  }

  private searchRequestParams(
    value: string | RegExp,
    { afterId }: { afterId?: string } = {}
  ) {
    let entries = this.entries;
    if (afterId) {
      const idx = this.entries.findIndex((e) => e.id === afterId);
      if (idx === -1) {
        throw new Error();
      }
      entries = this.entries.slice(idx + 1);
    }
    const rtn: Record<string, RequestParamSearchResult[]> = {};
    entries.forEach((e) => {
      const res = searchRequestParams(e, value);
      if (res.length > 0) {
        rtn[e.id] = res;
      }
    });
    return rtn;
  }

  private requestFromEntryId(entryId: string) {
    const idx = this.entryIdToRequestIdx[entryId];
    return idx ? this.requests[idx] : null;
  }

  private makeRequestFromEntry(
    entry: EnhancedRecordingEntry
  ): DataSourceRequest {
    const { id, url, queryParams, method, credentials, requestHeaders } = entry;
    const cleanUrl = new URL(url);
    cleanUrl.search = '';
    const request: DataSourceRequest = {
      id: `req_${randomString(10)}`,
      name: '', // TODO: ugly!
      type: 'networkRequest',
      method,
      credentials,
      url: { type: 'text', text: cleanUrl.toString() },
      queryParams: parsedQsToSlate(queryParams),
      headers: Object.fromEntries(
        Object.entries(requestHeaders).map(([k, v]) => [
          k,
          { type: 'text', text: v },
        ])
      ),
      body: entry.requestBody as any,
    };
    this.requests.push(request);
    this.entryIdToRequestIdx[id] = this.requests.length - 1;
    return request;
  }

  private handleAuthorizationInEntry(
    entry: EnhancedRecordingEntry,
    request: DataSourceRequest
  ) {
    if (entry.requestHeaders['authorization']) {
      const authParts = entry.requestHeaders['authorization'].split(' ', 2);
      const authKey = authParts[1];
      const possibleAuthKeyRequests = this.searchResponseBodies(authKey, {
        beforeId: entry.id,
      });

      const entryId = Object.keys(possibleAuthKeyRequests)[0];
      if (!entryId) {
        // TODO: error
        console.log('AUTH HEADER WITHOUT REQUEST');
        return;
      }
      const paths = possibleAuthKeyRequests[entryId];
      let authRequest = this.requestFromEntryId(entryId);
      if (!authRequest) {
        const authEntry = this.entries.find((e) => e.id === entryId);
        if (!authEntry) {
          throw new Error();
        }
        authRequest = this.makeRequestFromEntry(authEntry);
      }

      modifyRequestWithComputedValue(
        request,
        {
          type: 'concat',
          children: [
            { type: 'text', text: `${authParts[0]} ` },
            {
              type: 'request',
              requestId: authRequest.id,
              path: paths[0],
            },
          ],
        },
        [{ type: 'headers', key: 'authorization', value: '' }] // Value isn't used here
      );
    }
  }

  private handleCSRFInEntry(
    entry: EnhancedRecordingEntry,
    request: DataSourceRequest
  ) {
    const csrfKeys = searchRequestParamsForKey(entry, /csrf/i);
    if (csrfKeys.length === 0) {
      return;
    }
    csrfKeys.forEach((result) => {
      let possibleCSRFRequests = this.searchResponseBodies(result.value, {
        beforeId: entry.id,
      });
      if (Object.keys(possibleCSRFRequests).length === 0) {
        possibleCSRFRequests = this.searchResponseBodies(/csrf/i, {
          beforeId: entry.id,
          searchKeyNames: true,
        });
      }
      if (Object.keys(possibleCSRFRequests).length === 0) {
        // TODO: error
        console.log('FOUND NEED FOR CSRF BUT NO REQUEST');
        return;
      }
      // TODO: multiple keys
      const entryId = Object.keys(possibleCSRFRequests)[0];
      const paths = possibleCSRFRequests[entryId];
      let csrfRequest = this.requestFromEntryId(entryId);
      if (!csrfRequest) {
        const csrfEntry = this.entries.find((e) => e.id === entryId);
        if (!csrfEntry) {
          throw new Error();
        }
        console.log(csrfEntry);
        csrfRequest = this.makeRequestFromEntry(csrfEntry);
        this.handleAuthorizationInEntry(csrfEntry, csrfRequest);
      }

      modifyRequestWithComputedValue(
        request,
        {
          type: 'request',
          requestId: csrfRequest.id,
          path: paths[0],
        },
        csrfKeys
      );
    });
  }

  process(): Result<DataSource, string> {
    this.requests = [];
    if (!this.lastUrl) {
      return failure('no_url');
    }

    // 1. Find the most frequently seen email address in params

    // TODO: better handle if there's more than one email (don't just pick the
    // most frequent one). Maybe try a different one if the rest of the process
    // fails.

    const entriesWithEmailAddresses = this.searchRequestParams(EMAIL_REGEX);
    const bestEmail = pickBestValue(entriesWithEmailAddresses);
    if (!bestEmail) {
      // Should be impossible
      return failure('no_email_address');
    }

    // 2. Get the first request where we see that email
    const entriesWithBestEmail = this.searchRequestParams(
      new RegExp(escapeStringRegexp(bestEmail), 'i')
    );
    if (Object.keys(entriesWithBestEmail).length === 0) {
      // Should be impossible
      return failure('no_email_address');
    }

    // 3. Do variable replacement and add to requests list
    const emailLookupRequestId = Object.keys(entriesWithBestEmail)[0];
    const emailLookupEntry = this.entries.find(
      (e) => e.id === emailLookupRequestId
    )!;
    const emailLookupPaths = entriesWithBestEmail[emailLookupRequestId];

    const emailLookupRequest = this.makeRequestFromEntry(emailLookupEntry);
    modifyRequestWithComputedValue(
      emailLookupRequest,
      { type: 'input', id: 'email' },
      emailLookupPaths
    );

    this.handleAuthorizationInEntry(emailLookupEntry, emailLookupRequest);
    this.handleCSRFInEntry(emailLookupEntry, emailLookupRequest);

    const responseBody = emailLookupEntry.responseBody;
    // Try to find a param from likelyRequest that matches our current URL
    if (!responseBody || typeof responseBody !== 'object') {
      // TODO: figure out how to handle (maybe guess if it's HTML or XML)
      return failure('cannot_parse_response_body');
    }

    // 4. Find a part of the body that is in the current URL, indicating that it's a stable ID.

    // TODO: ask how things get translated for the recorder? Maybe ask:
    //  a) email => user (1:1, most common)
    //  b) email => user => the next thing (1:1)
    //  c) email => user => the next thing (1:many)

    // This code only handles (a). For b & c, finding the user ID is more
    // complicated since we can't check the URL path. We probably need to go in
    // both directions: from the email to the user ID, and from the "next thing"
    // back to the first request that showed us that ID.
    const possibleParts = this.lastUrl.pathname
      .split('/')
      .map((p) => decodeURIComponent(p));
    for (const v of this.lastUrl.searchParams.values()) {
      possibleParts.push(v);
    }

    const idCounts = searchObjForMatches(responseBody, possibleParts);
    const likelyId = maxBy(Object.entries(idCounts), last)?.[0];
    if (!likelyId) {
      // Should be impossible
      return failure('no_id');
    }

    // 5. Find how to get to that ID in the emailLookupRequest
    const emailLookupPathsToId = objectContains(
      emailLookupEntry.responseBody,
      likelyId
    );
    if (emailLookupPathsToId.length === 0) {
      return failure('no_path_from_email_to_id');
    }

    // 6. Assume every request with that ID is gold.
    const entriesWithId = this.searchRequestParams(likelyId);
    if (Object.keys(entriesWithId).length === 0) {
      return failure('no_entries_with_id');
    }
    const resultsRequestIds = Object.keys(entriesWithId);
    const resultsEntries = this.entries.filter((e) =>
      resultsRequestIds.includes(e.id)
    )!;
    resultsEntries.forEach((entry) => {
      const entryPaths = entriesWithId[entry.id];
      const request = this.makeRequestFromEntry(entry);
      modifyRequestWithComputedValue(
        request,
        {
          type: 'request',
          requestId: emailLookupRequest.id,
          path: emailLookupPathsToId[0][0],
        },
        entryPaths
      );

      this.handleAuthorizationInEntry(entry, request);
      this.handleCSRFInEntry(entry, request);
    });

    this.requests.forEach((request) => {
      request.name = getNameForRequest(request);
    });

    return success({
      id: `ds_${randomString(10)}`,
      requests: this.requests,
      outputs: [],
      name: '',
    });
  }
}

function getNameForComputedValue(value: ComputedValue): string {
  switch (value.type) {
    case 'input':
      return `:${value.id}`;
    case 'request':
      return `:${value.path.at(-1)}`;
    case 'text':
      return value.text;
    case 'concat':
      return value.children.map((c) => getNameForComputedValue(c)).join('');
  }
}

function getNameForRequest(request: DataSourceRequest) {
  const url = getNameForComputedValue(request.url);
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname;
  } catch (e) {}
  return url;
}

function pickBestValue(
  results: Record<string, RequestParamSearchResult[]>
): string | null {
  const valuesByFreq = countBy(Object.values(results).flat(), 'value');
  const bestValueEntry = maxBy(Object.entries(valuesByFreq), last);
  return bestValueEntry ? bestValueEntry[0] : null;
}

function modifyRequestWithComputedValue(
  request: DataSourceRequest,
  value: ComputedValue,
  paths: RequestParamSearchResult[]
) {
  const pathParts: Record<number, ComputedValue> = {};
  paths.forEach((res) => {
    switch (res.type) {
      case 'path':
        pathParts[res.index] = value;
        break;
      case 'headers':
        request.headers[res.key] = value;
        break;
      case 'queryParams':
        addComputedValueOntoPath(request.queryParams, res.path, value);
        break;
      case 'body':
        if (!request.body) {
          throw new Error('TODO');
        }
        addComputedValueOntoPath(request.body, res.path, value);
    }
  });
  if (Object.keys(pathParts).length === 0) {
    return;
  }
  if (request.url.type !== 'text') {
    throw new Error('Adding URL part onto already-modified URL');
  }
  const url = new URL(request.url.text);

  const newPath: (string | ComputedValue)[] = url.pathname.split('/');
  for (const idx in pathParts) {
    newPath[idx as any as number] = pathParts[idx];
  }

  const newNode: ComputedValue = { type: 'concat', children: [] };
  let prevString = url.origin;
  for (let pathIdx = 1; pathIdx < newPath.length; pathIdx++) {
    const part = newPath[pathIdx];
    if (typeof part === 'string') {
      prevString += '/' + part;
    } else {
      prevString += '/';
      newNode.children.push({ type: 'text', text: prevString }, part);
      prevString = '';
    }
  }
  if (prevString.length > 0) {
    newNode.children.push({ type: 'text', text: prevString });
  }
  request.url = newNode;
}

function addComputedValueOntoPath(
  obj: unknown,
  path: ResponseBodyPath,
  value: ComputedValue
) {
  let i;
  for (i = 0; i < path.length; i++) {
    const p = path[i];
    if (!(obj as any)[p]) {
      (obj as any)[p] = typeof p === 'string' ? {} : [];
    }
    if (i < path.length - 1) {
      obj = (obj as any)[p];
    } else {
      (obj as any)[p] = { __kenchiValueWrapper: true, value };
    }
  }
}

type RequestParamSearchResult =
  | { type: 'path'; index: number; value: string }
  | { type: 'headers'; key: string; value: string }
  | { type: 'queryParams' | 'body'; path: ResponseBodyPath; value: string };

function searchRequestParams(
  entry: EnhancedRecordingEntry,
  value: string | RegExp
) {
  const resp: RequestParamSearchResult[] = [];
  objectContains(entry.pathParts, value).forEach(([path, value]) =>
    resp.push({ type: 'path', index: path[0] as number, value })
  );
  objectContains(entry.requestHeaders, value).forEach(([path, value]) =>
    resp.push({ type: 'headers', key: path[0] as string, value })
  );
  objectContains(entry.queryParams, value).forEach(([path, value]) =>
    resp.push({ type: 'queryParams', path, value })
  );
  objectContains(entry.requestBody, value).forEach(([path, value]) =>
    resp.push({ type: 'body', path, value })
  );
  return resp;
}

function searchRequestParamsForKey(
  entry: EnhancedRecordingEntry,
  value: string | RegExp
) {
  const resp: RequestParamSearchResult[] = [];
  objectContainsKey(entry.pathParts, value).forEach(([path, value]) =>
    resp.push({ type: 'path', index: path[0] as number, value })
  );
  objectContainsKey(entry.requestHeaders, value).forEach(([path, value]) =>
    resp.push({ type: 'headers', key: path[0] as string, value })
  );
  objectContainsKey(entry.queryParams, value).forEach(([path, value]) =>
    resp.push({ type: 'queryParams', path, value })
  );
  objectContainsKey(entry.requestBody, value).forEach(([path, value]) =>
    resp.push({ type: 'body', path, value })
  );
  return resp;
}

function objectContains(
  obj: unknown,
  match: string | RegExp,
  path: ResponseBodyPath = []
): [ResponseBodyPath, string][] {
  if (typeof obj === 'string') {
    return strMatches(obj, match) ? [[path, obj]] : [];
  } else if (Array.isArray(obj)) {
    return obj.flatMap((o, i) => objectContains(o, match, [...path, i]));
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) =>
      objectContains(v, match, [...path, k])
    );
  } else {
    return [];
  }
}

function objectContainsKey(
  obj: unknown,
  match: string | RegExp,
  path: ResponseBodyPath = []
): [ResponseBodyPath, string][] {
  if (typeof obj === 'string') {
    return [];
  } else if (Array.isArray(obj)) {
    return obj.flatMap((o, i) => objectContainsKey(o, match, [...path, i]));
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => {
      if (strMatches(k, match) && typeof v === 'string') {
        return [[[...path, k], v]];
      } else {
        return objectContainsKey(v, match, [...path, k]);
      }
    });
  } else {
    return [];
  }
}

function searchObjForMatches(
  obj: unknown,
  matches: string[],
  count: Record<string, number> = {}
): Record<string, number> {
  if (typeof obj === 'string') {
    if (matches.includes(obj)) {
      count[obj] = (count[obj] || 0) + 1;
    }
  } else if (typeof obj === 'number') {
    const objStr = `${obj}`;
    if (matches.includes(objStr)) {
      count[objStr] = (count[objStr] || 0) + 1;
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => searchObjForMatches(v, matches, count));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach((v) => searchObjForMatches(v, matches, count));
  }
  return count;
}

function strMatches(str: string, value: string | RegExp): boolean {
  if (typeof value === 'string') {
    return str === value;
  } else {
    return !!value.exec(str);
  }
}

function parsedQsToSlate(qs: qs.ParsedQs): DataSourceRequest['queryParams'] {
  const rtn: DataSourceRequest['queryParams'] = {};
  const processSingleValue = (
    v: qs.ParsedQs[string]
  ): DataSourceRequest['queryParams'][string] => {
    if (v === undefined) {
      return v;
    } else if (typeof v === 'string') {
      return { __kenchiValueWrapper: true, value: { type: 'text', text: v } };
    } else if (Array.isArray(v)) {
      return v.map(processSingleValue);
    } else {
      return parsedQsToSlate(v);
    }
  };
  Object.entries(qs).forEach(([k, v]) => {
    rtn[k] = processSingleValue(v);
  });
  return rtn;
}
