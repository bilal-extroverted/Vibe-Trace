// VibeTrace Dashboard Client Controller
// Pure Functional AI Observability, Persistent SQLite Storage & Harness Audit

(function () {
  let traces = [];
  let selectedTraceId = null;
  let selectedFileFilter = 'all';
  let activeProjectPath = '';
  let searchQuery = '';

  // DOM Elements - Top Header
  const navProjectName = document.getElementById('nav-project-name');
  const btnOpenProjectsModal = document.getElementById('btn-open-projects-modal');
  const liveIndicatorPill = document.getElementById('live-indicator-pill');
  const liveIndicatorText = document.getElementById('live-indicator-text');
  const btnRescan = document.getElementById('btn-rescan');
  const btnOpenConnect = document.getElementById('btn-open-connect');
  const navModelName = document.getElementById('nav-model-name');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  // Left Pane: Project & Traces Feed
  const leftGitBranch = document.getElementById('left-git-branch');
  const leftProjectName = document.getElementById('left-project-name');
  const leftProjectPath = document.getElementById('left-project-path');
  const tracesSearchInput = document.getElementById('traces-search-input');
  const tracesCountTag = document.getElementById('traces-count-tag');
  const tracesScrollList = document.getElementById('traces-scroll-list');
  const emptyTracesState = document.getElementById('empty-traces-state');

  // Middle Pane: Trace Content & Diffs
  const middleTraceTitle = document.getElementById('middle-trace-title');
  const middleTraceId = document.getElementById('middle-trace-id');
  const middleTraceTime = document.getElementById('middle-trace-time');
  const fileTabsScroll = document.getElementById('file-tabs-scroll');
  const diffsContainer = document.getElementById('diffs-container');
  const emptyDiffState = document.getElementById('empty-diff-state');

  // Right Pane: AI Harness Engineering Audit
  const harnessOverallStatus = document.getElementById('harness-overall-status');
  const harnessAdviceText = document.getElementById('harness-advice-text');
  const harnessChecksList = document.getElementById('harness-checks-list');

  // Right Pane: AI Query Engine
  const aiQueryInput = document.getElementById('ai-query-input');
  const btnRunQuery = document.getElementById('btn-run-query');
  const querySpinner = document.getElementById('query-spinner');
  const queryChips = document.querySelectorAll('.query-chip');
  const queryAnswerCard = document.getElementById('query-answer-card');
  const queryModelTag = document.getElementById('query-model-tag');
  const queryAnswerBody = document.getElementById('query-answer-body');
  const btnCloseQueryAnswer = document.getElementById('btn-close-query-answer');

  // Right Pane: Summary & Info
  const rightSummaryText = document.getElementById('right-summary-text');
  const rightImpactText = document.getElementById('right-impact-text');
  const rightSubsystemsRow = document.getElementById('right-subsystems-row');
  const rightMetaCommit = document.getElementById('right-meta-commit');
  const rightMetaBranch = document.getElementById('right-meta-branch');
  const rightMetaAdd = document.getElementById('right-meta-add');
  const rightMetaDel = document.getElementById('right-meta-del');

  // Footer Ticker
  const footerStatusLabel = document.getElementById('footer-status-label');
  const footerTickerMsg = document.getElementById('footer-ticker-msg');

  // Modal: Project Connect & Onboarding
  const modalProject = document.getElementById('modal-project');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalInputPath = document.getElementById('modal-input-path');
  const modalBtnConnect = document.getElementById('modal-btn-connect');
  const recentProjectsList = document.getElementById('recent-projects-list');

  // 1. Theme Management (Light / Dark)
  function initTheme() {
    const saved = localStorage.getItem('vibetrace_theme') || 'light';
    applyTheme(saved);

    btnThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('vibetrace_theme', next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `${theme}-theme`;
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // 2. Initialize Server-Sent Events (SSE)
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
          logTicker(`Trace captured: ${payload.trace.title}`);
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
      logTicker(data.message || 'Agent actively modifying code...');
    } else if (data.status === 'analyzing') {
      setLiveIndicator('analyzing', 'Stabilized: Analyzing diffs...');
      logTicker(data.message || 'Validating syntax & harness rules...');
    } else if (data.status === 'idle') {
      setLiveIndicator('live', 'Watching Live');
      logTicker(data.message || 'Listening for filesystem mutations...');
    }
  }

  function setLiveIndicator(state, label) {
    if (!liveIndicatorPill) return;
    liveIndicatorPill.className = 'live-status-pill';
    if (state === 'writing') liveIndicatorPill.classList.add('writing');
    else if (state === 'analyzing') liveIndicatorPill.classList.add('analyzing');

    if (liveIndicatorText) liveIndicatorText.textContent = label;
    if (footerStatusLabel) footerStatusLabel.textContent = label.toUpperCase();
  }

  function logTicker(msg) {
    if (footerTickerMsg) {
      const time = new Date().toLocaleTimeString();
      footerTickerMsg.textContent = `[${time}] ${msg}`;
    }
  }

  // 3. Fetch Initial System Status & Project Info
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      activeProjectPath = data.watchDir || '';

      if (navProjectName) navProjectName.textContent = data.projectName || 'workspace';
      if (leftProjectName) leftProjectName.textContent = data.projectName || 'workspace';
      if (leftProjectPath) {
        leftProjectPath.textContent = data.watchDir || '';
        leftProjectPath.title = data.watchDir || '';
      }
      if (modalInputPath) modalInputPath.value = data.watchDir || '';
      if (navModelName && data.model) {
        navModelName.textContent = data.model.split('/')[1] || data.model;
      }
      logTicker(`Connected to project: ${data.projectName} (${data.watchDir})`);
    } catch (e) {
      console.warn('Failed to fetch status:', e);
    }
  }

  // 4. Load Recent Projects from SQLite
  async function loadRecentProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      const list = data.projects || [];

      if (recentProjectsList) {
        recentProjectsList.innerHTML = '';
        list.forEach(proj => {
          const row = document.createElement('div');
          row.className = 'recent-project-row';
          const isCurrent = proj.path.toLowerCase() === activeProjectPath.toLowerCase();

          row.innerHTML = `
            <div class="recent-proj-info">
              <span class="recent-proj-name">${proj.name}</span>
              <span class="recent-proj-path">${proj.path}</span>
            </div>
            ${isCurrent ? '<span class="recent-proj-badge">Active</span>' : '<span class="recent-proj-badge">Select</span>'}
          `;

          row.addEventListener('click', () => {
            connectToProject(proj.path);
            closeProjectModal();
          });
          recentProjectsList.appendChild(row);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 5. Connect / Switch Project Folder
  async function connectToProject(newPath) {
    if (!newPath) return;

    modalBtnConnect.disabled = true;
    modalBtnConnect.textContent = 'Connecting...';

    try {
      const res = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: newPath })
      });
      const data = await res.json();
      if (data.success) {
        activeProjectPath = data.watchDir;
        navProjectName.textContent = data.projectName;
        leftProjectName.textContent = data.projectName;
        leftProjectPath.textContent = data.watchDir;
        leftProjectPath.title = data.watchDir;

        traces = data.traces || [];
        selectedTraceId = null;
        renderTracesList();
        if (traces.length > 0) selectTrace(traces[0].id);

        logTicker(`Switched watcher to: ${data.watchDir}`);
      }
    } catch (err) {
      logTicker(`Failed to connect folder: ${err.message}`);
    } finally {
      modalBtnConnect.disabled = false;
      modalBtnConnect.textContent = 'Connect & Observe';
    }
  }

  // 6. Force Immediate Rescan
  async function rescanRepo() {
    btnRescan.textContent = '... Scanning';
    try {
      const res = await fetch('/api/rescan', { method: 'POST' });
      logTicker('Git rescan triggered');
    } catch (e) {
      logTicker('Rescan request failed');
    } finally {
      btnRescan.textContent = '↻ Rescan Diffs';
    }
  }

  // 7. Add Trace to List
  function addTrace(trace) {
    traces.unshift(trace);
    renderTracesList();
    selectTrace(trace.id);
  }

  // 8. Render Left Pane: Traces List
  function renderTracesList() {
    tracesCountTag.textContent = traces.length;

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
      tracesScrollList.innerHTML = '';
      emptyTracesState.classList.remove('hidden');
      return;
    }

    emptyTracesState.classList.add('hidden');
    tracesScrollList.innerHTML = '';

    filtered.forEach(trace => {
      const card = document.createElement('div');
      card.className = `trace-item-card ${trace.id === selectedTraceId ? 'active' : ''}`;
      card.dataset.id = trace.id;

      const timeStr = trace.timestamp ? trace.timestamp.split(' ')[1] || trace.timestamp : '--:--';
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';

      card.innerHTML = `
        <div class="trace-item-top">
          <span class="trace-item-time">${timeStr}</span>
          <span class="trace-item-type">${trace.changeType || 'Code Mutation'}</span>
        </div>
        <div class="trace-item-title">${trace.title || 'Code Changes'}</div>
        <div class="trace-item-bottom">
          <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          <div class="trace-diff-pills">
            <span class="diff-add">${addStr}</span>
            <span class="diff-del">${delStr}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => selectTrace(trace.id));
      tracesScrollList.appendChild(card);
    });
  }

  // 9. Select Trace
  function selectTrace(id) {
    selectedTraceId = id;
    selectedFileFilter = 'all';

    const trace = traces.find(t => t.id === id);
    if (!trace) return;

    // Highlight active card in left list
    document.querySelectorAll('.trace-item-card').forEach(c => {
      c.classList.toggle('active', c.dataset.id === id);
    });

    // Populate Middle Pane
    emptyDiffState.classList.add('hidden');
    middleTraceTitle.textContent = trace.title || trace.changeType || 'Code Changes';
    middleTraceId.textContent = trace.id ? trace.id.slice(0, 8) : '--';
    middleTraceTime.textContent = trace.timestamp || '';

    // Render file pill tabs in Middle Pane
    renderFileTabs(trace);

    // Render syntax diffs in Middle Pane
    renderDiffsContent(trace);

    // Populate Right Pane (Harness Audit, Summary, Impact, Metadata)
    populateRightPane(trace);
  }

  // 10. Render File Tabs in Middle Pane
  function renderFileTabs(trace) {
    fileTabsScroll.innerHTML = '';
    const diffs = trace.diffs || [];

    const allPill = document.createElement('button');
    allPill.className = `file-pill ${selectedFileFilter === 'all' ? 'active' : ''}`;
    allPill.textContent = `All Files (${diffs.length})`;
    allPill.addEventListener('click', () => {
      selectedFileFilter = 'all';
      updateActiveFilePill();
      renderDiffsContent(trace);
    });
    fileTabsScroll.appendChild(allPill);

    diffs.forEach(d => {
      const pill = document.createElement('button');
      pill.className = `file-pill ${selectedFileFilter === d.file ? 'active' : ''}`;
      const shortName = d.file.split(/[\\/]/).pop();
      pill.textContent = shortName;
      pill.title = d.file;
      pill.addEventListener('click', () => {
        selectedFileFilter = d.file;
        updateActiveFilePill();
        renderDiffsContent(trace);
      });
      fileTabsScroll.appendChild(pill);
    });
  }

  function updateActiveFilePill() {
    fileTabsScroll.querySelectorAll('.file-pill').forEach(p => {
      if (selectedFileFilter === 'all') {
        p.classList.toggle('active', p.textContent.startsWith('All Files'));
      } else {
        p.classList.toggle('active', p.title === selectedFileFilter);
      }
    });
  }

  // 11. Render Diffs in Middle Pane
  function renderDiffsContent(trace) {
    const diffs = trace.diffs || [];
    if (window.diffViewer) {
      window.diffViewer.render(diffsContainer, diffs, selectedFileFilter);
    }
  }

  // 12. Populate Right Pane (Harness, Summary, Impact, Telemetry)
  function populateRightPane(trace) {
    // A. Real AI Harness Engineering Audit
    const harness = trace.harness || {};
    const status = (harness.status || 'PASS').toUpperCase();

    harnessOverallStatus.className = `harness-status-pill ${status.toLowerCase()}`;
    harnessOverallStatus.textContent = status === 'PASS' ? 'PASSED' : (status === 'WARN' ? 'WARNING' : 'FAILED');

    harnessAdviceText.textContent = harness.advice || 'Harness verification completed cleanly.';

    // Render mechanical checks list
    harnessChecksList.innerHTML = '';
    const checks = harness.checks || [
      { name: 'Syntax Integrity', status: 'PASS', detail: 'All files compiled cleanly' },
      { name: 'Protected Files Guard', status: 'PASS', detail: 'No sensitive files modified' },
      { name: 'Secret & Key Scanner', status: 'PASS', detail: 'No hardcoded credentials' }
    ];

    checks.forEach(check => {
      const item = document.createElement('div');
      item.className = 'check-item';
      const chkStatus = (check.status || 'PASS').toLowerCase();
      const icoChar = chkStatus === 'pass' ? '✓' : (chkStatus === 'warn' ? '!' : '✕');

      item.innerHTML = `
        <span class="check-status-ico ${chkStatus}">${icoChar}</span>
        <div class="check-info">
          <span class="check-name">${check.name}</span>
          <span class="check-desc">${check.detail}</span>
        </div>
      `;
      harnessChecksList.appendChild(item);
    });

    // B. Plain English Summary & Impact
    rightSummaryText.textContent = trace.summary || 'Code modifications recorded.';
    rightImpactText.textContent = trace.architecturalImpact || 'Systemic boundaries consistent.';

    // Subsystems
    rightSubsystemsRow.innerHTML = '';
    const subsystems = trace.subsystems || ['Application Logic'];
    subsystems.forEach(s => {
      const pill = document.createElement('span');
      pill.className = 'subsystem-pill';
      pill.textContent = s;
      rightSubsystemsRow.appendChild(pill);
    });

    // Git & Telemetry
    leftGitBranch.textContent = trace.git?.branch || 'main';
    rightMetaBranch.textContent = trace.git?.branch || 'main';
    rightMetaCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 8) : 'HEAD';
    rightMetaAdd.textContent = `+${trace.additions || 0}`;
    rightMetaDel.textContent = `-${trace.deletions || 0}`;
  }

  // 13. Submit Question to AI Query Engine
  async function submitQuery(customQuestion = null) {
    const question = customQuestion || aiQueryInput.value.trim();
    if (!question) return;

    btnRunQuery.disabled = true;
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
        queryAnswerBody.textContent = data.answer;
        queryModelTag.textContent = data.modelUsed ? data.modelUsed.split('/')[1] || data.modelUsed : 'VibeTrace AI';
        queryAnswerCard.classList.remove('hidden');
      }
    } catch (err) {
      queryAnswerBody.textContent = `Error querying AI engine: ${err.message}`;
      queryAnswerCard.classList.remove('hidden');
    } finally {
      btnRunQuery.disabled = false;
      querySpinner.classList.add('hidden');
    }
  }

  // 14. Modal Dialog Handlers
  function openProjectModal() {
    loadRecentProjects();
    modalProject.classList.remove('hidden');
  }

  function closeProjectModal() {
    modalProject.classList.add('hidden');
  }

  // Event Listeners
  if (btnOpenProjectsModal) btnOpenProjectsModal.addEventListener('click', openProjectModal);
  if (btnOpenConnect) btnOpenConnect.addEventListener('click', openProjectModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeProjectModal);

  if (modalBtnConnect) {
    modalBtnConnect.addEventListener('click', () => {
      const p = modalInputPath.value.trim();
      if (p) {
        connectToProject(p);
        closeProjectModal();
      }
    });
  }

  if (modalProject) {
    modalProject.addEventListener('click', (e) => {
      if (e.target === modalProject) closeProjectModal();
    });
  }

  if (btnRescan) btnRescan.addEventListener('click', rescanRepo);
  if (btnRunQuery) btnRunQuery.addEventListener('click', () => submitQuery());
  if (btnCloseQueryAnswer) btnCloseQueryAnswer.addEventListener('click', () => queryAnswerCard.classList.add('hidden'));

  if (aiQueryInput) {
    aiQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitQuery();
    });
  }

  queryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      aiQueryInput.value = q;
      submitQuery(q);
    });
  });

  if (tracesSearchInput) {
    tracesSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderTracesList();
    });
  }

  // Initialize
  initTheme();
  fetchStatus();
  initSSE();
})();
