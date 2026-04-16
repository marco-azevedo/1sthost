const express = require('express');
const sitesRouter = require('./routes/sites');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// TODO: Add request-logging middleware that writes each request
//       (method, path, status, duration) to a daily rotating log file.

// TODO: Add authentication middleware so all /api/* routes require
//       a valid Bearer token before proceeding.

app.use('/api/sites', sitesRouter);

// Health-check endpoint — returns service status and uptime.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// TODO: Add a global error-handler middleware that formats every
//       unhandled error as { error: message } with an appropriate
//       HTTP status code instead of crashing the process.

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`1sthost running on http://localhost:${PORT}`);
  });
}

module.exports = app; // exported for testing
