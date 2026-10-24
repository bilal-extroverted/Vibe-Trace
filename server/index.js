const express = require('express');
const path = require('path');
const sse = require('./sse');
const watcher = require('./watcher');
const { analyze } = require('./analyzer');
const { answerQuestion } = require('./queryEngine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
let WATCH_DIR = path.resolve(process.env.WATCH_DIR || '.');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory trace history
const eventHistory = [];

// Helper to record and broadcast trace
function recordEvent(event) {
  eventHistory.unshift(event);
  if (eventHistory.length > 200) eventHistory.pop();
  sse.broadcast({ type: 'trace', trace: event });
  return event;
}

// SSE Telemetry Stream Endpoint
app.get('/api/events', (req, res) => {
  sse.subscribe(req, res);
  if (eventHistory.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'history', traces: eventHistory })}\n\n`);
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

// Endpoint to force immediate rescan of git diffs
app.post('/api/rescan', async (req, res) => {
  try {
    watcher.lastAnalyzedDiffHash = null;
    await watcher.processBatch();
    res.json({ success: true, message: 'Rescan completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to ask questions about traces and codebase mutations
app.post('/api/query', async (req, res) => {
  const { question, traceId } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const traceContext = eventHistory.find(t => t.id === traceId) || eventHistory[0] || null;
    const result = await answerQuestion({
      question,
      traceContext,
      activeDir: WATCH_DIR
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start watcher on startup
watcher.start(WATCH_DIR, recordEvent);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  VibeTrace AI Observability Online`);
    console.log(`  Web Dashboard:  http://localhost:${PORT}`);
    console.log(`  Live Watching:  ${WATCH_DIR}`);
    console.log(`=================================================\n`);
  });
}

module.exports = { app, recordEvent, eventHistory, WATCH_DIR };
