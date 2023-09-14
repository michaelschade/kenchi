import { useMemo } from 'react';

import { map, sortedLastIndex } from 'lodash';
import { DateTime } from 'luxon';

import { DateRangeGrouping } from '@kenchi/ui/lib/DateRangePicker';

const labelFormat = {
  day: 'LLL d',
  week: 'LLL d',
  month: 'LLL',
};

type Props = {
  dateGrouping: DateRangeGrouping;
  startDate: DateTime;
  endDate: DateTime;
  latestData: DateTime | null;
};

export const useLabels = ({
  dateGrouping,
  startDate,
  endDate,
  latestData,
}: Props): [string[], number | null | undefined] | [undefined, undefined] => {
  return useMemo(() => {
    if (dateGrouping === DateRangeGrouping.overall) {
      return [undefined, undefined];
    }

    let labelDateRanges = [];
    const now = DateTime.now();
    const format = labelFormat[dateGrouping];

    for (
      let labelStart = startDate,
        labelEnd = labelStart.plus({ [dateGrouping]: 1 });
      labelStart < endDate;
      labelStart = labelEnd, labelEnd = labelEnd.plus({ [dateGrouping]: 1 })
    ) {
      labelDateRanges.push([labelStart, labelEnd]);
    }

    const labels = labelDateRanges.map(
      ([startRange, endRange], currentIndex) => {
        if (dateGrouping === DateRangeGrouping.week) {
          const nonOverlappingEndRange =
            currentIndex === labelDateRanges.length - 1
              ? endRange
              : endRange.minus({ day: 1 });

          const endLabel =
            nonOverlappingEndRange >= now
              ? 'Now'
              : nonOverlappingEndRange.toFormat(format);

          return `${startRange.toFormat(format)} - ${endLabel}`;
        }
        return startRange.toFormat(format);
      }
    );

    let partialIndex = null;
    if (latestData) {
      const latestDataSortIndex = sortedLastIndex(
        map(labelDateRanges, 1),
        latestData
      );

      if (latestDataSortIndex < labelDateRanges.length) {
        partialIndex = latestDataSortIndex - 1;
      }
    }

    return [labels, partialIndex];
  }, [dateGrouping, latestData, startDate, endDate]);
};
