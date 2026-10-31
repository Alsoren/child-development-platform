const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const skeletonRoutes = require('./routes/skeletonRoutes');


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

app.use('/api', skeletonRoutes);
module.exports = app;
