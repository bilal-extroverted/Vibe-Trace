const express = require('express');
const path = require('path');
const sse = require('./sse');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WATCH_DIR = path.resolve(process.env.WATCH_DIR || '.');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory trace history
const eventHistory = [];

// SSE Telemetry Stream Endpoint
app.get('/api/events', (req, res) => {
  sse.subscribe(req, res);
  // Send existing history to newly connected client
  if (eventHistory.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'history', events: eventHistory })}\n\n`);
  }
});

// Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'watching',
    watchDir: WATCH_DIR,
    eventsCount: eventHistory.length,
    openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY)
  });
});

// Helper to record and broadcast event
function recordEvent(event) {
  eventHistory.unshift(event);
  if (eventHistory.length > 50) eventHistory.pop();
  sse.broadcast({ type: 'change', event });
  return event;
}

// Export app and recorder for integration with watcher and scenarios
module.exports = { app, recordEvent, eventHistory, WATCH_DIR };

// If run directly, start server
if (require.main === module) {
  // Try loading watcher and scenarios if present
  try {
    const watcher = require('./watcher');
    watcher.start(WATCH_DIR, recordEvent);
  } catch (err) {
    console.log('[VibeTrace] Watcher module initializing in next slice.');
  }

  try {
    const scenarios = require('./scenarios');
    app.use('/api/scenarios', scenarios.router);
  } catch (err) {
    console.log('[VibeTrace] Scenarios module initializing in next slice.');
  }

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  VibeTrace Observability Dashboard running!`);
    console.log(`  Local URL:  http://localhost:${PORT}`);
    console.log(`  Watching:   ${WATCH_DIR}`);
    console.log(`=================================================\n`);
  });
}
