const summariesRepository = require('../repositories/summariesRepository');
const feedbackRepository = require('../repositories/feedbackRepository');
const tasksRepository = require('../repositories/tasksRepository');
const aiClient = require('../ai/aiClient');
const { buildPrompt } = require('../ai/prompts');
const { weekRange } = require('../utils/dates');
const HttpError = require('../utils/httpError');

const invalidWeek = () => new HttpError(400, 'Week must be a date (YYYY-MM-DD).');

const toPromptTask = (row) => ({
  id: row.id,
  title: row.title,
  developmentArea: row.development_area,
  dueDate: row.due_date,
  status: row.status,
});

// `userId` is the caller: myFeedback is their own vote on this summary (or null).
const toSummary = (row, userId) => ({
  id: row.id,
  childId: row.child_id,
  readerRole: row.reader_role,
  weekStart: row.week_start,
  weekEnd: weekRange(row.week_start).weekEnd,
  text: row.text,
  provider: row.provider,
  createdAt: row.created_at,
  sources: summariesRepository.findSources(row.id).map((s) => ({
    type: s.source_type,
    id: s.source_id,
    title: s.title,
    dueDate: s.due_date,
  })),
  myFeedback: feedbackRepository.findRating(row.id, userId),
});

// US-M8-01 and US-M8-02: a summary of the week for the reader's role. The route has already checked
// the role and the current access to the child (requireRole, requireChildAccess); here the records
// are selected BEFORE the prompt is built, so only records the reader may see are sent (NFR-03, NFR-04).
// Parent and specialist may see the same records of a child, so the selection is the same for both.
async function createSummary(user, childId, week) {
  const range = weekRange(week);
  if (!range) throw invalidWeek();

  const tasks = tasksRepository.findDueInRange(childId, range.weekStart, range.nextWeekStart).map(toPromptTask);
  // M5: add the child's entries of the week here, with the same rule.
  const prompt = buildPrompt({
    role: user.role,
    childName: summariesRepository.findChildName(childId),
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    tasks,
  });

  // Nothing is saved if the provider fails (it throws a 502).
  const { text, provider } = await aiClient.generateSummary(prompt);
  const id = summariesRepository.insert({
    childId,
    requestedBy: user.id,
    readerRole: user.role,
    weekStart: range.weekStart,
    text,
    provider,
    sources: prompt.sources,
  });
  return toSummary(summariesRepository.findById(id), user.id);
}

// The latest summary of the week that was written for the caller's role (or null), with the week
// itself, so the screen can show the week even when there is no summary yet.
function getLatest(user, childId, week) {
  const range = weekRange(week);
  if (!range) throw invalidWeek();

  const row = summariesRepository.findLatest(childId, range.weekStart, user.role);
  return { weekStart: range.weekStart, weekEnd: range.weekEnd, summary: row ? toSummary(row, user.id) : null };
}

module.exports = { createSummary, getLatest };
