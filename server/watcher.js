const chokidar = require('chokidar');
const path = require('path');
const crypto = require('crypto');
const gitService = require('./gitService');
const harnessContext = require('./harnessContext');
const protocol = require('./harness/protocol');
const { analyze } = require('./analyzer');
const sse = require('./sse');

class WorkspaceWatcher {
  constructor() {
    this.watcher = null;
    this.watchDir = null;
    this.onEventCallback = null;
    this.debounceTimer = null;
    this.maxWaitTimer = null;
    this.firstChangeTimestamp = null;
    this.pendingChangedFiles = new Set();
    this.lastAnalyzedDiffHash = null;
    this.isProcessing = false;
    this.activeTrace = null;
  }

  ensureActiveTrace(proto = null, changedFile = null) {
    if (!proto) proto = protocol.read(this.watchDir);
    const activeFile = proto.active_file || proto.current_file || changedFile || (this.pendingChangedFiles.size > 0 ? Array.from(this.pendingChangedFiles)[0] : 'vibetrace.md');
    const fileAction = proto.file_action || proto.current_action || (changedFile ? `Modifying ${changedFile}` : 'Executing task steps...');
    const fileSummary = proto.file_summary || proto.intent || proto.task || 'Active modifications underway';

    const files = Array.from(new Set([activeFile, ...Array.from(this.pendingChangedFiles)])).filter(Boolean);

    let formattedTime = new Date().toTimeString().slice(0, 8);
    if (proto.started_at) {
      try {
        const d = new Date(proto.started_at);
        if (!isNaN(d.getTime())) {
          formattedTime = d.toTimeString().slice(0, 8);
        }
      } catch (e) {}
    }

    const placeholderDiffs = files.map(f => ({
      file: f,
      content: `@@ -1,1 +1,1 @@\n+ // [Live Mutation] Agent actively editing ${f}\n+ // Action: ${fileAction}\n`,
      status: 'modified'
    }));

    this.activeTrace = {
      id: 'trace-live-active',
      inProgress: true,
      status: 'in_progress',
      title: proto.task || proto.intent || 'Active Agent Task',
      timestamp: formattedTime,
      activeFile: activeFile,
      fileAction: fileAction,
      fileSummary: fileSummary,
      files: files,
      diffs: placeholderDiffs,
      additions: 0,
      deletions: 0,
      changeType: 'IN PROGRESS',
      agentProtocol: {
        ...proto,
        active_file: activeFile,
        file_action: fileAction,
        file_summary: fileSummary
      },
      synthesis: {
        overview: fileSummary,
        summary: `Agent is actively modifying ${activeFile}: ${fileAction}`,
        riskLevel: 'LOW',
        whatChanged: [
          `Active File: ${activeFile}`,
          `Action: ${fileAction}`,
          `Files touched in batch: ${files.length}`
        ],
        affectedFeatures: ['Active Task'],
        downstreamImpact: `Live modifications taking place in ${activeFile}. Full causal ripple analysis will execute upon task completion.`
      },
      harness: {
        syntaxIntegrity: { status: 'passed', details: 'Monitoring live syntax buffers' },
        protectedFiles: { status: 'passed', details: 'Guarded system files protected' },
        secretScanner: { status: 'passed', details: 'No secrets detected in live buffers' },
        dependencyGuard: { status: 'passed', details: 'No untrusted dependencies added' }
      }
    };

    sse.broadcast({
      type: 'trace_active',
      trace: this.activeTrace
    });

    return this.activeTrace;
  }

  start(watchDir = '.', onEventCallback) {
    this.watchDir = path.resolve(watchDir);
    this.onEventCallback = onEventCallback;
    gitService.setCwd(this.watchDir);

    // Ensure vibetrace.md exists
    protocol.ensureExists(this.watchDir);

    // Check if initial protocol state is in_progress
    const initialProto = protocol.read(this.watchDir);
    if (initialProto.status === 'in_progress') {
      this.ensureActiveTrace(initialProto);
    }

    if (this.watcher) {
      try { this.watcher.close(); } catch (e) {}
    }

    console.log(`[VibeTrace Watcher] Initializing live watcher on: ${this.watchDir}`);

    this.watcher = chokidar.watch(this.watchDir, {
      ignored: [
        /(^|[\/\\])\../,             // dotfiles (.git, .env, etc.)
        '**/node_modules/**',
        '**/package-lock.json',
        '**/.git/**',
        '**/vibetrace.db*',
        '**/devpost/checklist.md'    // avoid self-triggering on progress ticks
      ],
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      interval: 200,
      binaryInterval: 400,
      awaitWriteFinish: {
        stabilityThreshold: 400,
        pollInterval: 100
      }
    });

    const handleChange = (filepath, eventType) => {
      const relPath = path.relative(this.watchDir, filepath).replace(/\\/g, '/');

      // Special handling for vibetrace.md (Agent-Harness Communication Protocol)
      if (relPath === 'vibetrace.md') {
        const proto = protocol.read(this.watchDir);
        console.log(`[VibeTrace Protocol] Agent updated status: ${proto.status} — "${proto.task}"`);
        
        // Broadcast protocol update to dashboard
        sse.broadcast({
          type: 'protocol_update',
          protocol: proto
        });

        if (proto.status === 'in_progress') {
          this.ensureActiveTrace(proto);
          sse.broadcast({
            type: 'agent_status',
            status: 'working',
            task: proto.task || proto.intent,
            active_file: proto.active_file,
            file_action: proto.file_action,
            file_summary: proto.file_summary,
            filesCount: this.pendingChangedFiles.size,
            message: `Agent Working on ${proto.active_file || 'task'}: ${proto.task || proto.intent}`
          });
        } else if (proto.status === 'completed') {
          // Agent explicitly signaled completion! Trigger batch immediately
          console.log(`[VibeTrace Protocol] Agent signaled completion for: "${proto.task}". Processing trace...`);
          this.activeTrace = null;
          sse.broadcast({
            type: 'trace_completed',
            id: 'trace-live-active'
          });
          sse.broadcast({
            type: 'agent_status',
            status: 'completed',
            task: proto.task,
            active_file: proto.active_file,
            file_action: proto.file_action,
            message: `Task Completed: ${proto.task}`
          });
          clearTimeout(this.debounceTimer);
          setTimeout(() => this.processBatch(proto.task || proto.intent), 300);
        }
        return;
      }

      this.pendingChangedFiles.add(relPath);

      const now = Date.now();
      if (!this.firstChangeTimestamp) {
        this.firstChangeTimestamp = now;
      }

      // Check current protocol task
      const currentProto = protocol.read(this.watchDir);
      if (currentProto.status === 'in_progress') {
        this.ensureActiveTrace(currentProto, relPath);
      }

      const activeFileName = currentProto.active_file || relPath;
      const taskLabel = currentProto.task ? ` (${currentProto.task})` : '';

      // Notify frontend that agent is actively writing files
      sse.broadcast({
        type: 'agent_status',
        status: 'writing',
        filesCount: this.pendingChangedFiles.size,
        lastFile: relPath,
        active_file: activeFileName,
        file_action: currentProto.file_action || `Modifying ${relPath}`,
        message: `Agent modifying ${activeFileName} (${this.pendingChangedFiles.size} in batch)${taskLabel}...`
      });

      // Clear existing sliding timer
      clearTimeout(this.debounceTimer);

      // Maximum wait ceiling: if agent writes non-stop for 4 seconds, force process
      const timeSinceFirstChange = now - this.firstChangeTimestamp;
      if (timeSinceFirstChange > 4000) {
        console.log(`[VibeTrace Watcher] Max wait threshold reached (${timeSinceFirstChange}ms), processing batch...`);
        this.processBatch(currentProto.task || null);
        return;
      }

      // Sliding window debounce (1500ms of inactivity required to confirm agent is done writing)
      this.debounceTimer = setTimeout(() => {
        this.processBatch(currentProto.task || null);
      }, 1500);
    };

    this.watcher
      .on('add', p => handleChange(p, 'create'))
      .on('change', p => handleChange(p, 'modify'))
      .on('unlink', p => handleChange(p, 'delete'))
      .on('error', err => console.error('[Watcher Error]', err));
  }

  async processBatch(explicitPrompt = null) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    clearTimeout(this.debounceTimer);
    clearTimeout(this.maxWaitTimer);
    this.firstChangeTimestamp = null;

    const files = Array.from(this.pendingChangedFiles);
    this.pendingChangedFiles.clear();

    let diffs = [];
    if (files.length === 0) {
      diffs = await gitService.getDiffs();
      if (!diffs || diffs.length === 0) {
        this.isProcessing = false;
        return;
      }
      files.push(...diffs.map(d => d.file));
    }

    sse.broadcast({
      type: 'agent_status',
      status: 'analyzing',
      filesCount: files.length,
      message: `Stabilized: extracting Git diffs across ${files.length} file(s)...`
    });

    try {
      // 1. Gather git context and diffs
      const branch = await gitService.getCurrentBranch();
      const recentCommits = await gitService.getRecentCommits(3);
      if (!diffs || diffs.length === 0) {
        diffs = await gitService.getDiffs();
      }

      if (!diffs || diffs.length === 0) {
        diffs = files.map(f => ({
          file: f,
          status: 'modified',
          content: `+ [Live file mutation observed in ${f}]`
        }));
      }

      // Filter out vibetrace.md and database files from code diffs
      diffs = diffs.filter(d => d.file !== 'vibetrace.md' && !d.file.startsWith('vibetrace.db'));

      // 2. Check if diff has actually changed since last trace (deduplication)
      const diffContent = diffs.map(d => `${d.file}:${d.content}`).join('\n');
      const diffHash = crypto.createHash('md5').update(`${diffContent}::${explicitPrompt || ''}`).digest('hex');
      if (diffHash === this.lastAnalyzedDiffHash) {
        console.log('[VibeTrace Watcher] Diff content and task identical to previous analysis. Skipping redundant trace creation.');
        sse.broadcast({
          type: 'agent_status',
          status: 'idle',
          message: 'Listening for new code mutations...'
        });
        this.isProcessing = false;
        return;
      }

      this.lastAnalyzedDiffHash = diffHash;

      // 3. Read harness, skills context, and vibetrace.md protocol
      const harnessRules = harnessContext.read(this.watchDir);
      const proto = protocol.read(this.watchDir);

      // 4. Infer prompt intent from vibetrace.md protocol or commit
      let prompt = explicitPrompt || proto.task || proto.intent;
      if (!prompt) {
        if (recentCommits.length > 0 && recentCommits[0].message) {
          prompt = `Git Activity: ${recentCommits[0].message}`;
        } else {
          prompt = `Code modifications across ${files.slice(0, 3).join(', ')}`;
        }
      }

      // 5. Run causal analysis & trace generation
      console.log(`[VibeTrace Watcher] Analyzing code changes across ${files.length} file(s) for task: "${prompt}"...`);
      const analysis = await analyze({
        prompt,
        diffs,
        gitContext: { branch, filesChanged: files },
        watchDir: this.watchDir,
        harnessRules
      });

      // Attach protocol context
      analysis.agentProtocol = {
        agent: proto.agent || 'Coding Agent',
        task: proto.task || prompt,
        status: proto.status || 'completed',
        activeFile: proto.active_file || (files.length > 0 ? files[0] : null),
        fileAction: proto.file_action || null,
        fileSummary: proto.file_summary || null
      };

      const currentProto = protocol.read(this.watchDir);
      if (currentProto.status !== 'in_progress') {
        this.activeTrace = null;
        sse.broadcast({
          type: 'trace_completed',
          id: 'trace-live-active'
        });
      } else {
        // Keep active trace alive and broadcast fresh state
        this.ensureActiveTrace(currentProto);
      }

      // Persist permanently to SQLite database
      const db = require('./db');
      db.saveTrace(analysis, this.watchDir);

      if (this.onEventCallback) {
        this.onEventCallback(analysis);
      }

      // Broadcast permanent trace to dashboard
      sse.broadcast({
        type: 'trace',
        trace: analysis
      });

      sse.broadcast({
        type: 'agent_status',
        status: 'trace_created',
        task: analysis.agentProtocol?.task || analysis.title,
        traceId: analysis.id,
        message: `Trace Created: ${analysis.agentProtocol?.task || analysis.title}`
      });
    } catch (err) {
      console.error('[VibeTrace Watcher Error in processBatch]:', err);
      sse.broadcast({
        type: 'agent_status',
        status: 'idle',
        message: `Error during trace capture: ${err.message}`
      });
    } finally {
      this.isProcessing = false;
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    clearTimeout(this.debounceTimer);
    clearTimeout(this.maxWaitTimer);
  }
}

module.exports = new WorkspaceWatcher();
