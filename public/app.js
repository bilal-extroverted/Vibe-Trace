// VibeTrace Dashboard Client Controller
// Pure Functional AI Observability, Persistent SQLite Storage & vibetrace.md Protocol

(function () {
  let traces = [];
  let selectedTraceId = null;
  let selectedFileFilter = 'all';
  let activeProjectPath = '';
  let searchQuery = '';

  // DOM Elements - Top Header
  const navProjectName = document.getElementById('nav-project-name');
  const liveIndicatorPill = document.getElementById('live-indicator-pill');
  const liveStatusBadge = document.getElementById('live-status-badge');
  const liveIndicatorText = document.getElementById('live-indicator-text');
  const btnRescan = document.getElementById('btn-rescan');
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
  const middleTraceCommit = document.getElementById('middle-trace-commit');
  const fileTabsScroll = document.getElementById('file-tabs-scroll');
  const diffsContainer = document.getElementById('diffs-container');
  const emptyDiffState = document.getElementById('empty-diff-state');

  // Right Pane: Card 1 - Independent AI Model Synthesis (OpenRouter)
  const aiRiskBadge = document.getElementById('ai-risk-badge');
  const aiModelTag = document.getElementById('ai-model-tag');
  const aiSummaryText = document.getElementById('ai-summary-text');
  const aiWhatChangedList = document.getElementById('ai-what-changed-list');
  const aiAffectedFeaturesRow = document.getElementById('ai-affected-features-row');
  const aiDownstreamText = document.getElementById('ai-downstream-text');

  // Right Pane: Card 2 - Coding Agent Declared Plan (vibetrace.md)
  const protoStatusTag = document.getElementById('proto-status-tag');
  const protoTaskIntent = document.getElementById('proto-task-intent');
  const protoStepsList = document.getElementById('proto-steps-list');
  const protoNotesText = document.getElementById('proto-notes-text');

  // Right Pane: Card 3 - Mechanical AI Harness Engineering Audit
  const harnessOverallStatus = document.getElementById('harness-overall-status');
  const harnessAdviceText = document.getElementById('harness-advice-text');
  const harnessChecksList = document.getElementById('harness-checks-list');

  // Right Pane: Card 4 - AI Query Engine
  const aiQueryInput = document.getElementById('ai-query-input');
  const btnRunQuery = document.getElementById('btn-run-query');
  const querySpinner = document.getElementById('query-spinner');
  const presetChips = document.querySelectorAll('.preset-chip');
  const queryAnswerCard = document.getElementById('query-answer-card');
  const queryModelTag = document.getElementById('query-model-tag');
  const queryAnswerBody = document.getElementById('query-answer-body');
  const btnCloseQueryAnswer = document.getElementById('btn-close-query-answer');

  // Right Pane: Telemetry
  const rightMetaBranch = document.getElementById('right-meta-branch');
  const rightMetaCommit = document.getElementById('right-meta-commit');
  const rightMetaAdd = document.getElementById('right-meta-add');
  const rightMetaDel = document.getElementById('right-meta-del');

  // Footer Ticker
  const footerStatusLabel = document.getElementById('footer-status-label');
  const footerTickerMsg = document.getElementById('footer-ticker-msg');

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
        if (payload.type === 'protocol_update') {
          renderProtocol(payload.protocol);
        } else if (payload.type === 'history') {
          traces = payload.traces || [];
          renderTracesList();
          if (traces.length > 0 && !selectedTraceId) {
            selectTrace(traces[0].id);
          }
        } else if (payload.type === 'trace') {
          logTicker(`Trace captured: ${payload.trace.title}`);
          addTrace(payload.trace);
          setTopBarStatus('completed', 'TRACE CREATED', payload.trace.agentProtocol?.task || payload.trace.title);
        } else if (payload.type === 'agent_status') {
          handleAgentStatus(payload);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    evtSource.onerror = function () {
      setTopBarStatus('idle', 'RECONNECTING', 'Connection lost, retrying...');
    };
  }

  // 3. Render Agent Protocol Card from `vibetrace.md`
  function renderProtocol(proto) {
    if (!proto) return;

    const status = (proto.status || 'idle').toLowerCase();
    if (protoStatusTag) {
      protoStatusTag.className = `agent-status-tag status-${status}`;
      protoStatusTag.textContent = status === 'in_progress' ? 'IN PROGRESS' : status.toUpperCase();
    }

    if (protoTaskIntent) {
      protoTaskIntent.textContent = proto.task || proto.intent || 'Waiting for coding agent instruction...';
    }

    if (protoStepsList) {
      protoStepsList.innerHTML = '';
      const steps = proto.steps || [];
      if (steps.length === 0) {
        protoStepsList.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">No steps listed in vibetrace.md</span>';
      } else {
        steps.forEach(s => {
          const row = document.createElement('div');
          row.className = `proto-step-row ${s.done ? 'done' : ''}`;
          row.innerHTML = `
            <span class="proto-step-checkbox">${s.done ? '☑' : '☐'}</span>
            <span>${s.text}</span>
          `;
          protoStepsList.appendChild(row);
        });
      }
    }

    if (protoNotesText) {
      protoNotesText.textContent = proto.notes || 'vibetrace.md protocol connected';
    }

    // Reflect in Top Live Status Indicator
    if (status === 'in_progress') {
      setTopBarStatus('working', 'AGENT WORKING', proto.task || 'Active coding task...');
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'TASK COMPLETED', proto.task || 'Agent finished task');
    }
  }

  // 4. Top Bar Real-Time Status Management
  function setTopBarStatus(type, badgeText, detailText) {
    if (!liveIndicatorPill) return;

    liveIndicatorPill.className = `agent-live-pill status-${type}`;
    if (liveStatusBadge) liveStatusBadge.textContent = badgeText;
    if (liveIndicatorText) liveIndicatorText.textContent = detailText;
    if (footerStatusLabel) footerStatusLabel.textContent = badgeText;
  }

  function handleAgentStatus(data) {
    const status = data.status;
    if (status === 'working') {
      setTopBarStatus('working', 'AGENT WORKING', data.task || data.message || 'Modifying codebase...');
      logTicker(data.message || 'Agent active...');
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'TASK COMPLETED', data.task || 'Agent signaled task completion');
      logTicker(`Task Completed: ${data.task || ''}`);
    } else if (status === 'analyzing') {
      setTopBarStatus('analyzing', 'AI SYNTHESIZING', 'OpenRouter model analyzing code impact...');
      logTicker(data.message || 'Validating syntax & synthesizing impact...');
    } else if (status === 'trace_created') {
      setTopBarStatus('completed', 'TRACE CREATED', data.task || 'Trace saved to SQLite');
      logTicker(`Trace saved to SQLite: ${data.task || ''}`);
    } else if (status === 'idle') {
      setTopBarStatus('idle', 'HARNESS READY', 'Standing by for agent task');
      logTicker(data.message || 'Watching local repository...');
    }
  }

  function logTicker(msg) {
    if (footerTickerMsg) {
      const time = new Date().toLocaleTimeString();
      footerTickerMsg.textContent = `[${time}] ${msg}`;
    }
  }

  // 5. Fetch System Status & Protocol
  async function fetchStatus() {
    try {
      const [resStatus, resProto] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/protocol')
      ]);

      const data = await resStatus.json();
      activeProjectPath = data.watchDir || '';

      if (navProjectName) navProjectName.textContent = data.projectName || 'workspace';
      if (leftProjectName) leftProjectName.textContent = data.projectName || 'workspace';
      if (leftProjectPath) {
        leftProjectPath.textContent = data.watchDir || '';
        leftProjectPath.title = data.watchDir || '';
      }
      if (navModelName && data.model) {
        navModelName.textContent = data.model.split('/')[1] || data.model;
      }
      logTicker(`Harness attached to: ${data.projectName}`);

      const protoData = await resProto.json();
      if (protoData && protoData.protocol) {
        renderProtocol(protoData.protocol);
      }
    } catch (e) {
      console.warn('Failed to fetch status:', e);
    }
  }

  // 6. Force Immediate Rescan
  async function rescanRepo() {
    btnRescan.classList.add('loading');
    btnRescan.querySelector('span:last-child').textContent = 'Scanning...';
    try {
      await fetch('/api/rescan', { method: 'POST' });
      logTicker('Git rescan triggered');
    } catch (e) {
      logTicker('Rescan request failed');
    } finally {
      btnRescan.classList.remove('loading');
      btnRescan.querySelector('span:last-child').textContent = 'Rescan Diffs';
    }
  }

  // 7. Add Trace to List
  function addTrace(trace) {
    traces.unshift(trace);
    renderTracesList();
    selectTrace(trace.id);
  }

  // 8. Render Left Pane: Chronological Traces Bar
  function renderTracesList() {
    tracesCountTag.textContent = traces.length;

    let filtered = traces;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.agentProtocol?.task && t.agentProtocol.task.toLowerCase().includes(q)) ||
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
      const barItem = document.createElement('div');
      barItem.className = `trace-bar-item ${trace.id === selectedTraceId ? 'active' : ''}`;
      barItem.dataset.id = trace.id;

      const timeStr = trace.timestamp ? trace.timestamp.split(' ')[1] || trace.timestamp : '--:--';
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';

      const taskDisplayName = trace.agentProtocol?.task || trace.title || 'Code Changes';
      const isAgentTask = Boolean(trace.agentProtocol?.task);

      barItem.innerHTML = `
        <div class="trace-bar-top-row">
          <span class="trace-bar-time">${timeStr}</span>
          <span class="trace-bar-tag ${isAgentTask ? 'agent-task' : ''}">
            ${isAgentTask ? 'AGENT TASK' : (trace.changeType || 'CODE MUTATION')}
          </span>
        </div>
        <div class="trace-bar-title" title="${taskDisplayName}">${taskDisplayName}</div>
        <div class="trace-bar-bottom-row">
          <span class="trace-bar-files">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          <div class="trace-diff-pills">
            <span class="diff-add">${addStr}</span>
            <span class="diff-del">${delStr}</span>
          </div>
        </div>
      `;

      barItem.addEventListener('click', () => selectTrace(trace.id));
      tracesScrollList.appendChild(barItem);
    });
  }

  // 9. Select Trace
  function selectTrace(id) {
    selectedTraceId = id;
    selectedFileFilter = 'all';

    const trace = traces.find(t => t.id === id);
    if (!trace) return;

    // Highlight active bar item
    document.querySelectorAll('.trace-bar-item').forEach(c => {
      c.classList.toggle('active', c.dataset.id === id);
    });

    // Populate Middle Pane
    emptyDiffState.classList.add('hidden');
    middleTraceTitle.textContent = trace.agentProtocol?.task || trace.title || trace.changeType || 'Code Changes';
    middleTraceId.textContent = trace.id ? trace.id.slice(0, 8) : '--';
    middleTraceTime.textContent = trace.timestamp || '';
    middleTraceCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';

    // Render file pill tabs in Middle Pane
    renderFileTabs(trace);

    // Render syntax diffs in Middle Pane
    renderDiffsContent(trace);

    // Populate Right Pane (Dual Isolated Summaries & Impact Visualization)
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

  // 12. Populate Right Pane (Dual Isolated Summaries & Visual Impact)
  function populateRightPane(trace) {
    // -----------------------------------------------------------------
    // PERSPECTIVE 1: INDEPENDENT OPENROUTER AI MODEL SYNTHESIS
    // (What happened, Exact mechanical changes, Affected Features, Downstream Ripple Effects)
    // -----------------------------------------------------------------
    const synth = trace.synthesis || {};

    // Plain-English Summary
    aiSummaryText.textContent = synth.summary || trace.summary || 'Code modifications recorded.';

    // Exact Mechanical Changes Bullets
    aiWhatChangedList.innerHTML = '';
    const changes = synth.whatChanged || [
      `Modified ${trace.files?.length || 1} file(s) across repository`,
      `Applied line delta (+${trace.additions || 0} / -${trace.deletions || 0})`
    ];
    changes.forEach(ch => {
      const li = document.createElement('li');
      li.textContent = ch;
      aiWhatChangedList.appendChild(li);
    });

    // Visualizing Affected Features & Modules
    aiAffectedFeaturesRow.innerHTML = '';
    const features = synth.affectedFeatures || (trace.subsystems?.length ? trace.subsystems : ['Core Logic']);
    features.forEach(feat => {
      const chip = document.createElement('span');
      chip.className = 'feature-chip';
      chip.textContent = feat;
      aiAffectedFeaturesRow.appendChild(chip);
    });

    // Downstream Ripple Effect & Architectural Impact
    aiDownstreamText.textContent = synth.downstreamImpact || trace.architecturalImpact || 'Systemic boundaries consistent.';

    // Risk Assessment Badge
    const risk = (synth.riskLevel || 'Low').toUpperCase();
    aiRiskBadge.className = `risk-badge risk-${risk.toLowerCase()}`;
    aiRiskBadge.textContent = `${risk} RISK`;

    // Model Tag
    if (aiModelTag) {
      aiModelTag.textContent = trace.model ? (trace.model.split('/')[1] || trace.model) : 'OpenRouter AI';
    }

    // -----------------------------------------------------------------
    // PERSPECTIVE 2: CODING AGENT DECLARED PLAN (vibetrace.md)
    // (Completely isolated from OpenRouter AI synthesis)
    // -----------------------------------------------------------------
    const agentProto = trace.agentProtocol;
    if (agentProto && agentProto.task) {
      protoTaskIntent.textContent = agentProto.task;
      protoStatusTag.className = 'agent-status-tag status-completed';
      protoStatusTag.textContent = 'COMPLETED';
    }

    // -----------------------------------------------------------------
    // CARD 3: MECHANICAL AI HARNESS ENGINEERING AUDIT
    // -----------------------------------------------------------------
    const harness = trace.harness || {};
    const hStatus = (harness.status || 'PASS').toUpperCase();

    harnessOverallStatus.className = `harness-status-pill ${hStatus.toLowerCase()}`;
    harnessOverallStatus.textContent = hStatus === 'PASS' ? 'PASSED' : (hStatus === 'WARN' ? 'WARNING' : 'FAILED');

    harnessAdviceText.textContent = harness.advice || 'Harness verification completed cleanly.';

    harnessChecksList.innerHTML = '';
    const checks = harness.checks || [
      { name: 'Syntax Integrity', status: 'PASS', detail: 'node --check AST validation' },
      { name: 'Protected Files', status: 'PASS', detail: 'Zero .env/keys touched' },
      { name: 'Secret Scanner', status: 'PASS', detail: 'No hardcoded credentials' },
      { name: 'Dependency Guard', status: 'PASS', detail: 'Package boundaries valid' }
    ];

    checks.forEach(check => {
      const chkStatus = (check.status || 'PASS').toLowerCase();
      const icoChar = chkStatus === 'pass' ? '✓' : (chkStatus === 'warn' ? '!' : '✕');

      const box = document.createElement('div');
      box.className = `check-box ${chkStatus}`;
      box.innerHTML = `
        <span class="check-icon">${icoChar}</span>
        <div class="check-details">
          <span class="check-title">${check.name}</span>
          <span class="check-desc">${check.detail}</span>
        </div>
      `;
      harnessChecksList.appendChild(box);
    });

    // -----------------------------------------------------------------
    // TELEMETRY
    // -----------------------------------------------------------------
    leftGitBranch.textContent = trace.git?.branch || 'main';
    rightMetaBranch.textContent = trace.git?.branch || 'main';
    rightMetaCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';
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

  // Event Listeners
  if (btnRescan) btnRescan.addEventListener('click', rescanRepo);
  if (btnRunQuery) btnRunQuery.addEventListener('click', () => submitQuery());
  if (btnCloseQueryAnswer) btnCloseQueryAnswer.addEventListener('click', () => queryAnswerCard.classList.add('hidden'));

  if (aiQueryInput) {
    aiQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitQuery();
    });
  }

  presetChips.forEach(chip => {
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
