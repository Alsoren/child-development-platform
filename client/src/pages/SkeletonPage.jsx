import { useEffect, useState } from 'react';

export default function SkeletonPage() {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sample-task')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        setTask(data.task);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-3 text-lg font-semibold">Walking skeleton</h1>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {!task && !error && <p className="text-sm text-slate-500">Loading…</p>}
        {task && (
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-slate-500">Title</dt><dd>{task.title}</dd>
            <dt className="text-slate-500">Area</dt><dd>{task.developmentArea}</dd>
            <dt className="text-slate-500">Due</dt><dd>{task.dueDate}</dd>
            <dt className="text-slate-500">Status</dt><dd>{task.status}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}