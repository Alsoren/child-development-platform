const { unavailable } = require('./errors');

const DEFAULT_MODEL = 'gemini-3.7-flash';
const TIMEOUT_MS = 20000;

// The only place that reads AI_API_KEY (US-M8-06). The key is sent in a header and is never
// logged, returned or put in an error message.
async function generate({ system, user }) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.error('AI_PROVIDER=gemini but AI_API_KEY is not set.');
    throw unavailable();
  }
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
  } catch (err) {
    console.error(`Gemini request failed: ${err.name}`);
    throw unavailable();
  }

  if (!res.ok) {
    console.error(`Gemini request failed with status ${res.status}`);
    throw unavailable();
  }

  let data;
  try {
    data = await res.json();
  } catch {
    console.error('Gemini response was not valid JSON.');
    throw unavailable();
  }

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';
  if (!text) {
    console.error('Gemini returned no text.');
    throw unavailable();
  }
  return text;
}

module.exports = { generate, DEFAULT_MODEL };
