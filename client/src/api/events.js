import { apiFetch } from './client';

export const getWeekEvents = (childId, week) => apiFetch(`/children/${childId}/events?week=${week}`);

export const getUpcomingEvents = (childId) => apiFetch(`/children/${childId}/events/upcoming`);

export const addEvent = (childId, event) =>
  apiFetch(`/children/${childId}/events`, { method: 'POST', body: event });
