const express = require('express');
const path = require('path');
const sse = require('./sse');
const watcher = require('./watcher');
const db = require('./db');
const protocol = require('./harness/protocol');
const { analyze } = require('./analyzer');
const { answerQuestion } = require('./queryEngine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
let WATCH_DIR = path.resolve(process.env.WATCH_DIR || '.');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Register initial project in SQLite and ensure vibetrace.md exists
db.upsertProject(WATCH_DIR);
protocol.ensureExists(WATCH_DIR);

// Helper to record and broadcast trace
function recordEvent(event) {
  db.saveTrace(event, WATCH_DIR);
  sse.broadcast({ type: 'trace', trace: event });
  return event;
}

// SSE Telemetry Stream Endpoint
app.get('/api/events', (req, res) => {
  sse.subscribe(req, res);

  // Send current vibetrace.md protocol state
  const proto = protocol.read(WATCH_DIR);
  res.write(`data: ${JSON.stringify({ type: 'protocol_update', protocol: proto })}\n\n`);

  // Send persistent historical traces from SQLite
  const traces = db.getTraces(WATCH_DIR, 50);
  if (traces.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'history', traces })}\n\n`);
  }
});

// Endpoint to get current vibetrace.md protocol state
app.get('/api/protocol', (req, res) => {
  try {
    const proto = protocol.read(WATCH_DIR);
    res.json({ protocol: proto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status Endpoint
app.get('/api/status', (req, res) => {
  const model = (process.env.OPENROUTER_API_MODEL || 'thinkingmachines/inkling-small:free').trim();
  const traces = db.getTraces(WATCH_DIR, 100);
  const projects = db.getProjects();
  const projectName = path.basename(WATCH_DIR) || 'workspace';

  res.json({
    status: 'active',
    projectName,
    watchDir: WATCH_DIR,
    eventsCount: traces.length,
    projectsCount: projects.length,
    openRouterConfigured: Boolean((process.env.OPENROUTER_API_KEY || '').trim()),
    model
  });
});

// Get all observed projects from database
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.getProjects();
    res.json({ projects, activePath: WATCH_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get historical traces for a project
app.get('/api/traces', (req, res) => {
  try {
    const folder = req.query.dir ? path.resolve(req.query.dir) : WATCH_DIR;
    const traces = db.getTraces(folder, 50);
    res.json({ traces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single trace by ID
app.get('/api/traces/:id', (req, res) => {
  try {
    const trace = db.getTraceById(req.params.id);
    if (!trace) return res.status(404).json({ error: 'Trace not found' });
    res.json({ trace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to change watched directory dynamically
app.post('/api/watch', (req, res) => {
  const newDir = req.body.directory;
  if (!newDir) return res.status(400).json({ error: 'Directory path is required' });

  try {
    WATCH_DIR = path.resolve(newDir);
    db.upsertProject(WATCH_DIR);
    watcher.start(WATCH_DIR, recordEvent);
    const traces = db.getTraces(WATCH_DIR, 50);
    res.json({
      success: true,
      watchDir: WATCH_DIR,
      projectName: path.basename(WATCH_DIR),
      traces
    });
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
    let traceContext = null;
    if (traceId) {
      traceContext = db.getTraceById(traceId);
    }
    if (!traceContext) {
      const recent = db.getTraces(WATCH_DIR, 1);
      traceContext = recent[0] || null;
    }

    const result = await answerQuestion({
      question,
      traceContext,
      activeDir: WATCH_DIR
    });

    // Save query to SQLite
    db.saveQuery({
      traceId: traceContext?.id,
      question,
      answer: result.answer,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs
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
    console.log(`  Persistent DB:  ${path.resolve(__dirname, '../vibetrace.db')}`);
    console.log(`=================================================\n`);
  });
}

module.exports = { app, recordEvent, WATCH_DIR };
