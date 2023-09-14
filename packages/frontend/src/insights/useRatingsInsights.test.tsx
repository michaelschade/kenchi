import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import { createNewCache } from '../graphql/cache';
import {
  InsightsObjectGroupingEnum,
  InsightsQuery,
  InsightsQueryVariables,
  InsightsTypeEnum,
} from '../graphql/generated';
import { RatingsStatistic, useRatingsInsights } from './useRatingsInsights';
import { QUERY } from './useRawInsights';

const mockInsights = (
  variables: InsightsQueryVariables,
  response: Partial<InsightsQuery['insights']>
): MockedResponse => {
  return {
    request: {
      query: QUERY,
      variables,
    },
    result: {
      data: {
        insights: {
          __typename: 'InsightsOutput',
          data: null,
          latestData: null,
          error: null,
          ...response,
        },
      },
    },
  };
};

const mockWrapper =
  (mocks: MockedResponse[]) =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <MockedProvider cache={createNewCache()} mocks={mocks} addTypename={true}>
        {children}
      </MockedProvider>
    );

describe('calculating partially complete data', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('calculates partialIndex', async () => {
    jest.setSystemTime(Date.parse('2021-01-29T00:00:00.000Z'));
    const latestData = '2021-01-28T12:00:00.000Z';
    const mocks: MockedResponse[] = [
      mockInsights(
        {
          startDate: '2021-01-02',
          endDate: '2021-01-29', // 4 weeks starting on Saturday, ending on Friday
          collectionIds: ['a'],
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
          type: InsightsTypeEnum.ratings,
        },
        {
          latestData,
          data: [],
        }
      ),
    ];

    const { result } = renderHook(
      () =>
        useRatingsInsights({
          collectionIds: ['a'],
          startDate: DateTime.fromISO('2021-01-02'),
          endDate: DateTime.fromISO('2021-01-29'),
          dateGrouping: DateRangeGrouping.week,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
          statistic: RatingsStatistic.average,
        }),
      { wrapper: mockWrapper(mocks) }
    );

    await waitFor(() => {
      expect(result.current.latestData).toStrictEqual(
        DateTime.fromISO(latestData)
      );
      expect(result.current.partialIndex).toBe(2); // Second-to-last label (3rd week) is the partial index
    });
  });

  test('calculates partialIndex in future', async () => {
    jest.setSystemTime(Date.parse('2021-02-01T01:00:00.000Z'));
    const latestData = '2021-01-30T12:00:00.000Z';
    const mocks: MockedResponse[] = [
      mockInsights(
        {
          startDate: '2021-01-02',
          endDate: '2021-01-29',
          collectionIds: ['b'],
          type: InsightsTypeEnum.ratings,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
        },
        {
          latestData,
          data: [],
        }
      ),
    ];

    const { result } = renderHook(
      () =>
        useRatingsInsights({
          collectionIds: ['b'],
          startDate: DateTime.fromISO('2021-01-02'),
          endDate: DateTime.fromISO('2021-01-29'),
          dateGrouping: DateRangeGrouping.week,
          objectGrouping: InsightsObjectGroupingEnum.collectionId,
          statistic: RatingsStatistic.average,
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
});

test('aggregates by average', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-02',
        endDate: '2021-01-15', // 2 weeks starting on Saturday, ending on Friday
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.ratings,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      {
        data: [
          { grouping: 'a', day: '2021-01-02', rating: 3, count: 1 },
          { grouping: 'a', day: '2021-01-02', rating: 5, count: 1 },
          { grouping: 'a', day: '2021-01-03', rating: 1, count: 1 },
          { grouping: 'a', day: '2021-01-03', rating: 2, count: 2 },
          { grouping: 'a', day: '2021-01-09', rating: 4, count: 2 },
          { grouping: 'a', day: '2021-01-10', rating: 1, count: 1 },
          { grouping: 'b', day: '2021-01-02', rating: 4, count: 1 },
        ],
      }
    ),
  ];

  const { result } = renderHook(
    () =>
      useRatingsInsights({
        collectionIds: ['a', 'b'],
        startDate: DateTime.fromISO('2021-01-02'),
        endDate: DateTime.fromISO('2021-01-15'),
        dateGrouping: DateRangeGrouping.week,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
        statistic: RatingsStatistic.average,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toStrictEqual([
      'Jan 2 - Jan 8',
      'Jan 9 - Jan 16',
    ]);
    expect(result.current.ratings).toStrictEqual({
      a: [
        { group: DateTime.fromISO('2021-01-02'), value: 2.6, count: 5 },
        { group: DateTime.fromISO('2021-01-09'), value: 3, count: 3 },
      ],
      b: [
        { group: DateTime.fromISO('2021-01-02'), value: 4, count: 1 },
        { group: DateTime.fromISO('2021-01-09'), value: NaN, count: 0 },
      ],
    });
  });
});

test('aggregates by percent4or5', async () => {
  const mocks: MockedResponse[] = [
    mockInsights(
      {
        startDate: '2021-01-01',
        endDate: '2021-01-14',
        collectionIds: ['a', 'b'],
        type: InsightsTypeEnum.ratings,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      {
        data: [
          { grouping: 'a', day: '2021-01-02', rating: 3, count: 1 },
          { grouping: 'a', day: '2021-01-02', rating: 5, count: 1 },
          { grouping: 'a', day: '2021-01-03', rating: 1, count: 1 },
          { grouping: 'a', day: '2021-01-03', rating: 2, count: 2 },
          { grouping: 'a', day: '2021-01-09', rating: 4, count: 2 },
          { grouping: 'a', day: '2021-01-10', rating: 1, count: 1 },
          { grouping: 'b', day: '2021-01-02', rating: 4, count: 1 },
        ],
      }
    ),
  ];

  const { result } = renderHook(
    () =>
      useRatingsInsights({
        collectionIds: ['a', 'b'],
        startDate: DateTime.fromISO('2021-01-01'),
        endDate: DateTime.fromISO('2021-01-14'),
        dateGrouping: DateRangeGrouping.week,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
        statistic: RatingsStatistic.percent4or5,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toStrictEqual([
      'Jan 1 - Jan 7',
      'Jan 8 - Jan 15',
    ]);
    expect(result.current.ratings).toStrictEqual({
      a: [
        { group: DateTime.fromISO('2021-01-01'), value: 20, count: 5 },
        { group: DateTime.fromISO('2021-01-08'), value: 67, count: 3 },
      ],
      b: [
        { group: DateTime.fromISO('2021-01-01'), value: 100, count: 1 },
        { group: DateTime.fromISO('2021-01-08'), value: NaN, count: 0 },
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
        collectionIds: ['a'],
        type: InsightsTypeEnum.ratings,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
      },
      {
        data: [
          { grouping: 'a', day: '2021-01-02', rating: 1, count: 1 },
          { grouping: 'a', day: '2021-01-03', rating: 2, count: 2 },
          { grouping: 'a', day: '2021-03-04', rating: 3, count: 2 },
          { grouping: 'a', day: '2021-03-09', rating: 4, count: 1 },
        ],
      }
    ),
  ];

  const { result } = renderHook(
    () =>
      useRatingsInsights({
        collectionIds: ['a'],
        startDate: DateTime.fromISO('2021-01-01'),
        endDate: DateTime.fromISO('2021-03-30'),
        dateGrouping: DateRangeGrouping.overall,
        objectGrouping: InsightsObjectGroupingEnum.collectionId,
        statistic: RatingsStatistic.average,
      }),
    { wrapper: mockWrapper(mocks) }
  );

  await waitFor(() => {
    expect(result.current.labels).toBe(undefined);
    expect(result.current.ratings).toStrictEqual({
      a: { value: 2.5, count: 6 },
    });
  });
});
