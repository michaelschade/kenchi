import { DateTime } from 'luxon';

export function pastDateString(date: DateTime) {
  const now = DateTime.now();
  if (now.hasSame(date, 'week')) {
    return date.toRelative();
  } else if (now.hasSame(date, 'year')) {
    return date.toFormat('MMM d');
  } else {
    return date.toFormat('MMM d, y');
  }
}
