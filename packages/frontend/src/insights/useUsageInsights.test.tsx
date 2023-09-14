import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import {
  InsightsObjectGroupingEnum,
  InsightsQuery,
  InsightsQueryVariables,
  InsightsTypeEnum,
} from '../graphql/generated';
import insightsFactory from '../test/factories/insights';
import { QUERY } from './useRawInsights';
import { useUsageInsights } from './useUsageInsights';

const mockInsights = (
  variables: InsightsQueryVariables,
  insights: InsightsQuery['insights']
): MockedResponse => {
  return {
    request: {
      query: QUERY,
      variables,
    },
    result: {
      data: {
        insights,
      },
    },
  };
};

const mockWrapper =
  (mocks: MockedResponse[]) =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <MockedProvider mocks={mocks} addTypename={true}>
        {children}
      </MockedProvider>
    );

describe('calculating partially complete data', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('sets partialIndex when the graph extends beyond the current time', async () => {
    jest.setSystemTime(Date.parse('2021-01-29T00:00:00.000Z'));
    const latestData = '2021-01-28T12:00:00.000Z';
    const mocks: MockedResponse[] = [
      mockInsights(
        {
          startDate: '2021-01-02',
          endDate: '2021-01-29', // 4 weeks starting on Saturday, ending on Friday
          collectionIds: ['a'],
          type: InsightsTypeEnum.workflowUsage,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        },
        insightsFactory.build({ data: [], latestData })
      ),
    ];

    const { result } = renderHook(
      () =>
        useUsageInsights({
          collectionIds: ['a'],
          type: InsightsTypeEnum.workflowUsage,
          startDate: DateTime.fromISO('2021-01-02'),
          endDate: DateTime.fromISO('2021-01-29'),
          dateGrouping: DateRangeGrouping.week,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        }),
      { wrapper: mockWrapper(mocks) }
    );

    await waitFor(() => {
      expect(result.current.latestData).toStrictEqual(
        DateTime.fromISO(latestData)
      );
      expect(result.current.partialIndex).toBe(2); // Second to last data point on the chart
    });
  });

  test('no partial index when the chart ends before the current time', async () => {
    jest.setSystemTime(Date.parse('2021-02-01T01:00:00.000Z'));
    const latestData = '2021-01-30T12:00:00.000Z';
    const mocks: MockedResponse[] = [
      mockInsights(
        {
          startDate: '2021-01-02',
          endDate: '2021-01-29',
          collectionIds: ['b'],
          type: InsightsTypeEnum.workflowUsage,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        },
        insightsFactory.build({ data: [], latestData })
      ),
    ];

    const { result } = renderHook(
      () =>
        useUsageInsights({
          collectionIds: ['b'],
          type: InsightsTypeEnum.workflowUsage,
          startDate: DateTime.fromISO('2021-01-02'),
          endDate: DateTime.fromISO('2021-01-29'),
          dateGrouping: DateRangeGrouping.week,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        }),
      { wrapper: mockWrapper(mocks) }
    );

    await waitFor(() => {
      expect(result.current.latestData).toStrictEqual(
        DateTime.fromISO(latestData)
      );
      expect(result.current.partialIndex).toBe(null); // Last label (4th week) is the partial index
    });
  });

  test('sets partialIndex when the graph extends beyond the current time and there are just two data points', async () => {
    jest.setSystemTime(Date.parse('2022-03-14T16:00:00.000Z'));
    const mocks: MockedResponse[] = [
      mockInsights(
        {
          startDate: '2022-03-06',
          endDate: '2022-03-14',
          collectionIds: ['a'],
          type: InsightsTypeEnum.workflowUsage,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        },
        insightsFactory.build({
          data: [
            { grouping: 'a', day: '2022-03-07', count: 8 },
            { grouping: 'a', day: '2022-03-13', count: 3 },
          ],
          latestData: '2022-03-13T11:18:02.958Z',
        })
      ),
    ];

    const { result } = renderHook(
      () =>
        useUsageInsights({
          collectionIds: ['a'],
          type: InsightsTypeEnum.workflowUsage,
          startDate: DateTime.fromISO('2022-03-06'),
          endDate: DateTime.fromISO('2022-03-14'),
          dateGrouping: DateRangeGrouping.week,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        }),
      { wrapper: mockWrapper(mocks) }
    );

    await waitFor(() => {
      expect(result.current.partialIndex).toBe(0); // Second to last data point on the chart is the first data point
    });
  });
});

test('aggregates by week', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-02',
        endDate: '2021-01-29', // 4 weeks starting on Saturday, ending on Friday
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      insightsFactory.build({
        data: [
          { grouping: 'a', day: '2021-01-02', count: 1 },
          { grouping: 'a', day: '2021-01-03', count: 2 },
          { grouping: 'a', day: '2021-01-04', count: 3 },
          { grouping: 'a', day: '2021-01-09', count: 1 },
          { grouping: 'a', day: '2021-01-10', count: 1 },
          { grouping: 'a', day: '2021-01-16', count: 1 },
          { grouping: 'b', day: '2021-01-02', count: 1 },
        ],
      })
    ),
  ];

  const { result } = renderHook(
    () =>
      useUsageInsights({
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        startDate: DateTime.fromISO('2021-01-02'),
        endDate: DateTime.fromISO('2021-01-29'),
        dateGrouping: DateRangeGrouping.week,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toStrictEqual([
      'Jan 2 - Jan 8',
      'Jan 9 - Jan 15',
      'Jan 16 - Jan 22',
      'Jan 23 - Jan 30',
    ]);
    expect(result.current.usage).toStrictEqual({
      a: [
        { group: DateTime.fromISO('2021-01-02'), count: 6 },
        { group: DateTime.fromISO('2021-01-09'), count: 2 },
        { group: DateTime.fromISO('2021-01-16'), count: 1 },
        { group: DateTime.fromISO('2021-01-23'), count: 0 },
      ],
      b: [
        { group: DateTime.fromISO('2021-01-02'), count: 1 },
        { group: DateTime.fromISO('2021-01-09'), count: 0 },
        { group: DateTime.fromISO('2021-01-16'), count: 0 },
        { group: DateTime.fromISO('2021-01-23'), count: 0 },
      ],
    });
  });
});

test('aggregates by month', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-01',
        endDate: '2021-03-31',
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      insightsFactory.build({
        data: [
          { grouping: 'a', day: '2021-01-02', count: 1 },
          { grouping: 'a', day: '2021-01-03', count: 2 },
          { grouping: 'a', day: '2021-03-04', count: 3 },
          { grouping: 'a', day: '2021-03-09', count: 1 },
          { grouping: 'b', day: '2021-02-02', count: 1 },
        ],
      })
    ),
  ];

  const { result } = renderHook(
    () =>
      useUsageInsights({
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        startDate: DateTime.fromISO('2021-01-01'),
        endDate: DateTime.fromISO('2021-03-31'),
        dateGrouping: DateRangeGrouping.month,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toStrictEqual(['Jan', 'Feb', 'Mar']);
    expect(result.current.usage).toStrictEqual({
      a: [
        { group: DateTime.fromISO('2021-01-01'), count: 3 },
        { group: DateTime.fromISO('2021-02-01'), count: 0 },
        { group: DateTime.fromISO('2021-03-01'), count: 4 },
      ],
      b: [
        { group: DateTime.fromISO('2021-01-01'), count: 0 },
        { group: DateTime.fromISO('2021-02-01'), count: 1 },
        { group: DateTime.fromISO('2021-03-01'), count: 0 },
      ],
    });
  });
});

test('aggregates total', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-01',
        endDate: '2021-03-30',
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },

      insightsFactory.build({
        data: [
          { grouping: 'a', day: '2021-01-02', count: 1 },
          { grouping: 'a', day: '2021-01-03', count: 2 },
          { grouping: 'a', day: '2021-03-04', count: 3 },
          { grouping: 'a', day: '2021-03-09', count: 1 },
          { grouping: 'b', day: '2021-02-02', count: 1 },
        ],
      })
    ),
  ];

  const { result } = renderHook(
    () =>
      useUsageInsights({
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.workflowUsage,
        startDate: DateTime.fromISO('2021-01-01'),
        endDate: DateTime.fromISO('2021-03-30'),
        dateGrouping: DateRangeGrouping.overall,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toBe(undefined);
    expect(result.current.usage).toStrictEqual({
      a: 7,
      b: 1,
    });
  });
});

test('null insights', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-02',
        endDate: '2021-01-29', // 4 weeks starting on Saturday, ending on Friday
        collectionIds: ['a'],
        type: InsightsTypeEnum.workflowUsage,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      insightsFactory.build({ data: null })
    ),
  ];

  const { result } = renderHook(
    () =>
      useUsageInsights({
        collectionIds: ['a'],
        type: InsightsTypeEnum.workflowUsage,
        startDate: DateTime.fromISO('2021-01-02'),
        endDate: DateTime.fromISO('2021-01-29'),
        dateGrouping: DateRangeGrouping.week,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  // await waitForNextUpdate();
  await waitFor(() => expect(result.current.usage).toEqual({}));
});
