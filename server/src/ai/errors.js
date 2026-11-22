const HttpError = require('../utils/httpError');

// One message for every AI failure (US-M8-05): never reveals the provider, the key or the cause.
// The cause goes to the server log only.
const unavailable = () => new HttpError(502, 'The AI summary is not available right now. Please try again later.');

module.exports = { unavailable };
