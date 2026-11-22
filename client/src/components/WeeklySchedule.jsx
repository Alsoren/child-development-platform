import { useState } from 'react';
import { addEvent, getWeekEvents } from '../api/events';
import { useWeekly } from '../hooks/useWeekly';
import { dateOf, timeOf, today } from '../utils/week';
import WeekNav from './WeekNav';

// US-M3-01 and US-M3-02: the parent or a linked specialist adds events and sees a child's week.
export default function WeeklySchedule({ childId }) {
  const { data, error, prev, next, goTo, reload } = useWeekly(getWeekEvents, childId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today());
  const [start, setStart] = useState('16:00');
  const [end, setEnd] = useState('17:00');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await addEvent(childId, { title, startAt: `${date} ${start}`, endAt: `${date} ${end}` });
      setTitle('');
      goTo(date); // show the week of the new event
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <WeekNav weekStart={data?.weekStart} weekEnd={data?.weekEnd} onPrev={prev} onNext={next} />

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {data && data.events.length === 0 && <p className="text-sm text-slate-500">No events this week.</p>}
      {data && data.events.length > 0 && (
        <ul className="divide-y divide-slate-200 text-sm">
          {data.events.map((ev) => (
            <li key={ev.id} className="py-2">
              <p className="font-medium">{ev.title}</p>
              <p className="text-slate-500">{dateOf(ev.startAt)} · {timeOf(ev.startAt)} to {timeOf(ev.endAt)}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-slate-200 pt-3">
        <label htmlFor="event-title" className="text-sm font-semibold">Event title</label>
        <input id="event-title" value={title} required onChange={(e) => setTitle(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        <label htmlFor="event-date" className="text-sm font-semibold">Date</label>
        <input id="event-date" type="date" value={date} required onChange={(e) => setDate(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="event-start" className="text-sm font-semibold">Start</label>
            <input id="event-start" type="time" value={start} required onChange={(e) => setStart(e.target.value)}
              className="p-2 border border-slate-300 rounded-md" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="event-end" className="text-sm font-semibold">End</label>
            <input id="event-end" type="time" value={end} required onChange={(e) => setEnd(e.target.value)}
              className="p-2 border border-slate-300 rounded-md" />
          </div>
        </div>

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        <button type="submit" disabled={saving}
          className="mt-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Adding…' : 'Add event'}
        </button>
      </form>
    </div>
  );
}
