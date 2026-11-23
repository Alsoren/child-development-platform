// US-M2-04: the children linked to the specialist; selecting one opens their schedule and tasks.
export default function LinkedChildren({ items, selectedId, onSelect }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No children are linked to you yet.</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2 text-sm">
      {items.map((c) => (
        <li key={c.id}>
          <button type="button" onClick={() => onSelect(c.id)} aria-pressed={c.id === selectedId}
            className={`w-full text-left p-2 rounded-md border ${
              c.id === selectedId ? 'border-blue-600 bg-blue-50 font-medium' : 'border-slate-300 hover:bg-slate-50'
            }`}>
            {c.name}
          </button>
        </li>
      ))}
    </ul>
  );
}