const buttonClass = 'rounded-md bg-slate-200 px-3 py-1 hover:bg-slate-300';

export default function WeekNav({ weekStart, weekEnd, onPrev, onNext }) {
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <button type="button" onClick={onPrev} className={buttonClass}>Previous week</button>
      <span className="font-medium">{weekStart ? `${weekStart} to ${weekEnd}` : ''}</span>
      <button type="button" onClick={onNext} className={buttonClass}>Next week</button>
    </div>
  );
}
