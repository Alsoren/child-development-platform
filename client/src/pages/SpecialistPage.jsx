import AppLayout, { Section } from '../components/AppLayout';
import TaskBoard from '../components/TaskBoard';
import WeeklySchedule from '../components/WeeklySchedule';
import { useChildren } from '../hooks/useChildren';

export default function SpecialistPage() {
  const { children, childId, setChildId, error } = useChildren();

  return (
    <AppLayout title="Specialist dashboard">
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

      <Section title="Linked children" />
      <Section title="Weekly schedule">
        {childId && <WeeklySchedule key={childId} childId={childId} />}
      </Section>
      <Section title="Assigned tasks">
        {childId && <TaskBoard key={childId} childId={childId} />}
      </Section>
      <Section title="Entries" />
      <Section title="Documents" />
    </AppLayout>
  );
}
