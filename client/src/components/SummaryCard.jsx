import { useState } from 'react';
import { createSummary, getSummary, sendFeedback } from '../api/summary';
import { useWeekly } from '../hooks/useWeekly';
import WeekNav from './WeekNav';

const RATINGS = [
  { value: 'helpful', label: 'Helpful' },
  { value: 'incorrect', label: 'Incorrect' },
];

// A source record as a readable label; the link target is the record's row on the same page.
const sourceLabel = (source) => {
  if (source.type === 'task') {
    const title = source.title ?? `Task ${source.id}`;
    return source.dueDate ? `${title}, due ${source.dueDate}` : title;
  }
  return source.title ?? `Entry ${source.id}`;
};
const sourceHref = (source) => `#${source.type}-${source.id}`;

// US-M8-01 to US-M8-04: the AI summary of the week for the reader. It is always labelled
// "AI-generated", shown as a suggestion, lists the records it is based on and can be rated.
export default function SummaryCard({ childId }) {
  const { data, setData, error, prev, next } = useWeekly(getSummary, childId);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState('');

  const summary = data?.summary;

  const generate = async () => {
    setActionError('');
    setGenerating(true);
    try {
      const result = await createSummary(childId, data.weekStart);
      setData((d) => ({ ...d, summary: result.summary }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const rate = async (rating) => {
    setActionError('');
    try {
      await sendFeedback(summary.id, rating);
      setData((d) => ({ ...d, summary: { ...d.summary, myFeedback: rating } }));
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <WeekNav weekStart={data?.weekStart} weekEnd={data?.weekEnd} onPrev={prev} onNext={next} />

      {(error || actionError) && <p role="alert" className="text-sm text-red-600">{error || actionError}</p>}

      {data && !summary && <p className="text-sm text-slate-500">No summary for this week yet.</p>}

      {summary && (
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">AI-generated</span>
            {summary.provider === 'mock' && <span className="text-xs text-slate-500">Sample answer (mock mode)</span>}
          </div>
          <p className="whitespace-pre-line">{summary.text}</p>
          <p className="text-xs text-slate-500">This is a suggestion, not a decision. Please check it against the records.</p>

          <div>
            <p className="font-semibold">Based on:</p>
            {summary.sources.length === 0 ? (
              <p className="text-slate-500">No records were available for this week.</p>
            ) : (
              <ul className="list-disc pl-5">
                {summary.sources.map((source) => (
                  <li key={`${source.type}-${source.id}`}>
                    <a href={sourceHref(source)} className="text-blue-700 underline">{sourceLabel(source)}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600">Was this summary useful?</span>
            {RATINGS.map(({ value, label }) => (
              <button key={value} type="button" aria-pressed={summary.myFeedback === value} onClick={() => rate(value)}
                className="rounded-md bg-slate-200 px-3 py-1 hover:bg-slate-300 aria-pressed:bg-blue-600 aria-pressed:text-white">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={generate} disabled={!data || generating}
        className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-60">
        {generating ? 'Generating…' : summary ? 'Generate again' : 'Generate summary'}
      </button>
    </div>
  );
}
