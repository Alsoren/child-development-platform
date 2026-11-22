import { useEffect, useState } from 'react';
import { shiftWeeks, today } from '../utils/week';

// Loads one week of data for a child. `fetcher(childId, date)` must be a stable function.
// `week` is any date inside the shown week; the server answers with weekStart and weekEnd.
export function useWeekly(fetcher, childId) {
  const [week, setWeek] = useState(today());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    fetcher(childId, week)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [fetcher, childId, week, version]);

  return {
    data,
    setData,
    error,
    prev: () => setWeek((w) => shiftWeeks(w, -1)),
    next: () => setWeek((w) => shiftWeeks(w, 1)),
    goTo: (date) => setWeek(date),
    reload: () => setVersion((v) => v + 1),
  };
}
