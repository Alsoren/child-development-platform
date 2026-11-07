const tasksRepository = require('../repositories/tasksRepository');
// TODO: replace these two checks with the shared requireChildAccess middleware once M2 provides it.
const { isParentOf, isLinkedSpecialist } = require('../repositories/eventsRepository');
const { parseDate } = require('../utils/dates');
const HttpError = require('../utils/httpError');

const DEVELOPMENT_AREAS = ['Language', 'Motor', 'Social', 'Cognitive', 'Emotional'];

// Assigning a task: the parent of the child or a specialist currently linked to the child.
// A child account never assigns tasks. "No such child" and "not your child" give the same answer.
function canAssign(user, childId) {
  if (!Number.isInteger(childId)) return false;
  if (user.role === 'parent') return isParentOf(user.id, childId);
  if (user.role === 'specialist') return isLinkedSpecialist(user.id, childId);
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

function createTask(user, childIdParam, body) {
  if (!user) throw new HttpError(401, 'Authentication required.');

  const childId = Number(childIdParam);
  if (!canAssign(user, childId)) {
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

module.exports = { createTask, DEVELOPMENT_AREAS };
