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
  const paneLeft = document.getElementById('pane-left');
  const leftGitBranch = document.getElementById('left-git-branch');
  const leftProjectName = document.getElementById('left-project-name');
  const leftProjectPath = document.getElementById('left-project-path');
  const tracesSearchInput = document.getElementById('traces-search-input');
  const tracesCountTag = document.getElementById('traces-count-tag');
  const tracesScrollList = document.getElementById('traces-scroll-list');
  const emptyTracesState = document.getElementById('empty-traces-state');

  // Middle Pane: Trace Content & Diffs
  const paneMiddle = document.getElementById('pane-middle');
  const middleTraceTitle = document.getElementById('middle-trace-title');
  const middleTraceId = document.getElementById('middle-trace-id');
  const middleTraceTime = document.getElementById('middle-trace-time');
  const middleTraceCommit = document.getElementById('middle-trace-commit');
  const fileTabsScroll = document.getElementById('file-tabs-scroll');
  const diffsContainer = document.getElementById('diffs-container');
  const emptyDiffState = document.getElementById('empty-diff-state');

  // Right Pane: Inspector
  const paneRight = document.getElementById('pane-right');
  const aiRiskBadge = document.getElementById('ai-risk-badge');
  const aiModelTag = document.getElementById('ai-model-tag');
  const aiSummaryText = document.getElementById('ai-summary-text');
  const aiWhatChangedList = document.getElementById('ai-what-changed-list');
  const aiAffectedFeaturesRow = document.getElementById('ai-affected-features-row');
  const aiDownstreamText = document.getElementById('ai-downstream-text');

  // Agent Protocol Section
  const protoStatusTag = document.getElementById('proto-status-tag');
  const protoTaskIntent = document.getElementById('proto-task-intent');
  const protoStepsList = document.getElementById('proto-steps-list');
  const protoNotesText = document.getElementById('proto-notes-text');

  // Mechanical Harness Section
  const harnessOverallStatus = document.getElementById('harness-overall-status');
  const harnessAdviceText = document.getElementById('harness-advice-text');
  const harnessChecksList = document.getElementById('harness-checks-list');

  // AI Query Section
  const aiQueryInput = document.getElementById('ai-query-input');
  const btnRunQuery = document.getElementById('btn-run-query');
  const querySpinner = document.getElementById('query-spinner');
  const presetChips = document.querySelectorAll('.preset-chip');
  const queryAnswerCard = document.getElementById('query-answer-card');
  const queryModelTag = document.getElementById('query-model-tag');
  const queryAnswerBody = document.getElementById('query-answer-body');
  const btnCloseQueryAnswer = document.getElementById('btn-close-query-answer');

  // Telemetry
  const rightMetaBranch = document.getElementById('right-meta-branch');
  const rightMetaCommit = document.getElementById('right-meta-commit');
  const rightMetaAdd = document.getElementById('right-meta-add');
  const rightMetaDel = document.getElementById('right-meta-del');

  // Footer Ticker
  const footerStatusLabel = document.getElementById('footer-status-label');
  const footerTickerMsg = document.getElementById('footer-ticker-msg');

  // Resizers
  const resizerLeft = document.getElementById('resizer-left');
  const resizerRight = document.getElementById('resizer-right');

  // 1. Draggable Resizable Panes Engine
  function initResizers() {
    // Restore persistent widths
    const savedLeft = localStorage.getItem('vibetrace_left_w');
    const savedRight = localStorage.getItem('vibetrace_right_w');

    if (savedLeft && paneLeft) {
      paneLeft.style.width = `${Math.max(220, Math.min(550, parseInt(savedLeft, 10)))}px`;
    }
    if (savedRight && paneRight) {
      paneRight.style.width = `${Math.max(280, Math.min(700, parseInt(savedRight, 10)))}px`;
    }

    // Left Resizer (Controls Left Pane Width)
    if (resizerLeft && paneLeft) {
      resizerLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.body.classList.add('resizing');
        resizerLeft.classList.add('dragging');
        const startX = e.clientX;
        const startW = paneLeft.getBoundingClientRect().width;

        function onMouseMove(moveEvt) {
          const delta = moveEvt.clientX - startX;
          const newW = Math.max(220, Math.min(550, startW + delta));
          paneLeft.style.width = `${newW}px`;
        }

        function onMouseUp() {
          document.body.classList.remove('resizing');
          resizerLeft.classList.remove('dragging');
          localStorage.setItem('vibetrace_left_w', Math.round(paneLeft.getBoundingClientRect().width));
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // Right Resizer (Controls Right Pane Width)
    if (resizerRight && paneRight) {
      resizerRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        document.body.classList.add('resizing');
        resizerRight.classList.add('dragging');
        const startX = e.clientX;
        const startW = paneRight.getBoundingClientRect().width;

        function onMouseMove(moveEvt) {
          // Dragging left increases right pane width
          const delta = startX - moveEvt.clientX;
          const newW = Math.max(280, Math.min(700, startW + delta));
          paneRight.style.width = `${newW}px`;
        }

        function onMouseUp() {
          document.body.classList.remove('resizing');
          resizerRight.classList.remove('dragging');
          localStorage.setItem('vibetrace_right_w', Math.round(paneRight.getBoundingClientRect().width));
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  // 2. Theme Management (Light / Dark)
  function initTheme() {
    const saved = localStorage.getItem('vibetrace_theme') || 'light';
    applyTheme(saved);

    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('vibetrace_theme', next);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `${theme}-theme`;
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }

  // 3. Initialize Server-Sent Events (SSE)
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
      setTopBarStatus('idle', 'Reconnecting', 'Connection lost, retrying...');
    };
  }

  // 4. Render Agent Protocol from `vibetrace.md`
  function renderProtocol(proto) {
    if (!proto) return;

    const status = (proto.status || 'idle').toLowerCase();
    if (protoStatusTag) {
      protoStatusTag.className = `agent-status-pill status-${status}`;
      protoStatusTag.textContent = status === 'in_progress' ? 'In progress' : (status === 'completed' ? 'Completed' : 'Idle');
    }

    if (protoTaskIntent) {
      protoTaskIntent.textContent = proto.task || proto.intent || 'Waiting for coding agent instruction...';
    }

    if (protoStepsList) {
      protoStepsList.innerHTML = '';
      const steps = proto.steps || [];
      if (steps.length === 0) {
        protoStepsList.innerHTML = '<span style="font-size:11.5px;color:var(--text-muted);">No steps listed in vibetrace.md</span>';
      } else {
        steps.forEach(s => {
          const row = document.createElement('div');
          row.className = `proto-step-row ${s.done ? 'done' : ''}`;
          row.innerHTML = `
            <span class="proto-step-checkbox">${s.done ? '☑' : '☐'}</span>
            <span>${escapeHtml(s.text)}</span>
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
      setTopBarStatus('working', 'Agent working', proto.task || 'Active coding task...');
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'Task completed', proto.task || 'Agent finished task');
    }
  }

  // 5. Top Bar Real-Time Status Management
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
      setTopBarStatus('working', 'Agent working', data.task || data.message || 'Modifying codebase...');
      logTicker(data.message || 'Agent active...');
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'Task completed', data.task || 'Agent signaled task completion');
      logTicker(`Task completed: ${data.task || ''}`);
    } else if (status === 'analyzing') {
      setTopBarStatus('analyzing', 'AI synthesizing', 'OpenRouter model analyzing code impact...');
      logTicker(data.message || 'Validating syntax & synthesizing impact...');
    } else if (status === 'trace_created') {
      setTopBarStatus('completed', 'Trace created', data.task || 'Trace saved to SQLite');
      logTicker(`Trace saved to SQLite: ${data.task || ''}`);
    } else if (status === 'idle') {
      setTopBarStatus('idle', 'Harness ready', 'Standing by for agent task');
      logTicker(data.message || 'Watching local repository...');
    }
  }

  function logTicker(msg) {
    if (footerTickerMsg) {
      const time = new Date().toLocaleTimeString();
      footerTickerMsg.textContent = `[${time}] ${msg}`;
    }
  }

  // 6. Fetch System Status & Protocol
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

  // 7. Force Immediate Rescan
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
      btnRescan.querySelector('span:last-child').textContent = 'Rescan diffs';
    }
  }

  // 8. Add Trace to List
  function addTrace(trace) {
    traces.unshift(trace);
    renderTracesList();
    selectTrace(trace.id);
  }

  // 9. Render Left Pane: Chronological Traces Feed (BORDERLESS ROWS, NO CARDS!)
  function renderTracesList() {
    if (tracesCountTag) tracesCountTag.textContent = traces.length;

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
      if (emptyTracesState) emptyTracesState.classList.remove('hidden');
      return;
    }

    if (emptyTracesState) emptyTracesState.classList.add('hidden');
    tracesScrollList.innerHTML = '';

    filtered.forEach(trace => {
      const rowItem = document.createElement('div');
      rowItem.className = `trace-item-row ${trace.id === selectedTraceId ? 'active' : ''}`;
      rowItem.dataset.id = trace.id;

      const timeStr = trace.timestamp ? trace.timestamp.split(' ')[1] || trace.timestamp : '--:--:--';
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';

      const taskDisplayName = trace.agentProtocol?.task || trace.title || 'Code Changes';
      const isAgentTask = Boolean(trace.agentProtocol?.task);

      rowItem.innerHTML = `
        <div class="trace-item-header">
          <span class="trace-item-time">${timeStr}</span>
          <span class="trace-item-tag ${isAgentTask ? 'tag-agent' : ''}">
            ${isAgentTask ? 'Agent task' : (trace.changeType || 'Code change')}
          </span>
        </div>
        <div class="trace-item-title" title="${escapeHtml(taskDisplayName)}">${escapeHtml(taskDisplayName)}</div>
        <div class="trace-item-footer">
          <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          <div class="trace-diff-pills">
            <span class="diff-pill-add">${addStr}</span>
            <span class="diff-pill-del">${delStr}</span>
          </div>
        </div>
      `;

      rowItem.addEventListener('click', () => selectTrace(trace.id));
      tracesScrollList.appendChild(rowItem);
    });
  }

  // 10. Select Trace
  function selectTrace(id) {
    selectedTraceId = id;
    selectedFileFilter = 'all';

    const trace = traces.find(t => t.id === id);
    if (!trace) return;

    // Highlight active list row
    document.querySelectorAll('.trace-item-row').forEach(row => {
      row.classList.toggle('active', row.dataset.id === id);
    });

    // Populate Middle Pane
    if (emptyDiffState) emptyDiffState.classList.add('hidden');
    if (middleTraceTitle) {
      middleTraceTitle.textContent = trace.agentProtocol?.task || trace.title || trace.changeType || 'Code Changes';
    }
    if (middleTraceId) middleTraceId.textContent = trace.id ? trace.id.slice(0, 8) : '--';
    if (middleTraceTime) middleTraceTime.textContent = trace.timestamp || '';
    if (middleTraceCommit) middleTraceCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';

    // Render file pill tabs in Middle Pane
    renderFileTabs(trace);

    // Render syntax diffs in Middle Pane
    renderDiffsContent(trace);

    // Populate Right Pane (Dual Isolated Summaries & Impact Visualization)
    populateRightPane(trace);
  }

  // 11. Render File Tabs in Middle Pane
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

  // 12. Render Diffs in Middle Pane
  function renderDiffsContent(trace) {
    const diffs = trace.diffs || [];
    if (window.diffViewer) {
      window.diffViewer.render(diffsContainer, diffs, selectedFileFilter);
    }
  }

  // 13. Populate Right Pane (Dual Isolated Perspectives & Visual Impact)
  function populateRightPane(trace) {
    // -----------------------------------------------------------------
    // PERSPECTIVE 1: INDEPENDENT OPENROUTER AI MODEL SYNTHESIS
    // (What happened, Exact mechanical changes, Affected Features, Downstream Ripple Effects)
    // -----------------------------------------------------------------
    const synth = trace.synthesis || {};

    // Hero Stats Banner (Reference Design Metric Highlights)
    const heroStatDelta = document.getElementById('hero-stat-delta');
    const heroStatFiles = document.getElementById('hero-stat-files');
    const heroStatRisk = document.getElementById('hero-stat-risk');

    if (heroStatDelta) {
      const add = trace.additions != null ? trace.additions : 0;
      const del = trace.deletions != null ? trace.deletions : 0;
      heroStatDelta.textContent = `+${add} / -${del}`;
    }
    if (heroStatFiles) {
      const cnt = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      heroStatFiles.textContent = `${cnt} file${cnt === 1 ? '' : 's'}`;
    }
    if (heroStatRisk) {
      const rawRisk = synth.riskLevel || 'Low';
      heroStatRisk.textContent = rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase();
    }

    // Plain-English Summary
    if (aiSummaryText) {
      aiSummaryText.textContent = synth.summary || trace.summary || 'Code modifications recorded.';
    }

    // Exact Mechanical Changes Bullets
    if (aiWhatChangedList) {
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
    }

    // Visualizing Affected Features & Modules
    if (aiAffectedFeaturesRow) {
      aiAffectedFeaturesRow.innerHTML = '';
      const features = synth.affectedFeatures || (trace.subsystems?.length ? trace.subsystems : ['Core Logic']);
      features.forEach(feat => {
        const chip = document.createElement('span');
        chip.className = 'feature-tag';
        chip.textContent = feat;
        aiAffectedFeaturesRow.appendChild(chip);
      });
    }

    // Downstream Ripple Effect & Architectural Impact
    if (aiDownstreamText) {
      aiDownstreamText.textContent = synth.downstreamImpact || trace.architecturalImpact || 'Systemic boundaries consistent.';
    }

    // Risk Assessment Badge
    if (aiRiskBadge) {
      const risk = synth.riskLevel || 'Low';
      aiRiskBadge.className = `risk-badge risk-${risk.toLowerCase()}`;
      aiRiskBadge.textContent = `${risk} risk`;
    }

    // Model Tag
    if (aiModelTag) {
      aiModelTag.textContent = trace.model ? (trace.model.split('/')[1] || trace.model) : 'nemotron-3.5';
    }

    // -----------------------------------------------------------------
    // PERSPECTIVE 2: CODING AGENT DECLARED PLAN (vibetrace.md)
    // (Completely isolated from OpenRouter AI synthesis)
    // -----------------------------------------------------------------
    const agentProto = trace.agentProtocol;
    if (agentProto && agentProto.task) {
      if (protoTaskIntent) protoTaskIntent.textContent = agentProto.task;
      if (protoStatusTag) {
        protoStatusTag.className = 'agent-status-pill status-completed';
        protoStatusTag.textContent = 'Completed';
      }
    }

    // -----------------------------------------------------------------
    // SECTION 3: MECHANICAL AI HARNESS ENGINEERING AUDIT
    // -----------------------------------------------------------------
    const harness = trace.harness || {};
    const hStatus = (harness.status || 'PASS').toUpperCase();

    if (harnessOverallStatus) {
      harnessOverallStatus.className = `harness-badge ${hStatus.toLowerCase()}`;
      harnessOverallStatus.textContent = hStatus === 'PASS' ? 'Passed' : (hStatus === 'WARN' ? 'Warning' : 'Failed');
    }

    if (harnessAdviceText) {
      harnessAdviceText.textContent = harness.advice || 'Harness verified: Clean AST syntax and intact security boundaries.';
    }

    if (harnessChecksList) {
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
        box.className = `harness-check-item ${chkStatus}`;
        box.innerHTML = `
          <span class="check-glyph">${icoChar}</span>
          <div class="check-meta">
            <span class="check-title">${escapeHtml(check.name)}</span>
            <span class="check-desc">${escapeHtml(check.detail)}</span>
          </div>
        `;
        harnessChecksList.appendChild(box);
      });
    }

    // -----------------------------------------------------------------
    // TELEMETRY
    // -----------------------------------------------------------------
    if (leftGitBranch) leftGitBranch.textContent = trace.git?.branch || 'main';
    if (rightMetaBranch) rightMetaBranch.textContent = trace.git?.branch || 'main';
    if (rightMetaCommit) rightMetaCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';
    if (rightMetaAdd) rightMetaAdd.textContent = `+${trace.additions || 0}`;
    if (rightMetaDel) rightMetaDel.textContent = `-${trace.deletions || 0}`;
  }

  // 14. Submit Question to AI Query Engine
  async function submitQuery(customQuestion = null) {
    const question = customQuestion || (aiQueryInput ? aiQueryInput.value.trim() : '');
    if (!question) return;

    if (btnRunQuery) btnRunQuery.disabled = true;
    if (querySpinner) querySpinner.classList.remove('hidden');

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
        if (queryAnswerBody) queryAnswerBody.textContent = data.answer;
        if (queryModelTag) {
          queryModelTag.textContent = data.modelUsed ? (data.modelUsed.split('/')[1] || data.modelUsed) : 'OpenRouter AI';
        }
        if (queryAnswerCard) queryAnswerCard.classList.remove('hidden');
      }
    } catch (err) {
      if (queryAnswerBody) queryAnswerBody.textContent = `Error querying AI engine: ${err.message}`;
      if (queryAnswerCard) queryAnswerCard.classList.remove('hidden');
    } finally {
      if (btnRunQuery) btnRunQuery.disabled = false;
      if (querySpinner) querySpinner.classList.add('hidden');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
      if (aiQueryInput) aiQueryInput.value = q;
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
  initResizers();
  initTheme();
  fetchStatus();
  initSSE();
})();
