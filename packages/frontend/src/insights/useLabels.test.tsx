import { renderHook } from '@testing-library/react-hooks';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

import { useLabels } from './useLabels';

describe('label by week', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('uses non-overlapping date ranges for labels', async () => {
    jest.setSystemTime(Date.parse('01 Feb 2022 00:00:00 GMT'));
    const {
      result: {
        current: [labels, _],
      },
    } = renderHook(() =>
      useLabels({
        dateGrouping: DateRangeGrouping.week,
        startDate: DateTime.fromISO('2022-01-02'),
        endDate: DateTime.fromISO('2022-01-29'),
        latestData: DateTime.fromISO('2022-01-30'),
      })
    );
    // Jan 2 - 29 is exactly 4 weeks from Sunday to Saturday
    // End dates are shortened by one day to prevent labels from overlapping
    expect(labels).toStrictEqual([
      'Jan 2 - Jan 8',
      'Jan 9 - Jan 15',
      'Jan 16 - Jan 22',
      'Jan 23 - Jan 30', // No next label to overlap, so use a full 7-day range
    ]);
  });

  it('uses "Now" when the end of the range is beyond the current date', () => {
    jest.setSystemTime(Date.parse('29 Jan 2022 00:00:00 GMT'));
    const {
      result: {
        current: [labels, _],
      },
    } = renderHook(() =>
      useLabels({
        dateGrouping: DateRangeGrouping.week,
        startDate: DateTime.fromISO('2022-01-02'),
        endDate: DateTime.fromISO('2022-01-29'),
        latestData: DateTime.fromISO('2022-01-29'),
      })
    );
    expect(labels).toStrictEqual([
      'Jan 2 - Jan 8',
      'Jan 9 - Jan 15',
      'Jan 16 - Jan 22',
      // This last label stretches all the way to the 30th, but the date for
      // this test is is Jan 29
      'Jan 23 - Now',
    ]);
  });
});

describe('calculating partial data index', () => {
  it('returns partialIndex when the latest data is less than the graph range', () => {
    // Last plot point is Jan 23 - 30
    const {
      result: {
        current: [_, partialIndex],
      },
    } = renderHook(() =>
      useLabels({
        dateGrouping: DateRangeGrouping.week,
        startDate: DateTime.fromISO('2022-01-02'),
        endDate: DateTime.fromISO('2022-01-29'),
        latestData: DateTime.fromISO('2022-01-29T23:59:59'),
      })
    );
    expect(partialIndex).toEqual(2); // second-to-last plot point
  });

  it('does not return a partialIndex when latest data is beyond the graph range', () => {
    // Last plot point is Jan 23 - 30
    const {
      result: {
        current: [_, partialIndex],
      },
    } = renderHook(() =>
      useLabels({
        dateGrouping: DateRangeGrouping.week,
        startDate: DateTime.fromISO('2022-01-02'),
        endDate: DateTime.fromISO('2022-01-29'),
        latestData: DateTime.fromISO('2022-01-31'),
      })
    );
    expect(partialIndex).toBeNull();
  });

  it('partial index can come earlier and mark multiple segments of the graph as partial data', () => {
    // Last plot points are Jan 16 - 22, Jan 23 - 30
    // Mark both as partial data
    const {
      result: {
        current: [_, partialIndex],
      },
    } = renderHook(() =>
      useLabels({
        dateGrouping: DateRangeGrouping.week,
        startDate: DateTime.fromISO('2022-01-02'),
        endDate: DateTime.fromISO('2022-01-29'),
        latestData: DateTime.fromISO('2022-01-20'),
      })
    );
    expect(partialIndex).toEqual(1); // second of the four labels
  });
});
