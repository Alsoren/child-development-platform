import AppLayout, { Section } from '../components/AppLayout';
import LinkedChildren from '../components/LinkedChildren';
import SummaryCard from '../components/SummaryCard';
import TaskBoard from '../components/TaskBoard';
import WeeklySchedule from '../components/WeeklySchedule';
import { useChildren } from '../hooks/useChildren';

export default function SpecialistPage() {
  const { children, childId, setChildId, error, loaded } = useChildren();

  return (
    <AppLayout title="Specialist dashboard">
      {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}

      <Section title="Linked children">
        {loaded && !error && <LinkedChildren items={children} selectedId={childId} onSelect={setChildId} />}
      </Section>
      <Section title="Weekly schedule">
        {childId && <WeeklySchedule key={childId} childId={childId} />}
      </Section>
      <Section title="Assigned tasks">
        {childId && <TaskBoard key={childId} childId={childId} />}
      </Section>
      <Section title="Entries" />
      <Section title="AI summary">
        {childId && <SummaryCard key={childId} childId={childId} />}
      </Section>
      <Section title="Documents" />
    </AppLayout>
  );
}
