const express = require('express');
const path = require('path');
const sse = require('./sse');
const watcher = require('./watcher');
const scenarios = require('./scenarios');
const { analyze } = require('./analyzer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
let WATCH_DIR = path.resolve(process.env.WATCH_DIR || '.');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory trace history
const eventHistory = [];

// Helper to record and broadcast event
function recordEvent(event) {
  eventHistory.unshift(event);
  if (eventHistory.length > 100) eventHistory.pop();
  sse.broadcast({ type: 'change', event });
  return event;
}

// SSE Telemetry Stream Endpoint
app.get('/api/events', (req, res) => {
  sse.subscribe(req, res);
  if (eventHistory.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'history', events: eventHistory })}\n\n`);
  }
});

// System Status Endpoint
app.get('/api/status', (req, res) => {
  const model = (process.env.OPENROUTER_API_MODEL || 'thinkingmachines/inkling-small:free').trim();
  res.json({
    status: 'active',
    watchDir: WATCH_DIR,
    eventsCount: eventHistory.length,
    openRouterConfigured: Boolean((process.env.OPENROUTER_API_KEY || '').trim()),
    model
  });
});

// Endpoint to change watched directory dynamically
app.post('/api/watch', (req, res) => {
  const newDir = req.body.directory;
  if (!newDir) return res.status(400).json({ error: 'Directory path is required' });

  try {
    WATCH_DIR = path.resolve(newDir);
    watcher.start(WATCH_DIR, recordEvent);
    res.json({ success: true, watchDir: WATCH_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to register the prompt intent
app.post('/api/prompt', (req, res) => {
  const prompt = req.body.prompt || '';
  watcher.setPromptIntent(prompt);
  res.json({ success: true, prompt });
});

// Endpoint to force immediate rescan of git diffs
app.post('/api/rescan', async (req, res) => {
  try {
    await watcher.processBatch();
    res.json({ success: true, message: 'Rescan completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const analysis = await analyze(req.body);
    const event = {
      id: `tr_${Date.now().toString(36)}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'manual-analysis',
      ...analysis
    };
    recordEvent(event);
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount scenarios
app.use('/api/scenarios', scenarios.router);

// Start watcher on startup
watcher.start(WATCH_DIR, recordEvent);

// Start listening
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  VibeTrace Observability Server Online`);
    console.log(`  Dashboard URL:  http://localhost:${PORT}`);
    console.log(`  Live Watching:  ${WATCH_DIR}`);
    console.log(`=================================================\n`);
  });
}

module.exports = { app, recordEvent, eventHistory, WATCH_DIR };
