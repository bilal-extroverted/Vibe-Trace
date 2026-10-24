// VibeTrace Dashboard Controller
// 3-Pane Architecture: Left Traces, Middle Content/Diffs, Right Summary/Impact/Q&A

(function () {
  let traces = [];
  let selectedTraceId = null;
  let selectedFileFilter = 'all';
  let starredTraceIds = new Set();
  let searchQuery = '';

  // DOM Elements - Top Navigation
  const repoNameDisplay = document.getElementById('repo-name-display');
  const liveIndicatorPill = document.getElementById('live-indicator-pill');
  const liveIndicatorText = document.getElementById('live-indicator-text');
  const repoPathInput = document.getElementById('repo-path-input');
  const btnUpdateRepo = document.getElementById('btn-update-repo');
  const btnRescanRepo = document.getElementById('btn-rescan-repo');
  const activeModelName = document.getElementById('active-model-name');

  // Left Pane: Traces
  const tracesCountBadge = document.getElementById('traces-count-badge');
  const tracesSearch = document.getElementById('traces-search');
  const tracesList = document.getElementById('traces-list');
  const tracesEmpty = document.getElementById('traces-empty');

  // Middle Pane: Trace Content & Diffs
  const middleTraceId = document.getElementById('middle-trace-id');
  const middleTimestamp = document.getElementById('middle-timestamp');
  const fileFilterTabs = document.getElementById('file-filter-tabs');
  const diffsContainer = document.getElementById('diffs-container');
  const middleEmpty = document.getElementById('middle-empty');

  // Right Pane: AI Question Engine
  const queryInput = document.getElementById('query-input');
  const btnSubmitQuery = document.getElementById('btn-submit-query');
  const querySpinner = document.getElementById('query-spinner');
  const queryAnswerCard = document.getElementById('query-answer-card');
  const answerModelTag = document.getElementById('answer-model-tag');
  const answerText = document.getElementById('answer-text');
  const btnCloseAnswer = document.getElementById('btn-close-answer');
  const quickChips = document.querySelectorAll('.chip');

  // Right Pane: Summary & Info
  const summaryChangeType = document.getElementById('summary-change-type');
  const summaryLatency = document.getElementById('summary-latency');
  const summaryTitle = document.getElementById('summary-title');
  const summaryText = document.getElementById('summary-text');
  const impactText = document.getElementById('impact-text');
  const subsystemsList = document.getElementById('subsystems-list');
  const harnessRulesStatus = document.getElementById('harness-rules-status');
  const harnessRulesPreview = document.getElementById('harness-rules-preview');
  const metaBranch = document.getElementById('meta-branch');
  const metaCommit = document.getElementById('meta-commit');
  const metaAdditions = document.getElementById('meta-additions');
  const metaDeletions = document.getElementById('meta-deletions');

  // Footer
  const footerStatus = document.getElementById('footer-status');
  const footerStatusLabel = document.getElementById('footer-status-label');
  const footerMsg = document.getElementById('footer-msg');
  const footerCount = document.getElementById('footer-count');

  // 1. Initialize Server-Sent Events (SSE)
  function initSSE() {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = function (e) {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'history') {
          traces = payload.traces || [];
          renderTracesList();
          if (traces.length > 0 && !selectedTraceId) {
            selectTrace(traces[0].id);
          }
        } else if (payload.type === 'trace') {
          logFooter(`Trace captured: ${payload.trace.title}`);
          addTrace(payload.trace);
        } else if (payload.type === 'agent_status') {
          handleAgentStatus(payload);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    evtSource.onerror = function () {
      setLiveIndicator('reconnecting', 'Reconnecting...');
    };
  }

  function handleAgentStatus(data) {
    if (data.status === 'writing') {
      setLiveIndicator('writing', `Agent active (${data.filesCount} files)...`);
      logFooter(data.message || 'Agent actively modifying code...');
    } else if (data.status === 'analyzing') {
      setLiveIndicator('analyzing', 'Stabilized: Analyzing diffs...');
      logFooter(data.message || 'Extracting diffs and repository context...');
    } else if (data.status === 'idle') {
      setLiveIndicator('live', 'Watching Live');
      logFooter(data.message || 'Listening for filesystem mutations...');
    }
  }

  function setLiveIndicator(state, label) {
    if (!liveIndicatorPill) return;
    liveIndicatorPill.className = 'status-indicator';
    if (state === 'writing') liveIndicatorPill.classList.add('writing');
    else if (state === 'analyzing') liveIndicatorPill.classList.add('analyzing');

    if (liveIndicatorText) liveIndicatorText.textContent = label;
    if (footerStatusLabel) footerStatusLabel.textContent = label.toUpperCase();
  }

  function logFooter(msg) {
    if (footerMsg) {
      const time = new Date().toLocaleTimeString();
      footerMsg.textContent = `[${time}] ${msg}`;
    }
  }

  // 2. Fetch System Status
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.watchDir) {
        if (repoPathInput) repoPathInput.value = data.watchDir;
        const base = data.watchDir.split(/[\\/]/).filter(Boolean).pop() || 'workspace';
        if (repoNameDisplay) repoNameDisplay.textContent = base;
      }
      if (data.model && activeModelName) {
        activeModelName.textContent = data.model.split('/')[1] || data.model;
      }
      logFooter(`Watching local repository: ${data.watchDir}`);
    } catch (e) {
      console.warn('Could not fetch status:', e);
    }
  }

  // 3. Connect to Local Folder
  async function switchRepo() {
    const newDir = repoPathInput.value.trim();
    if (!newDir) return;

    btnUpdateRepo.disabled = true;
    btnUpdateRepo.textContent = 'Connecting...';

    try {
      const res = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: newDir })
      });
      const data = await res.json();
      if (data.success) {
        const base = data.watchDir.split(/[\\/]/).filter(Boolean).pop() || 'workspace';
        repoNameDisplay.textContent = base;
        logFooter(`Switched live watcher to: ${data.watchDir}`);
      }
    } catch (err) {
      logFooter(`Failed to switch folder: ${err.message}`);
    } finally {
      btnUpdateRepo.disabled = false;
      btnUpdateRepo.textContent = 'Connect';
    }
  }

  // 4. Force Rescan
  async function rescanRepo() {
    btnRescanRepo.textContent = 'Scanning...';
    try {
      const res = await fetch('/api/rescan', { method: 'POST' });
      logFooter('Git diff rescan triggered');
    } catch (e) {
      logFooter('Rescan failed');
    } finally {
      btnRescanRepo.textContent = '↻ Rescan';
    }
  }

  // 5. Submit Question to AI Query Engine
  async function submitQuery(customQuestion = null) {
    const question = customQuestion || queryInput.value.trim();
    if (!question) return;

    btnSubmitQuery.disabled = true;
    querySpinner.classList.remove('hidden');

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          traceId: selectedTraceId
        })
      });

      const data = await res.json();
      if (data.success) {
        answerText.textContent = data.answer;
        answerModelTag.textContent = data.modelUsed ? data.modelUsed.split('/')[1] || data.modelUsed : 'VibeTrace AI';
        queryAnswerCard.classList.remove('hidden');
      }
    } catch (err) {
      answerText.textContent = `Error querying AI engine: ${err.message}`;
      queryAnswerCard.classList.remove('hidden');
    } finally {
      btnSubmitQuery.disabled = false;
      querySpinner.classList.add('hidden');
    }
  }

  // 6. Add Trace
  function addTrace(trace) {
    traces.unshift(trace);
    renderTracesList();
    selectTrace(trace.id);
  }

  // 7. Render Left Pane: Traces List
  function renderTracesList() {
    footerCount.textContent = traces.length;
    tracesCountBadge.textContent = traces.length;

    let filtered = traces;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.files && t.files.some(f => f.toLowerCase().includes(q)))
      );
    }

    if (filtered.length === 0) {
      tracesList.innerHTML = '';
      tracesEmpty.classList.remove('hidden');
      return;
    }

    tracesEmpty.classList.add('hidden');
    tracesList.innerHTML = '';

    filtered.forEach(trace => {
      const card = document.createElement('div');
      card.className = `trace-card ${trace.id === selectedTraceId ? 'active' : ''}`;
      card.dataset.id = trace.id;

      const isStarred = starredTraceIds.has(trace.id);
      const starChar = isStarred ? '★' : '☆';
      const starClass = isStarred ? 'starred' : '';

      const timeStr = trace.timestamp ? trace.timestamp.split(' ')[1] || trace.timestamp : '--:--:--';
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';

      card.innerHTML = `
        <div class="trace-card-top">
          <span class="trace-time">${timeStr}</span>
          <button class="trace-star ${starClass}" data-id="${trace.id}">${starChar}</button>
        </div>
        <div class="trace-card-title">${trace.title || trace.changeType || 'Code Mutation'}</div>
        <div class="trace-card-meta">
          <span class="trace-files-badge">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          <div class="diff-stats">
            <span class="stat-add">${addStr}</span>
            <span class="stat-del">${delStr}</span>
          </div>
        </div>
      `;

      card.querySelector('.trace-star').addEventListener('click', (e) => {
        e.stopPropagation();
        if (starredTraceIds.has(trace.id)) {
          starredTraceIds.delete(trace.id);
        } else {
          starredTraceIds.add(trace.id);
        }
        renderTracesList();
      });

      card.addEventListener('click', () => selectTrace(trace.id));
      tracesList.appendChild(card);
    });
  }

  // 8. Select Trace
  function selectTrace(id) {
    selectedTraceId = id;
    selectedFileFilter = 'all';

    const trace = traces.find(t => t.id === id);
    if (!trace) return;

    // Highlight active card
    document.querySelectorAll('.trace-card').forEach(c => {
      c.classList.toggle('active', c.dataset.id === id);
    });

    // Populate Middle Pane (Content of the selected trace)
    middleEmpty.classList.add('hidden');
    middleTraceId.textContent = trace.id ? trace.id.slice(0, 10) : '--';
    middleTimestamp.textContent = trace.timestamp || '';

    // Render File Tabs
    renderFileTabs(trace);

    // Render Diffs in Middle Pane
    renderDiffsContent(trace);

    // Populate Right Pane (Summary, Impact, Subsystems, Harness)
    populateSummaryPane(trace);
  }

  // 9. Render File Filter Tabs in Middle Pane
  function renderFileTabs(trace) {
    fileFilterTabs.innerHTML = '';
    const diffs = trace.diffs || [];

    const allChip = document.createElement('button');
    allChip.className = `file-tab-chip ${selectedFileFilter === 'all' ? 'active' : ''}`;
    allChip.textContent = `All Files (${diffs.length})`;
    allChip.addEventListener('click', () => {
      selectedFileFilter = 'all';
      updateActiveFileTab();
      renderDiffsContent(trace);
    });
    fileFilterTabs.appendChild(allChip);

    diffs.forEach(d => {
      const chip = document.createElement('button');
      chip.className = `file-tab-chip ${selectedFileFilter === d.file ? 'active' : ''}`;
      const shortName = d.file.split(/[\\/]/).pop();
      chip.textContent = shortName;
      chip.title = d.file;
      chip.addEventListener('click', () => {
        selectedFileFilter = d.file;
        updateActiveFileTab();
        renderDiffsContent(trace);
      });
      fileFilterTabs.appendChild(chip);
    });
  }

  function updateActiveFileTab() {
    fileFilterTabs.querySelectorAll('.file-tab-chip').forEach(c => {
      if (selectedFileFilter === 'all') {
        c.classList.toggle('active', c.textContent.startsWith('All Files'));
      } else {
        c.classList.toggle('active', c.title === selectedFileFilter);
      }
    });
  }

  // 10. Render Diffs Content in Middle Pane
  function renderDiffsContent(trace) {
    const diffs = trace.diffs || [];
    if (window.diffViewer) {
      window.diffViewer.render(diffsContainer, diffs, selectedFileFilter);
    }
  }

  // 11. Populate Right Pane (Summary, Changings, Info)
  function populateSummaryPane(trace) {
    summaryChangeType.textContent = trace.changeType || 'Code Mutation';
    summaryLatency.textContent = trace.latency || '0.24s';
    summaryTitle.textContent = trace.title || 'Code Changes';

    summaryText.textContent = trace.summary || 'Code modifications recorded.';
    impactText.textContent = trace.architecturalImpact || 'Systemic boundaries consistent.';

    // Subsystems
    subsystemsList.innerHTML = '';
    const subsystems = trace.subsystems || ['Application Logic'];
    subsystems.forEach(s => {
      const pill = document.createElement('span');
      pill.className = 'subsystem-pill';
      pill.textContent = s;
      subsystemsList.appendChild(pill);
    });

    // Harness
    if (trace.harness) {
      harnessRulesStatus.textContent = trace.harness.rulesLoaded ? 'Skills & Rules Verified' : 'Standard Guidelines';
      harnessRulesPreview.textContent = trace.harness.rulesPreview || 'Repository rules loaded.';
    }

    // Git & Telemetry
    metaBranch.textContent = trace.git?.branch || 'main';
    metaCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 8) : 'HEAD';
    metaAdditions.textContent = `+${trace.additions || 0}`;
    metaDeletions.textContent = `-${trace.deletions || 0}`;
  }

  // Event Listeners
  if (btnUpdateRepo) btnUpdateRepo.addEventListener('click', switchRepo);
  if (btnRescanRepo) btnRescanRepo.addEventListener('click', rescanRepo);
  if (btnSubmitQuery) btnSubmitQuery.addEventListener('click', () => submitQuery());
  if (btnCloseAnswer) btnCloseAnswer.addEventListener('click', () => queryAnswerCard.classList.add('hidden'));

  if (queryInput) {
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitQuery();
    });
  }

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      queryInput.value = q;
      submitQuery(q);
    });
  });

  if (tracesSearch) {
    tracesSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderTracesList();
    });
  }

  // Initialize
  fetchStatus();
  initSSE();
})();
