import AppLayout, { Section } from '../components/AppLayout';
import MyTasks from '../components/MyTasks';
import UpcomingEvents from '../components/UpcomingEvents';
import { useChildren } from '../hooks/useChildren';

export default function ChildPage() {
  const { childId, error } = useChildren();

  return (
    <AppLayout title="My tasks">
      {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}

      <Section title="My tasks">
        {childId && <MyTasks key={childId} childId={childId} />}
      </Section>
      <Section title="Upcoming events">
        {childId && <UpcomingEvents key={childId} childId={childId} />}
      </Section>
    </AppLayout>
  );
}
