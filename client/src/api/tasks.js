import { apiFetch } from './client';

export const DEVELOPMENT_AREAS = ['Language', 'Motor', 'Social', 'Cognitive', 'Emotional'];

export const getWeekTasks = (childId, week) => apiFetch(`/children/${childId}/tasks?week=${week}`);

export const addTask = (childId, task) =>
  apiFetch(`/children/${childId}/tasks`, { method: 'POST', body: task });

export const completeTask = (childId, taskId) =>
  apiFetch(`/children/${childId}/tasks/${taskId}/complete`, { method: 'POST' });
