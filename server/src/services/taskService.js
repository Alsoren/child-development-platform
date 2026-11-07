const tasksRepository = require('../repositories/tasksRepository');
// TODO: replace these access checks with the shared requireChildAccess middleware once M2 provides it.
const { isParentOf, isLinkedSpecialist, isChildAccountOf } = require('../repositories/eventsRepository');
const { parseDate, weekRange } = require('../utils/dates');
const HttpError = require('../utils/httpError');

const DEVELOPMENT_AREAS = ['Language', 'Motor', 'Social', 'Cognitive', 'Emotional'];

// The parent of the child and a specialist currently linked to the child. With allowChild,
// also the child's own account. "No such child" and "not your child" give the same answer.
function hasAccess(user, childId, { allowChild = false } = {}) {
  if (!Number.isInteger(childId)) return false;
  if (user.role === 'parent') return isParentOf(user.id, childId);
  if (user.role === 'specialist') return isLinkedSpecialist(user.id, childId);
  if (user.role === 'child') return allowChild && isChildAccountOf(user.id, childId);
  return false;
}

const toTask = (row) => ({
  id: row.id,
  childId: row.child_id,
  assignedBy: row.assigned_by,
  title: row.title,
  description: row.description,
  developmentArea: row.development_area,
  dueDate: row.due_date,
  status: row.status,
  completedAt: row.completed_at,
});

// US-M4-01: the parent or a linked specialist assigns a task. A child account never does.
function createTask(user, childIdParam, body) {
  if (!user) throw new HttpError(401, 'Authentication required.');

  const childId = Number(childIdParam);
  if (!hasAccess(user, childId)) {
    throw new HttpError(403, 'You are not allowed to assign tasks to this child.');
  }

  const { title, description, developmentArea, dueDate } = body || {};

  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (!cleanTitle) throw new HttpError(400, 'Title is required.');

  if (!DEVELOPMENT_AREAS.includes(developmentArea)) {
    throw new HttpError(400, `Development area must be one of: ${DEVELOPMENT_AREAS.join(', ')}.`);
  }

  if (!parseDate(dueDate)) throw new HttpError(400, 'Due date must be a valid date (YYYY-MM-DD).');

  let cleanDescription = null;
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') throw new HttpError(400, 'Description must be text.');
    cleanDescription = description.trim() || null;
  }

  const row = tasksRepository.insert({
    childId,
    assignedBy: user.id,
    title: cleanTitle,
    description: cleanDescription,
    developmentArea,
    dueDate,
  });
  return toTask(row);
}

// US-M4-02 and US-M4-03: the tasks of the week that contains `week` (any date in it, default: this week),
// ordered by due date. The child's own account sees its own tasks; the parent and linked specialists
// see the same list with the status, so an assigner can follow up.
function listWeek(user, childIdParam, week) {
  if (!user) throw new HttpError(401, 'Authentication required.');

  const childId = Number(childIdParam);
  if (!hasAccess(user, childId, { allowChild: true })) {
    throw new HttpError(403, "You are not allowed to access this child's tasks.");
  }

  const range = weekRange(week);
  if (!range) throw new HttpError(400, 'Week must be a date (YYYY-MM-DD).');

  const rows = tasksRepository.findDueInRange(childId, range.weekStart, range.nextWeekStart);
  return { weekStart: range.weekStart, weekEnd: range.weekEnd, tasks: rows.map(toTask) };
}

// US-M4-02: only the child's own account marks a task as done. Doing it twice changes nothing.
// A task that belongs to another child is "not found", so task ids cannot be probed.
function completeTask(user, childIdParam, taskIdParam) {
  if (!user) throw new HttpError(401, 'Authentication required.');

  const childId = Number(childIdParam);
  const isOwnChild = user.role === 'child' && Number.isInteger(childId) && isChildAccountOf(user.id, childId);
  if (!isOwnChild) throw new HttpError(403, 'Only the child can mark a task as done.');

  const taskId = Number(taskIdParam);
  const task = Number.isInteger(taskId) ? tasksRepository.findById(taskId) : undefined;
  if (!task || task.child_id !== childId) throw new HttpError(404, 'Task not found.');

  return toTask(task.status === 'done' ? task : tasksRepository.markDone(taskId));
}

module.exports = { createTask, listWeek, completeTask, DEVELOPMENT_AREAS };
