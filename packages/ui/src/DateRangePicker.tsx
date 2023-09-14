import { useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { faCalendarEdit } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import capitalize from 'lodash/capitalize';
import { DateTime } from 'luxon';

import { SecondaryButton } from './Button';
import { Separator } from './Dashboard/Separator';
import { Popover } from './Popover';
import { ToggleButtonGroup } from './ToggleButton';

const Container = styled.div`
  display: grid;
  font-size: 0.8rem;
  gap: 0.5rem;
`;

// This border-left is a little hack to make the left edge of the
// "Group by" label perfectly align with the left edge of the button
// text for the date range preset buttons, which have a 1px border.
const GroupingArea = styled.div`
  align-items: center;
  border-left: 1px solid transparent;
  display: inline-grid;
  grid-gap: 0.5rem;
  grid-template-columns: auto minmax(0, 1fr);
  padding-left: 0.4rem;
`;

const CustomDatesArea = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-gap: 0.5rem;

  label {
    margin-bottom: 0;
  }
`;

const DateInput = styled.input`
  border: 1px solid transparent;
  border-radius: 0.25rem;
  text-align: right;
  &::-webkit-datetime-edit-day-field:focus,
  &::-webkit-datetime-edit-month-field:focus,
  &::-webkit-datetime-edit-year-field:focus {
    background-color: ${({ theme }) => theme.colors.accent[6]};
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent[4]};
  }

  &:focus {
    border: 1px solid ${({ theme }) => theme.colors.accent[8]};
    outline: 0;
    box-shadow: 0 0 0 0.2rem ${({ theme: { colors } }) => colors.accent[7]};
    background-color: ${({ theme }) => theme.colors.accent[4]};
  }
`;

const Label = styled.label`
  margin-bottom: 0;
`;

const LabelAndInput = styled.div`
  padding-left: 0.4rem;
  display: inline-grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  grid-gap: 0.5rem;
`;

export enum DateRangeGrouping {
  day = 'day',
  week = 'week',
  month = 'month',
  overall = 'overall',
}

export const rangely = {
  [DateRangeGrouping.day]: 'daily',
  [DateRangeGrouping.week]: 'weekly',
  [DateRangeGrouping.month]: 'monthly',
  [DateRangeGrouping.overall]: 'overall',
};

export enum DateRangePreset {
  pastSevenDays = 'pastSevenDays',
  pastThirtyDays = 'pastThirtyDays',
  pastNinetyDays = 'pastNinetyDays',
  currentMonth = 'currentMonth',
  previousMonth = 'previousMonth',
}

export const dateRangePresets = {
  [DateRangePreset.pastSevenDays]: {
    start: () => DateTime.now().startOf('day').minus({ days: 7 }),
    end: () => DateTime.now().endOf('day'),
    label: 'Past 7 days',
  },
  [DateRangePreset.pastThirtyDays]: {
    start: () => DateTime.now().startOf('day').minus({ days: 30 }),
    end: () => DateTime.now().endOf('day'),
    label: 'Past 30 days',
  },
  [DateRangePreset.pastNinetyDays]: {
    start: () => DateTime.now().startOf('day').minus({ days: 90 }),
    end: () => DateTime.now().endOf('day'),
    label: 'Past 90 days',
  },
  [DateRangePreset.currentMonth]: {
    start: () => DateTime.now().startOf('month'),
    end: () => DateTime.now().endOf('day'),
    label: 'Current month',
  },
  [DateRangePreset.previousMonth]: {
    start: () => DateTime.now().minus({ months: 1 }).startOf('month'),
    end: () => DateTime.now().minus({ months: 1 }).endOf('month'),
    label: 'Previous month',
  },
};

const defaultGrouping = DateRangeGrouping.week;
const displayFormat = DateTime.DATE_MED;

const PopoverTriggerButton = styled(SecondaryButton)`
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  white-space: nowrap;
`;

type DateRangePickerProps = {
  onChangeDates: (
    startDate: DateTime,
    endDate: DateTime,
    preset: DateRangePreset | 'custom'
  ) => void;
  selectedStart?: DateTime;
  selectedEnd?: DateTime;
  selectedGrouping: DateRangeGrouping;
  onChangeGrouping: (grouping: DateRangeGrouping) => void;
};

export function DateRangePicker({
  onChangeDates,
  selectedStart: rawSelectedStart,
  selectedEnd: rawSelectedEnd,
  selectedGrouping = defaultGrouping,
  onChangeGrouping,
}: DateRangePickerProps) {
  const defaultDateRange = dateRangePresets[DateRangePreset.pastSevenDays];
  const selectedStart = rawSelectedStart
    ? rawSelectedStart.startOf('day')
    : defaultDateRange.start();
  const selectedEnd = rawSelectedEnd
    ? rawSelectedEnd.endOf('day')
    : defaultDateRange.end();
  const selectedPresetKey = (
    Object.keys(dateRangePresets) as DateRangePreset[]
  ).find((preset) => {
    return (
      selectedStart.equals(dateRangePresets[preset].start()) &&
      selectedEnd.equals(dateRangePresets[preset].end())
    );
  });
  const [shouldShowCustomDateInputs, setShouldShowCustomDateInputs] = useState(
    !selectedPresetKey
  );
  const customStartInput = useRef<HTMLInputElement>(null);
  const customEndInput = useRef<HTMLInputElement>(null);

  const onChangeSelectedPreset = (preset: DateRangePreset | 'custom') => {
    if (preset === 'custom') {
      const savedCustomStart = localStorage.getItem('customStartDate');
      const savedCustomEnd = localStorage.getItem('customEndDate');
      if (savedCustomStart && savedCustomEnd) {
        const customStart = DateTime.fromISO(savedCustomStart);
        const customEnd = DateTime.fromISO(savedCustomEnd);
        onChangeDates(customStart, customEnd, preset);
      }
      setShouldShowCustomDateInputs(true);
      return;
    }
    setShouldShowCustomDateInputs(false);
    onChangeDates(
      dateRangePresets[preset].start(),
      dateRangePresets[preset].end(),
      preset
    );
  };

  const onChangeCustomDate = () => {
    const customStart = DateTime.fromISO(customStartInput.current!.value);
    const customEnd = DateTime.fromISO(customEndInput.current!.value);
    if (customStart.isValid && customEnd.isValid) {
      // We need to guard against invalid dates here because the date inputs
      // can momentarily spit out invalid dates when the user is typing.
      localStorage.setItem('customStartDate', customStartInput.current!.value);
      localStorage.setItem('customEndDate', customEndInput.current!.value);
      onChangeDates(customStart, customEnd, 'custom');
    }
  };

  const validGroupings = useMemo(() => {
    // Returns valid groupings in order from largest to smallest
    const diff = selectedEnd.diff(selectedStart, 'days');
    if (diff.days > 32) {
      return [
        DateRangeGrouping.month,
        DateRangeGrouping.week,
        DateRangeGrouping.day,
      ];
    } else if (diff.days > 8) {
      return [DateRangeGrouping.week, DateRangeGrouping.day];
    } else {
      return [DateRangeGrouping.day];
    }
  }, [selectedStart, selectedEnd]);

  useEffect(() => {
    if (shouldShowCustomDateInputs) {
      customStartInput.current?.focus();
    }
  }, [shouldShowCustomDateInputs]);

  useEffect(() => {
    // It could be annoying for old custom date ranges (like from a past visit to this page)
    // to be selected when you're trying to pick a new one
    localStorage.removeItem('customStartDate');
    localStorage.removeItem('customEndDate');
  }, []);

  useEffect(() => {
    if (!validGroupings.includes(selectedGrouping)) {
      onChangeGrouping(validGroupings[0]);
    }
  }, [selectedGrouping, onChangeGrouping, validGroupings]);

  const presetsToggleButtonGroupItems = [
    ...(Object.keys(dateRangePresets) as DateRangePreset[]).map((preset) => {
      return { label: dateRangePresets[preset].label, value: preset };
    }),
    { label: 'Custom', value: 'custom' },
  ];

  const groupingsToggleButtonGroupItems = Object.values(DateRangeGrouping)
    .filter((grouping) => grouping !== DateRangeGrouping.overall)
    .map((grouping) => {
      return {
        label: capitalize(grouping),
        value: grouping,
        disabled: !validGroupings.includes(grouping),
      };
    });

  const popoverContent = (
    <Container>
      <ToggleButtonGroup
        type="single"
        onValueChange={(value: DateRangePreset | 'custom') => {
          if (!value) {
            // Don't allow having no selected date range
            return;
          }
          onChangeSelectedPreset(value);
        }}
        value={(!shouldShowCustomDateInputs && selectedPresetKey) || 'custom'}
        orientation="vertical"
        size="tiny"
        items={presetsToggleButtonGroupItems}
      />

      {shouldShowCustomDateInputs && (
        <>
          <Separator />

          <CustomDatesArea>
            <LabelAndInput>
              <Label>Start</Label>
              <DateInput
                ref={customStartInput}
                type="date"
                value={selectedStart.toISODate()}
                onChange={onChangeCustomDate}
                max={DateTime.now().toISODate()}
              />
            </LabelAndInput>
            <LabelAndInput>
              <Label>End</Label>
              <DateInput
                ref={customEndInput}
                type="date"
                value={selectedEnd.toISODate()}
                onChange={onChangeCustomDate}
                max={DateTime.now().toISODate()}
              />
            </LabelAndInput>
          </CustomDatesArea>
        </>
      )}

      <Separator />

      <GroupingArea>
        <Label>Group by</Label>
        <ToggleButtonGroup
          type="single"
          onValueChange={(value) => {
            if (!value) {
              // Don't allow having no grouping
              return;
            }
            onChangeGrouping(value as DateRangeGrouping);
          }}
          value={selectedGrouping}
          items={groupingsToggleButtonGroupItems}
          size="tiny"
        />
      </GroupingArea>
    </Container>
  );

  const popoverTrigger = (
    <PopoverTriggerButton size="small">
      <FontAwesomeIcon icon={faCalendarEdit} />
      <span>{`${selectedStart.toLocaleString(
        displayFormat
      )} - ${selectedEnd.toLocaleString(displayFormat)}`}</span>
    </PopoverTriggerButton>
  );

  return <Popover content={popoverContent} trigger={popoverTrigger}></Popover>;
}
