import qs from 'qs';

import { KenchiMessageRouter } from '@kenchi/commands';
import { isSuccess } from '@kenchi/shared/lib/Result';

import {
  ComputedValue,
  ComputedValueRequest,
  DataSourceOutput,
  DataSourceRequest,
  isComputedValueWrapper,
  ResponseBodyPath,
} from './types';

export async function fetchGetFullResponses(
  router: KenchiMessageRouter<'app'>,
  email: string,
  requests: DataSourceRequest[]
) {
  const requestToDependentRequests: Record<string, Set<string>> = {};
  requests.forEach((r) => (requestToDependentRequests[r.id] = new Set()));
  requests.forEach((r) => {
    const dependencies = getEdges(r);
    dependencies.forEach((dep) => {
      requestToDependentRequests[dep].add(r.id);
    });
  });

  function topologicalSortImpl(
    request: DataSourceRequest,
    visited: Set<string>,
    stack: DataSourceRequest[]
  ) {
    visited.add(request.id);

    requestToDependentRequests[request.id].forEach((edgeId) => {
      if (!visited.has(edgeId)) {
        const nextRequest = requests.find((r) => r.id === edgeId);
        if (!nextRequest) {
          throw new Error(`Could not find ${edgeId}`);
        }
        topologicalSortImpl(nextRequest, visited, stack);
      }
    });

    stack.push(request);
  }

  const requestsWithNoDependencies = Object.keys(
    requestToDependentRequests
  ).filter((requestId) =>
    Object.values(requestToDependentRequests).every(
      (deps) => !deps.has(requestId)
    )
  );
  const visited = new Set<string>();
  const stack: DataSourceRequest[] = [];
  requestsWithNoDependencies.forEach((requestId) => {
    if (!visited.has(requestId)) {
      const nextRequest = requests.find((r) => r.id === requestId);
      if (!nextRequest) {
        throw new Error(`Could not find ${requestId}`);
      }
      topologicalSortImpl(nextRequest, visited, stack);
    }
  });
  stack.reverse();

  const bodiesById: Record<string, unknown> = {};
  const fetchCallback = (id: string, path: ResponseBodyPath): string => {
    const body = bodiesById[id];
    if (!body) {
      throw new Error(`Could not find body for ${id}`);
    }
    return resolvePath(body, path) as string;
  };

  for (const request of stack) {
    const body = await playbackSingleRequest(
      router,
      email,
      request,
      fetchCallback
    );
    bodiesById[request.id] = body;
  }

  return bodiesById;
}

export async function fetchPlayback(
  router: KenchiMessageRouter<'app'>,
  email: string,
  requests: DataSourceRequest[],
  outputs: DataSourceOutput[]
) {
  const visited = new Set<string>();
  const stack: DataSourceRequest[] = [];
  outputs.forEach((output) => {
    const requestId = output.value.requestId;
    if (!visited.has(requestId)) {
      const nextRequest = requests.find((r) => r.id === requestId);
      if (!nextRequest) {
        throw new Error(`Could not find ${requestId}`);
      }
      topologicalSortImpl(requests, nextRequest, visited, stack);
    }
  });

  // stack now contains a topological sort from the earliest necessary request
  // to the latest. Note that there are multiple valid topological sorts, this
  // is just one possible one.

  const bodiesById: Record<string, unknown> = {};
  const fetchCallback = (id: string, path: ResponseBodyPath): string => {
    const body = bodiesById[id];
    if (!body) {
      throw new Error(`Could not find body for ${id}`);
    }
    return resolvePath(body, path) as string;
  };

  for (const request of stack) {
    const body = await playbackSingleRequest(
      router,
      email,
      request,
      fetchCallback
    );
    bodiesById[request.id] = body;
  }

  return Object.fromEntries(
    outputs.map((output) => {
      return [
        output.value.requestId,
        resolvePath(bodiesById[output.value.requestId], output.value.path),
      ];
    })
  );
}

async function playbackSingleRequest(
  router: KenchiMessageRouter<'app'>,
  email: string,
  request: DataSourceRequest,
  fetchCallback: (id: string, path: ResponseBodyPath) => string
) {
  console.log('Playing back', request.id);
  let url = renderComputedValue(request.url, { email }, fetchCallback);
  if (Object.keys(request.queryParams).length > 0) {
    url += `?${qs.stringify(
      renderAnything(request.queryParams, { email }, fetchCallback)
    )}`;
  }

  const headers: Record<string, string> = {};
  Object.entries(request.headers).forEach(([k, v]) => {
    headers[k] = renderComputedValue(v, { email }, fetchCallback)!;
  });

  const body = renderAnything(request.body, { email }, fetchCallback);

  const res = await router.sendCommand('background', 'datasourceFetchRun', {
    url: url!,
    opts: {
      method: request.method,
      credentials: request.credentials,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    },
  });

  if (isSuccess(res)) {
    if (res.data.status !== 200) {
      throw new Error(`Fetch failed: ${res.data.status}, ${res.data.bodyText}`);
    }
    const body = JSON.parse(res.data.bodyText);
    return body;
  } else {
    throw new Error(`Fetch failed: ${res.error}`);
  }
}

function topologicalSortImpl(
  requests: DataSourceRequest[],
  request: DataSourceRequest,
  visited: Set<string>,
  stack: DataSourceRequest[]
) {
  visited.add(request.id);

  getEdges(request).forEach((edgeId) => {
    if (!visited.has(edgeId)) {
      const nextRequest = requests.find((r) => r.id === edgeId);
      if (!nextRequest) {
        throw new Error(`Could not find ${edgeId}`);
      }
      topologicalSortImpl(requests, nextRequest, visited, stack);
    }
  });

  stack.push(request);
}

function resolvePath(obj: unknown, path: ResponseBodyPath): string | undefined {
  let current: any = obj;
  for (const part of path) {
    if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function getEdges(request: DataSourceRequest) {
  const edges = new Set<string>();

  findRequestsInComputedValue(request.url).forEach((f) =>
    edges.add(f.requestId)
  );
  for (const key in request.headers) {
    const fetches = findRequestsInComputedValue(request.headers[key]);
    fetches.forEach((f) => edges.add(f.requestId));
  }
  findRequestsAnywhere(request.queryParams).forEach((f) =>
    edges.add(f.requestId)
  );

  return edges;
}

function findRequestsAnywhere(obj: unknown): ComputedValueRequest[] {
  if (isComputedValueWrapper(obj)) {
    return findRequestsInComputedValue(obj.value);
  } else if (Array.isArray(obj)) {
    return obj.flatMap(findRequestsAnywhere);
  } else if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap(findRequestsAnywhere);
  } else {
    return [];
  }
}

function findRequestsInComputedValue(
  value: ComputedValue
): ComputedValueRequest[] {
  if (value.type === 'concat') {
    return value.children.flatMap((child) =>
      findRequestsInComputedValue(child)
    );
  } else if (value.type === 'request') {
    return [value];
  } else {
    return [];
  }
}

function renderAnything<T extends unknown>(
  obj: T,
  inputMap: Record<string, string>,
  requestCallback: (id: string, path: ResponseBodyPath) => string | undefined
): T {
  if (isComputedValueWrapper(obj)) {
    return renderComputedValue(obj.value, inputMap, requestCallback) as T;
  } else if (Array.isArray(obj)) {
    return obj.map((v) => renderAnything(v, inputMap, requestCallback)) as T;
  } else if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    Object.keys(obj as any).forEach((k) => {
      result[k] = renderAnything((obj as any)[k], inputMap, requestCallback);
    });
    return result as T;
  } else {
    return obj;
  }
}

function renderComputedValue(
  value: ComputedValue,
  inputMap: Record<string, string>,
  requestCallback: (id: string, path: ResponseBodyPath) => string | undefined
): string | undefined {
  switch (value.type) {
    case 'concat':
      const concat = value.children.map((child) =>
        renderComputedValue(child, inputMap, requestCallback)
      );
      if (concat.some((c) => c === undefined)) {
        return undefined;
      } else {
        return concat.join('');
      }
    case 'request':
      return requestCallback(value.requestId, value.path);
    case 'input':
      return inputMap[value.id];
    case 'text':
      return value.text;
    default:
      throw new Error('Unknown slate type');
  }
}
