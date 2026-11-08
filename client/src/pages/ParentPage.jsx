import { useEffect, useState } from 'react';
import AppLayout, { Section } from '../components/AppLayout';
import LinkedSpecialists from '../components/LinkedSpecialists';
import { getChildren } from '../api/links';

export default function ParentPage() {
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getChildren()
      .then((data) => {
        setChildren(data.children);
        if (data.children.length > 0) setChildId(data.children[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppLayout title="Parent dashboard">
      {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}

      {children.length > 1 && (
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          Child
          <select value={childId ?? ''} onChange={(e) => setChildId(Number(e.target.value))}
            className="p-1.5 border border-slate-300 rounded-md bg-white">
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}

      <Section title="Weekly schedule" />
      <Section title="Tasks" />
      <Section title="Linked specialists">
        {childId && <LinkedSpecialists key={childId} childId={childId} />}
      </Section>
      <Section title="Specialist entries" />
      <Section title="Documents" />
      <Section title="Weekly statistics" />
    </AppLayout>
  );
}