const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const skeletonRoutes = require('./routes/skeletonRoutes');


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
// Needs req.user ({ id, role }) from the authenticate middleware (SCRUM-41).
// Until that exists, every request gets 401, so the route is closed by default.
app.use('/api/children', eventRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

app.use('/api', skeletonRoutes);
module.exports = app;
