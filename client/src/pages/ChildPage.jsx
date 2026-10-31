import AppLayout, { Section } from '../components/AppLayout';

export default function ChildPage() {
  return (
    <AppLayout title="My tasks">
      <Section title="My tasks" />
      <Section title="Upcoming events" />
    </AppLayout>
  );
}