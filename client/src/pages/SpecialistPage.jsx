import AppLayout, { Section } from '../components/AppLayout';

export default function SpecialistPage() {
  return (
    <AppLayout title="Specialist dashboard">
      <Section title="Linked children" />
      <Section title="Assigned tasks" />
      <Section title="Entries" />
      <Section title="Documents" />
    </AppLayout>
  );
}