import { apiFetch } from './client';

export const SPECIALIST_TYPES = ['teacher', 'psychologist', 'doctor', 'special education teacher', 'coach'];

export const getChildren = () => apiFetch('/children');

export const getLinkedSpecialists = (childId) => apiFetch(`/children/${childId}/specialists`);

export const linkSpecialist = (childId, email, type) =>
  apiFetch(`/children/${childId}/specialists`, { method: 'POST', body: { email, type } });