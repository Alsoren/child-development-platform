import { useEffect, useState } from 'react';
import { getUpcomingEvents } from '../api/events';
import { dateOf, timeOf } from '../utils/week';

// US-M3-03: the child sees the upcoming events of their own schedule.
export default function UpcomingEvents({ childId }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUpcomingEvents(childId)
      .then((data) => active && setEvents(data.events))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [childId]);

  return (
    <div className="mt-3">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {events && events.length === 0 && <p className="text-sm text-slate-500">No upcoming events.</p>}
      {events && events.length > 0 && (
        <ul className="divide-y divide-slate-200 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="py-2">
              <p className="font-medium">{ev.title}</p>
              <p className="text-slate-500">{dateOf(ev.startAt)} · {timeOf(ev.startAt)} to {timeOf(ev.endAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
