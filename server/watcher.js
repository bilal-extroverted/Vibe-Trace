const chokidar = require('chokidar');
const path = require('path');
const crypto = require('crypto');
const gitService = require('./gitService');
const harnessContext = require('./harnessContext');
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
  }

  start(watchDir = '.', onEventCallback) {
    this.watchDir = path.resolve(watchDir);
    this.onEventCallback = onEventCallback;
    gitService.setCwd(this.watchDir);

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
      const relPath = path.relative(this.watchDir, filepath);
      this.pendingChangedFiles.add(relPath);

      const now = Date.now();
      if (!this.firstChangeTimestamp) {
        this.firstChangeTimestamp = now;
      }

      // Notify frontend that agent is actively writing files
      sse.broadcast({
        type: 'agent_status',
        status: 'writing',
        filesCount: this.pendingChangedFiles.size,
        lastFile: relPath,
        message: `Agent writing code: ${this.pendingChangedFiles.size} file(s) modified...`
      });

      // Clear existing sliding timer
      clearTimeout(this.debounceTimer);

      // Maximum wait ceiling: if agent writes non-stop for 4 seconds, force process
      const timeSinceFirstChange = now - this.firstChangeTimestamp;
      if (timeSinceFirstChange > 4000) {
        console.log(`[VibeTrace Watcher] Max wait threshold reached (${timeSinceFirstChange}ms), processing batch...`);
        this.processBatch();
        return;
      }

      // Sliding window debounce (1500ms of inactivity required to confirm agent is done writing)
      this.debounceTimer = setTimeout(() => {
        this.processBatch();
      }, 1500);
    };

    this.watcher
      .on('add', p => handleChange(p, 'create'))
      .on('change', p => handleChange(p, 'modify'))
      .on('unlink', p => handleChange(p, 'delete'))
      .on('error', err => console.error('[Watcher Error]', err));
  }

  async processBatch() {
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

      // 2. Check if diff has actually changed since last trace (deduplication)
      const diffContent = diffs.map(d => `${d.file}:${d.content}`).join('\n');
      const diffHash = crypto.createHash('md5').update(diffContent).digest('hex');

      if (diffHash === this.lastAnalyzedDiffHash) {
        console.log('[VibeTrace Watcher] Diff content identical to previous analysis. Skipping redundant LLM call.');
        sse.broadcast({
          type: 'agent_status',
          status: 'idle',
          message: 'Listening for new code mutations...'
        });
        this.isProcessing = false;
        return;
      }

      this.lastAnalyzedDiffHash = diffHash;

      // 3. Read harness and skills context
      const harnessRules = harnessContext.read(this.watchDir);

      // 4. Infer prompt intent from commit or touched files
      let prompt = '';
      if (recentCommits.length > 0 && recentCommits[0].message) {
        prompt = `Git Activity: ${recentCommits[0].message}`;
      } else {
        prompt = `Code modifications across ${files.slice(0, 3).join(', ')}`;
      }

      // 5. Run causal analysis & trace generation
      console.log(`[VibeTrace Watcher] Analyzing code changes across ${files.length} file(s)...`);
      const analysis = await analyze({
        prompt,
        diffs,
        gitContext: { branch, filesChanged: files },
        watchDir: this.watchDir,
        harnessRules
      });

      // Persist permanently to SQLite database
      const db = require('./db');
      db.saveTrace(analysis, this.watchDir);

      if (this.onEventCallback) {
        this.onEventCallback(analysis);
      }

      sse.broadcast({
        type: 'agent_status',
        status: 'idle',
        message: `Trace captured: ${analysis.title}`
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

