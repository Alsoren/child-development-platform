import AppLayout, { Section } from '../components/AppLayout';

export default function ParentPage() {
  return (
    <AppLayout title="Parent dashboard">
      <Section title="Weekly schedule" />
      <Section title="Tasks" />
      <Section title="Linked specialists" />
      <Section title="Specialist entries" />
      <Section title="Documents" />
      <Section title="Weekly statistics" />
    </AppLayout>
  );
}