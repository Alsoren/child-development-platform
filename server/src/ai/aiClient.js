const geminiProvider = require('./geminiProvider');
const mockProvider = require('./mockProvider');
const { unavailable } = require('./errors');

const providers = { mock: mockProvider, gemini: geminiProvider };

// AI_PROVIDER selects the provider (read on every call). Without it the mock is used, so a missing
// setting never calls an external service.
const providerName = () => (process.env.AI_PROVIDER || 'mock').trim().toLowerCase();

// `prompt` comes from buildPrompt; only its text goes to the provider, never the source list.
async function generateSummary(prompt) {
  const name = providerName();
  const provider = providers[name];
  if (!provider) {
    console.error(`Unknown AI_PROVIDER "${name}".`);
    throw unavailable();
  }
  const text = await provider.generate({ system: prompt.system, user: prompt.user });
  return { text, provider: name };
}

module.exports = { generateSummary };
