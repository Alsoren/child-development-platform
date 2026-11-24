const summariesRepository = require('../repositories/summariesRepository');
const feedbackRepository = require('../repositories/feedbackRepository');
const linksRepository = require('../repositories/linksRepository');
const HttpError = require('../utils/httpError');

const RATINGS = ['helpful', 'incorrect'];

const notFound = () => new HttpError(404, 'Summary not found.');

// The caller must be the parent of the summary's child, or a specialist linked to it RIGHT NOW,
// and the summary must have been written for the caller's own role. A child account never matches.
const mayRate = (user, summary) => {
  if (summary.reader_role !== user.role) return false;
  if (user.role === 'parent') return linksRepository.isParentOf(user.id, summary.child_id);
  if (user.role === 'specialist') return linksRepository.isLinkedSpecialist(user.id, summary.child_id);
  return false;
};

// US-M8-03: "helpful" or "incorrect". An unknown summary and a summary the caller may not rate give
// the same 404, so summary ids cannot be probed.
function rate(user, summaryId, rating) {
  const summary = Number.isInteger(summaryId) ? summariesRepository.findById(summaryId) : undefined;
  if (!summary || !mayRate(user, summary)) throw notFound();
  if (!RATINGS.includes(rating)) throw new HttpError(400, 'Rating must be "helpful" or "incorrect".');

  feedbackRepository.upsert(summary.id, user.id, rating);
  return { summaryId: summary.id, rating };
}

module.exports = { rate };
