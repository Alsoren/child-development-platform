import { useState } from 'react';
import { DEVELOPMENT_AREAS, addTask, getWeekTasks } from '../api/tasks';
import { useWeekly } from '../hooks/useWeekly';
import { today } from '../utils/week';
import WeekNav from './WeekNav';

const badgeClass = {
  pending: 'bg-amber-100 text-amber-800',
  done: 'bg-green-100 text-green-800',
};

// US-M4-01 and US-M4-03: the parent or a linked specialist assigns tasks and follows their status.
export default function TaskBoard({ childId }) {
  const { data, error, prev, next, goTo, reload } = useWeekly(getWeekTasks, childId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [developmentArea, setDevelopmentArea] = useState(DEVELOPMENT_AREAS[0]);
  const [dueDate, setDueDate] = useState(today());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await addTask(childId, { title, description, developmentArea, dueDate });
      setTitle('');
      setDescription('');
      goTo(dueDate); // show the week of the new task
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
      {data && data.tasks.length === 0 && <p className="text-sm text-slate-500">No tasks due this week.</p>}
      {data && data.tasks.length > 0 && (
        <ul className="divide-y divide-slate-200 text-sm">
          {data.tasks.map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-slate-500">{task.developmentArea} · due {task.dueDate}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badgeClass[task.status]}`}>{task.status}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-slate-200 pt-3">
        <label htmlFor="task-title" className="text-sm font-semibold">Task title</label>
        <input id="task-title" value={title} required onChange={(e) => setTitle(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        <label htmlFor="task-description" className="text-sm font-semibold">Description</label>
        <textarea id="task-description" value={description} rows={2} onChange={(e) => setDescription(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        <label htmlFor="task-area" className="text-sm font-semibold">Development area</label>
        <select id="task-area" value={developmentArea} onChange={(e) => setDevelopmentArea(e.target.value)}
          className="p-2 border border-slate-300 rounded-md">
          {DEVELOPMENT_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <label htmlFor="task-due" className="text-sm font-semibold">Due date</label>
        <input id="task-due" type="date" value={dueDate} required onChange={(e) => setDueDate(e.target.value)}
          className="p-2 border border-slate-300 rounded-md" />

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        <button type="submit" disabled={saving}
          className="mt-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Assigning…' : 'Assign task'}
        </button>
      </form>
    </div>
  );
}
