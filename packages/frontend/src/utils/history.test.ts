import collectionFactory from '../test/factories/collection';
import toolFactory from '../test/factories/tool';
import workflowFactory from '../test/factories/workflow';
import { getPath, initHistory } from './history';

test('goBack across non-edit pages', async () => {
  navigator.sendBeacon = jest.fn();
  const history = initHistory(true);
  history.push('/a');
  expect(history.location.pathname).toBe('/a');
  history.push('/b');
  expect(history.location.pathname).toBe('/b');
  history.push('/c');
  expect(history.location.pathname).toBe('/c');
  history.goBack();
  expect(history.location.pathname).toBe('/b');
  history.goBack();
  expect(history.location.pathname).toBe('/a');
});

test('goBack skips edit pages', async () => {
  navigator.sendBeacon = jest.fn();
  const history = initHistory(true);
  history.push('/a');
  expect(history.location.pathname).toBe('/a');
  history.push('/edit');
  expect(history.location.pathname).toBe('/edit');
  history.push('/edit/2');
  expect(history.location.pathname).toBe('/edit/2');
  history.push('/b');
  expect(history.location.pathname).toBe('/b');
  history.goBack();
  expect(history.location.pathname).toBe('/a');
});

describe('getPath', () => {
  test.each([
    [
      'collection',
      collectionFactory.build({ id: 'coll_abc' }),
      '/collections/coll_abc',
    ],
    [
      'snippet',
      toolFactory.build({ staticId: 'tool_abc' }),
      '/snippets/tool_abc',
    ],
    [
      'playbook',
      workflowFactory.build({ staticId: 'wrkf_abc' }),
      '/playbooks/wrkf_abc',
    ],
  ])('gets the path to a %s', (name, object, expectedPath) => {
    expect(getPath(object)).toEqual(expectedPath);
  });
});
