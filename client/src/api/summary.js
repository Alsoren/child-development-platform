import { apiFetch } from './client';

// Newest summary of the week written for the caller's role: { weekStart, weekEnd, summary } (summary may be null).
export const getSummary = (childId, week) => apiFetch(`/children/${childId}/summary?week=${week}`);

// Asks the AI for a new summary of the week: { summary }.
export const createSummary = (childId, week) =>
  apiFetch(`/children/${childId}/summary?week=${week}`, { method: 'POST' });

// rating is 'helpful' or 'incorrect': { feedback: { summaryId, rating } }.
export const sendFeedback = (summaryId, rating) =>
  apiFetch(`/summaries/${summaryId}/feedback`, { method: 'POST', body: { rating } });
