const express = require('express');
const path = require('path');
const fs = require('fs');
const sse = require('./sse');
const watcher = require('./watcher');
const db = require('./db');
const protocol = require('./harness/protocol');
const { analyze } = require('./analyzer');
const { answerQuestion } = require('./queryEngine');
const { generateAiMindMap } = require('./mindMapEngine');
const { analyzeDrift } = require('./driftAnalyzer');
const featureTimelineEngine = require('./featureTimelineEngine');
const gitService = require('./gitService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
let WATCH_DIR = path.resolve(process.env.WATCH_DIR || '.');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Register initial project in SQLite, ensure Git repo, default .gitignore, and vibetrace.md exist
db.upsertProject(WATCH_DIR);
protocol.ensureExists(WATCH_DIR);
gitService.ensureRepoAndGitignore(WATCH_DIR);

// Initialize features evolution table in SQLite from existing historical traces
try {
  featureTimelineEngine.ensureFeaturesEvolutionInitialized(WATCH_DIR);
} catch (e) {
  console.warn('[Features Evolution Init]', e.message);
}

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

  // If there is an active in-progress trace, verify protocol status before pushing
  if (watcher.activeTrace) {
    const isProtoActive = Boolean(proto && (proto.status === 'in_progress' || proto.status === 'working' || proto.status === 'started' || proto.status === 'editing'));
    if (!isProtoActive) {
      watcher.activeTrace = null;
    } else {
      res.write(`data: ${JSON.stringify({ type: 'trace_active', trace: watcher.activeTrace })}\n\n`);
    }
  }

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
    const isProtoActive = Boolean(proto && (proto.status === 'in_progress' || proto.status === 'working' || proto.status === 'started' || proto.status === 'editing'));
    if (!isProtoActive) {
      watcher.activeTrace = null;
    }
    res.json({ protocol: proto, activeTrace: watcher.activeTrace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status Endpoint
app.get('/api/status', (req, res) => {
  const model = (process.env.OPENROUTER_API_MODEL || '').trim();
  const traces = db.getTraces(WATCH_DIR, 100);
  const projects = db.getProjects();
  const projectName = path.basename(WATCH_DIR) || 'workspace';
  const proto = protocol.read(WATCH_DIR);
  const isProtoActive = Boolean(proto && (proto.status === 'in_progress' || proto.status === 'working' || proto.status === 'started' || proto.status === 'editing'));
  if (!isProtoActive) {
    watcher.activeTrace = null;
  }

  res.json({
    status: 'active',
    projectName,
    watchDir: WATCH_DIR,
    eventsCount: traces.length,
    projectsCount: projects.length,
    openRouterConfigured: Boolean((process.env.OPENROUTER_API_KEY || '').trim() && model),
    model,
    activeTrace: watcher.activeTrace,
    activeFile: watcher.activeTrace ? watcher.activeTrace.activeFile : (proto.active_file || null)
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
    let traces = db.getTraces(folder, 50);

    // Prepend active trace if currently running and valid
    if (watcher.activeTrace && (!req.query.dir || folder === WATCH_DIR)) {
      const proto = protocol.read(folder);
      const isProtoActive = Boolean(proto && (proto.status === 'in_progress' || proto.status === 'working' || proto.status === 'started' || proto.status === 'editing'));
      if (!isProtoActive) {
        // Protocol is completed/idle - invalidate zombie activeTrace immediately
        watcher.activeTrace = null;
      } else {
        // Deduplicate against active trace id
        traces = traces.filter(t => t.id !== watcher.activeTrace.id);
        traces = [watcher.activeTrace, ...traces];
      }
    }
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

// Endpoint to get Features Over Time evolution graph & timeline
app.get('/api/features-over-time', (req, res) => {
  try {
    const folder = req.query.dir ? path.resolve(req.query.dir) : WATCH_DIR;
    const forceRefresh = req.query.refresh === '1' || req.query.recompute === '1';
    if (forceRefresh) {
      featureTimelineEngine.ensureFeaturesEvolutionInitialized(folder);
    }
    const payload = featureTimelineEngine.getFeaturesEvolutionPayload(folder);
    res.json(payload);
  } catch (err) {
    console.error('[API /api/features-over-time Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Backward-compatible alias for mindmap endpoint -> returns Features Over Time payload
app.all('/api/mindmap', (req, res) => {
  try {
    const folder = req.query.dir ? path.resolve(req.query.dir) : WATCH_DIR;
    const forceRefresh = req.query.refresh === '1' || req.query.recompute === '1';
    if (forceRefresh) {
      featureTimelineEngine.ensureFeaturesEvolutionInitialized(folder);
    }
    const payload = featureTimelineEngine.getFeaturesEvolutionPayload(folder);
    res.json(payload);
  } catch (err) {
    console.error('[API /api/mindmap Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to independently analyze prompt-to-output drift and risk via OpenRouter
app.post('/api/analyze-drift', async (req, res) => {
  try {
    const { traceId, prompt } = req.body || {};
    let trace = null;
    if (traceId) {
      if (watcher.activeTrace && watcher.activeTrace.id === traceId) {
        trace = watcher.activeTrace;
      } else {
        trace = db.getTraceById(traceId);
      }
    }
    if (!trace) {
      if (watcher.activeTrace) {
        trace = watcher.activeTrace;
      } else {
        const traces = db.getTraces(WATCH_DIR, 1);
        trace = traces[0] || null;
      }
    }

    if (!trace) {
      return res.status(404).json({ error: 'No trace found to analyze drift' });
    }

    const proto = protocol.read(WATCH_DIR);
    const promptToUse = prompt || trace.agentProtocol?.task || proto.task || proto.intent || trace.title;
    const diffs = trace.diffs || [];

    const driftAnalysis = await analyzeDrift({
      prompt: promptToUse,
      diffs,
      agentProtocol: trace.agentProtocol || proto,
      gitContext: trace.git || {}
    });

    // Update trace in memory and DB
    trace.driftAnalysis = driftAnalysis;
    if (trace.id && trace.id !== 'trace-live-active') {
      db.updateTraceDrift(trace.id, driftAnalysis);
    }

    // Broadcast live update if active
    sse.broadcast({
      type: 'drift_update',
      traceId: trace.id,
      driftAnalysis
    });

    sse.broadcast({
      type: 'log',
      category: 'drift',
      level: 'info',
      message: `Drift Guard re-audited trace: Score ${driftAnalysis.alignmentScore}%, Risk: ${driftAnalysis.riskLevel}`
    });

    res.json({ success: true, traceId: trace.id, driftAnalysis });
  } catch (err) {
    console.error('[API /api/analyze-drift] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: User enters a prompt to agent -> trace is created immediately
app.post('/api/prompt', (req, res) => {
  try {
    const { prompt: userPrompt } = req.body || {};
    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = userPrompt.trim();
    const nowIso = new Date().toISOString();

    // 1. Update vibetrace.md file to reflect new prompt & active task
    const vibetraceContent = `---
status: in_progress
task: "${cleanPrompt.replace(/"/g, '\\"')}"
agent: "Antigravity AI"
active_file: "vibetrace.md"
file_action: "Executing prompt: ${cleanPrompt.replace(/"/g, '\\"')}"
file_summary: "Task created from user prompt"
started_at: "${nowIso}"
updated_at: "${nowIso}"
---

# VibeTrace Agent-Harness Communication Protocol

## Current Task Intent
> ${cleanPrompt}

## Execution Plan & Steps
- [ ] Step 1: Execute prompt instructions
- [ ] Step 2: Validate code modifications
- [ ] Step 3: Run harness verification

## Inter-Agent & Harness Communication Notes
- Real-time trace active on dashboard
`;

    const vibetracePath = path.join(WATCH_DIR, 'vibetrace.md');
    fs.writeFileSync(vibetracePath, vibetraceContent, 'utf8');

    // 2. Read protocol and immediately create active trace in watcher
    const proto = protocol.read(WATCH_DIR);
    const trace = watcher.ensureActiveTrace(proto, 'vibetrace.md', false);
    trace.substatus = 'working';
    trace.changing = false;
    trace.status = 'in_progress';
    trace.inProgress = true;

    // 3. Broadcast real-time updates via SSE
    sse.broadcast({
      type: 'protocol_update',
      protocol: proto
    });

    sse.broadcast({
      type: 'trace_active',
      trace
    });

    sse.broadcast({
      type: 'agent_status',
      status: 'working',
      substatus: 'working',
      task: cleanPrompt,
      active_file: 'vibetrace.md',
      file_action: 'Task initiated from user prompt',
      message: `Prompt accepted: ${cleanPrompt}`
    });

    sse.broadcast({
      type: 'log',
      category: 'prompt',
      level: 'working',
      message: `Prompt accepted: "${cleanPrompt}" -> Active task created`
    });

    res.json({
      success: true,
      message: 'Trace created from prompt',
      trace,
      protocol: proto
    });
  } catch (err) {
    console.error('[API /api/prompt] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Global process resilience handlers
process.on('uncaughtException', (err) => {
  console.error('[VibeTrace Server UncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[VibeTrace Server UnhandledRejection]', reason);
});

// Start watcher on startup
watcher.start(WATCH_DIR, recordEvent);

// Keep event loop active
if (process.stdin.isTTY === false) {
  try {
    process.stdin.resume();
  } catch (e) {}
}

// Start server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  VibeTrace AI Observability Online`);
    console.log(`  Web Dashboard:  http://localhost:${PORT}`);
    console.log(`  Live Watching:  ${WATCH_DIR}`);
    console.log(`  Persistent DB:  ${path.resolve(__dirname, '../vibetrace.db')}`);
    console.log(`=================================================\n`);
  });

  server.on('error', (err) => {
    console.error('[VibeTrace Server Listen Error]', err);
  });
}

module.exports = { app, recordEvent, WATCH_DIR };
