// Mock provider (US-M8-05): a controlled sample answer, no network call. Used in tests and CI.
const MOCK_SUMMARY =
  'This is a sample summary from the mock AI provider. No external service was called. ' +
  'Set AI_PROVIDER=gemini to get a real summary.';

async function generate() {
  return MOCK_SUMMARY;
}

module.exports = { generate, MOCK_SUMMARY };
