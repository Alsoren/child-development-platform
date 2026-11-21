import { useState } from 'react';
import { completeTask, getWeekTasks } from '../api/tasks';
import { useWeekly } from '../hooks/useWeekly';
import WeekNav from './WeekNav';

// US-M4-02: the child sees their own tasks of the week and marks them as done.
export default function MyTasks({ childId }) {
  const { data, setData, error, prev, next } = useWeekly(getWeekTasks, childId);
  const [actionError, setActionError] = useState('');

  const markDone = async (taskId) => {
    setActionError('');
    try {
      const { task } = await completeTask(childId, taskId);
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === task.id ? task : t)) }));
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <WeekNav weekStart={data?.weekStart} weekEnd={data?.weekEnd} onPrev={prev} onNext={next} />

      {(error || actionError) && <p role="alert" className="text-sm text-red-600">{error || actionError}</p>}
      {data && data.tasks.length === 0 && <p className="text-sm text-slate-500">No tasks this week.</p>}
      {data && data.tasks.length > 0 && (
        <ul className="divide-y divide-slate-200 text-sm">
          {data.tasks.map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{task.title}</p>
                {task.description && <p className="text-slate-600">{task.description}</p>}
                <p className="text-slate-500">{task.developmentArea} · due {task.dueDate}</p>
              </div>
              {task.status === 'done' ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Done</span>
              ) : (
                <button type="button" onClick={() => markDone(task.id)} aria-label={`Mark "${task.title}" as done`}
                  className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">
                  Mark done
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
