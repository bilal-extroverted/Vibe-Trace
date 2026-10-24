const chokidar = require('chokidar');
const path = require('path');
const gitService = require('./gitService');
const harnessContext = require('./harnessContext');
const { analyze } = require('./analyzer');

class WorkspaceWatcher {
  constructor() {
    this.watcher = null;
    this.watchDir = null;
    this.onEventCallback = null;
    this.debounceTimer = null;
    this.pendingChangedFiles = new Set();
    this.lastPromptIntent = '';
  }

  setPromptIntent(prompt) {
    this.lastPromptIntent = prompt || '';
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
      interval: 250,
      binaryInterval: 500,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    const handleChange = (filepath, eventType) => {
      const relPath = path.relative(this.watchDir, filepath);
      console.log(`[Watcher Event] ${eventType}: ${relPath}`);
      this.pendingChangedFiles.add(relPath);

      // Debounce burst of AI saves
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.processBatch();
      }, 500);
    };

    this.watcher
      .on('add', p => handleChange(p, 'create'))
      .on('change', p => handleChange(p, 'modify'))
      .on('unlink', p => handleChange(p, 'delete'))
      .on('error', err => console.error('[Watcher Error]', err));
  }

  async processBatch() {
    const files = Array.from(this.pendingChangedFiles);
    this.pendingChangedFiles.clear();

    if (files.length === 0) return;

    console.log(`[VibeTrace Watcher] Processing live AI burst (${files.length} files touched)...`);

    try {
      // 1. Gather git context and diffs
      const branch = await gitService.getCurrentBranch();
      const recentCommits = await gitService.getRecentCommits(3);
      let diffs = await gitService.getDiffs();

      if (!diffs || diffs.length === 0) {
        diffs = files.map(f => ({
          file: f,
          status: 'modified',
          content: `+ [Live file mutation observed in ${f}]`
        }));
      }

      // 2. Read harness and skills context
      const harnessRules = harnessContext.read(this.watchDir);

      // 3. Infer or use prompt intent
      let prompt = this.lastPromptIntent;
      if (!prompt) {
        if (recentCommits.length > 0 && recentCommits[0].message) {
          prompt = `Git Activity: ${recentCommits[0].message}`;
        } else {
          prompt = `Live AI code edit touching ${files.slice(0, 3).join(', ')}`;
        }
      }

      // 4. Run causal analysis
      const analysis = await analyze({
        prompt,
        diffs,
        gitContext: { branch, filesChanged: files },
        harnessRules
      });

      const traceId = `tr_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;

      const event = {
        id: traceId,
        timestamp: new Date().toLocaleTimeString(),
        source: 'live-watcher',
        watchedDir: this.watchDir,
        ...analysis
      };

      if (this.onEventCallback) {
        this.onEventCallback(event);
      }
    } catch (err) {
      console.error('[VibeTrace Watcher Error in processBatch]:', err);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = new WorkspaceWatcher();
