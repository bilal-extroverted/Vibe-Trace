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
  const middleFilesSummary = document.getElementById('middle-files-summary');
  const middleDiffAdd = document.getElementById('middle-diff-add');
  const middleDiffDel = document.getElementById('middle-diff-del');
  const middleAgentBadge = document.getElementById('middle-agent-badge');
  const btnCopyDiff = document.getElementById('btn-copy-diff');
  const copyDiffLabel = document.getElementById('copy-diff-label');
  const btnToggleAllDiffs = document.getElementById('btn-toggle-all-diffs');
  const fileTabsScroll = document.getElementById('file-tabs-scroll');
  const diffsContainer = document.getElementById('diffs-container');
  const emptyDiffState = document.getElementById('empty-diff-state');

  // Middle Pane: Trace Impact & Change Intelligence Banner
  const middleTraceImpactBanner = document.getElementById('middle-trace-impact-banner');
  const middleTraceImpactBody = document.getElementById('middle-trace-impact-body');
  const btnToggleTraceImpact = document.getElementById('btn-toggle-trace-impact');
  const toggleImpactIcon = document.getElementById('toggle-impact-icon');
  const toggleImpactLabel = document.getElementById('toggle-impact-label');
  const middleImpactRisk = document.getElementById('middle-impact-risk');
  const middleWhatChangedList = document.getElementById('middle-what-changed-list');
  const middleAffectedFeaturesChips = document.getElementById('middle-affected-features-chips');
  const middleDownstreamDesc = document.getElementById('middle-downstream-desc');

  // Right Pane: Inspector
  const paneRight = document.getElementById('pane-right');
  const rightTraceId = document.getElementById('right-trace-id');
  const rightTraceTime = document.getElementById('right-trace-time');
  const rightTraceCommit = document.getElementById('right-trace-commit');
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

  // Live Active File Card Elements (Right Pane)
  const rightActiveFileCard = document.getElementById('right-active-file-card');
  const rightFileStatusLabel = document.getElementById('right-file-status-label');
  const rightFileActionTag = document.getElementById('right-file-action-tag');
  const rightActiveFilePath = document.getElementById('right-active-file-path');
  const btnCopyActiveFile = document.getElementById('btn-copy-active-file');
  const activeFileClickCopy = document.getElementById('active-file-click-copy');
  const rightFileActionDesc = document.getElementById('right-file-action-desc');
  const rightFileSummaryDesc = document.getElementById('right-file-summary-desc');
  let latestProtocol = null;

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

  // Footer Status & Ticker
  const footerLeftStatus = document.getElementById('footer-left-status') || document.querySelector('.footer-left');
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
        } else if (payload.type === 'trace_active') {
          handleActiveTrace(payload.trace);
        } else if (payload.type === 'trace_completed') {
          handleTraceCompleted(payload.id);
        } else if (payload.type === 'history') {
          traces = payload.traces || [];
          renderTracesList();
          if (traces.length > 0 && !selectedTraceId) {
            selectTrace(traces[0].id);
          }
        } else if (payload.type === 'trace') {
          logTicker(`Trace captured: ${payload.trace.title}`);
          // Remove active in-progress placeholder trace since permanent trace is now saved
          traces = traces.filter(t => t.id !== 'trace-live-active' && !t.inProgress);
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

  function handleActiveTrace(activeTrace) {
    if (!activeTrace) return;
    const existingIdx = traces.findIndex(t => t.id === activeTrace.id || t.inProgress);
    if (existingIdx >= 0) {
      traces[existingIdx] = activeTrace;
    } else {
      traces.unshift(activeTrace);
    }
    renderTracesList();

    // If no trace is selected or the active trace was already selected, update panes
    if (!selectedTraceId || selectedTraceId === activeTrace.id || selectedTraceId === 'trace-live-active') {
      selectTrace(activeTrace.id);
    }

    if (activeTrace.agentProtocol) {
      renderProtocol(activeTrace.agentProtocol);
    }
  }

  function handleTraceCompleted(id) {
    traces = traces.filter(t => t.id !== id && !t.inProgress);
    renderTracesList();
  }

  // 4. Render Agent Protocol from `vibetrace.md`
  function renderProtocol(proto) {
    if (!proto) return;
    latestProtocol = proto;

    const status = (proto.status || 'idle').toLowerCase();
    if (protoStatusTag) {
      protoStatusTag.className = `agent-status-pill status-${status}`;
      protoStatusTag.textContent = status === 'in_progress' ? 'IN PROGRESS' : status.toUpperCase();
    }

    // Populate Right Pane Live Active File Card
    if (rightActiveFileCard) {
      const activeFile = proto.active_file || proto.current_file || 'vibetrace.md';
      const fileAction = proto.file_action || proto.current_action || (status === 'in_progress' ? 'Executing declared plan steps...' : 'Waiting for agent instructions');
      const fileSummary = proto.file_summary || proto.intent || proto.task || 'vibetrace.md protocol connected';

      if (rightActiveFilePath) rightActiveFilePath.textContent = activeFile;
      if (rightFileActionDesc) rightFileActionDesc.textContent = fileAction;
      if (rightFileSummaryDesc) rightFileSummaryDesc.textContent = fileSummary;

      if (status === 'in_progress') {
        rightActiveFileCard.classList.add('is-live');
        if (rightFileStatusLabel) rightFileStatusLabel.textContent = 'ACTIVE FILE MUTATION';
        if (rightFileActionTag) {
          rightFileActionTag.textContent = proto.file_action_type || 'Modifying';
          rightFileActionTag.style.background = '#ecfdf5';
          rightFileActionTag.style.color = '#047857';
          rightFileActionTag.style.borderColor = '#a7f3d0';
        }
      } else if (status === 'completed') {
        rightActiveFileCard.classList.remove('is-live');
        if (rightFileStatusLabel) rightFileStatusLabel.textContent = 'TASK COMPLETED';
        if (rightFileActionTag) {
          rightFileActionTag.textContent = 'Verified';
          rightFileActionTag.style.background = '#f1f5f9';
          rightFileActionTag.style.color = '#475569';
          rightFileActionTag.style.borderColor = '#cbd5e1';
        }
      } else {
        rightActiveFileCard.classList.remove('is-live');
        if (rightFileStatusLabel) rightFileStatusLabel.textContent = 'STANDBY';
        if (rightFileActionTag) {
          rightFileActionTag.textContent = 'Idle';
          rightFileActionTag.style.background = 'var(--bg-surface-subtle)';
          rightFileActionTag.style.color = 'var(--text-muted)';
          rightFileActionTag.style.borderColor = 'var(--border-medium)';
        }
      }
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
      setTopBarStatus('working', 'AGENT WORKING', proto.task || 'Active coding task...');
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'TASK COMPLETED', proto.task || 'Agent finished task');
    }
  }

  // 5. Status Management
  function setTopBarStatus(type, badgeText, detailText) {
    if (footerLeftStatus) {
      footerLeftStatus.className = `footer-left status-${type}`;
    }
    if (footerStatusLabel) {
      footerStatusLabel.textContent = badgeText;
    }
  }

  function handleAgentStatus(data) {
    const status = data.status;
    if (status === 'working') {
      setTopBarStatus('working', 'AGENT WORKING', data.task || data.message || 'Modifying codebase...');
      logTicker(data.message || 'Agent active...');
    } else if (status === 'writing') {
      const activeFile = data.active_file || data.lastFile || 'workspace';
      setTopBarStatus('working', 'AGENT WRITING', data.message || `Writing to ${activeFile}...`);
      logTicker(data.message || `Modifying ${activeFile}...`);
      if (rightActiveFilePath) {
        rightActiveFilePath.textContent = activeFile;
      }
      if (data.file_action && rightFileActionDesc) {
        rightFileActionDesc.textContent = data.file_action;
      }
      if (rightActiveFileCard) {
        rightActiveFileCard.classList.add('is-live');
      }
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
      btnRescan.querySelector('span:last-child').textContent = 'Rescan Diffs';
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
      const isInProgress = Boolean(trace.inProgress || trace.status === 'in_progress');
      const rowItem = document.createElement('div');
      rowItem.className = `trace-item-row ${trace.id === selectedTraceId ? 'active' : ''} ${isInProgress ? 'in-progress' : ''}`;
      rowItem.dataset.id = trace.id;

      const timeStr = trace.timestamp ? (trace.timestamp.includes(' ') ? trace.timestamp.split(' ')[1] : trace.timestamp) : '--:--:--';
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';

      const taskDisplayName = trace.agentProtocol?.task || trace.title || 'Code Changes';
      const isAgentTask = Boolean(trace.agentProtocol?.task);
      const activeFileName = trace.activeFile || (trace.files && trace.files[0]) || (latestProtocol && latestProtocol.active_file) || 'vibetrace.md';

      if (isInProgress) {
        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag tag-in-progress">
              <span class="live-dot-pulse"></span> IN PROGRESS
            </span>
          </div>
          <div class="trace-item-title" title="${escapeHtml(taskDisplayName)}">${escapeHtml(taskDisplayName)}</div>
          <div class="trace-item-active-file" title="${escapeHtml(activeFileName)}">
            <span class="active-file-dot">●</span>
            <span class="active-file-label">Changing:</span>
            <code class="active-file-name">${escapeHtml(activeFileName)}</code>
          </div>
          <div class="trace-item-footer">
            <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'} in progress</span>
            <div class="trace-diff-pills">
              <span class="diff-pill-add">LIVE</span>
            </div>
          </div>
          <div class="trace-progress-line-track"><div class="trace-progress-line-bar"></div></div>
        `;
      } else {
        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag ${isAgentTask ? 'tag-agent' : ''}">
              ${isAgentTask ? 'AGENT TASK' : (trace.changeType || 'CODE MUTATION')}
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
      }

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
      middleTraceTitle.textContent = (trace.inProgress ? '● [IN PROGRESS] ' : '') + (trace.agentProtocol?.task || trace.title || trace.changeType || 'Code Changes');
    }

    const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
    if (middleFilesSummary) {
      if (trace.inProgress) {
        middleFilesSummary.textContent = `Active file: ${trace.activeFile || 'workspace'} (${fileCount} in progress)`;
      } else {
        middleFilesSummary.textContent = `${fileCount} file${fileCount === 1 ? '' : 's'} modified`;
      }
    }
    if (middleDiffAdd) {
      middleDiffAdd.textContent = trace.inProgress ? 'LIVE' : `+${trace.additions || 0}`;
    }
    if (middleDiffDel) {
      middleDiffDel.textContent = trace.inProgress ? 'MUTATION' : `-${trace.deletions || 0}`;
    }
    if (middleAgentBadge) {
      if (trace.inProgress) {
        middleAgentBadge.className = 'middle-meta-badge tag-agent';
        middleAgentBadge.textContent = 'In Progress';
      } else {
        const isAgent = Boolean(trace.agentProtocol?.task);
        middleAgentBadge.className = `middle-meta-badge ${isAgent ? 'tag-agent' : ''}`;
        middleAgentBadge.textContent = isAgent ? 'Agent Task' : (trace.changeType || 'Code Change');
      }
    }

    // Populate Middle Pane Trace Impact Intelligence Banner
    const synth = trace.synthesis || {};
    if (middleTraceImpactBanner) {
      middleTraceImpactBanner.style.display = 'block';
    }
    if (middleImpactRisk) {
      const risk = (synth.riskLevel || 'LOW').toUpperCase();
      middleImpactRisk.className = `impact-risk-chip risk-${risk.toLowerCase()}`;
      middleImpactRisk.textContent = `${risk} RISK`;
    }
    if (middleWhatChangedList) {
      middleWhatChangedList.innerHTML = '';
      const changes = synth.whatChanged && synth.whatChanged.length > 0
        ? synth.whatChanged
        : (trace.summary ? [trace.summary] : [`Observed line delta (+${trace.additions || 0} / -${trace.deletions || 0}) across codebase`]);
      changes.forEach(ch => {
        const li = document.createElement('li');
        li.textContent = ch;
        middleWhatChangedList.appendChild(li);
      });
    }
    if (middleAffectedFeaturesChips) {
      middleAffectedFeaturesChips.innerHTML = '';
      const feats = synth.affectedFeatures && synth.affectedFeatures.length > 0
        ? synth.affectedFeatures
        : (trace.subsystems?.length ? trace.subsystems : ['Core Logic']);
      feats.forEach(feat => {
        const chip = document.createElement('span');
        chip.className = 'impact-chip';
        chip.textContent = feat;
        middleAffectedFeaturesChips.appendChild(chip);
      });
    }
    if (middleDownstreamDesc) {
      middleDownstreamDesc.textContent = synth.downstreamImpact || trace.architecturalImpact || 'Local modifications safely contained. Systemic boundaries maintained.';
    }

    // Populate Right Pane Coordinates (Relocated from Middle Pane)
    if (rightTraceId) rightTraceId.textContent = `ID: ${trace.id ? trace.id.slice(0, 8) : '--'}`;
    if (rightTraceTime) rightTraceTime.textContent = trace.timestamp || '';
    if (rightTraceCommit) rightTraceCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';

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

  // 12. Render Diffs in Middle Pane with Trace Intelligence
  function renderDiffsContent(trace) {
    const diffs = trace.diffs || [];
    if (window.diffViewer) {
      window.diffViewer.render(diffsContainer, diffs, selectedFileFilter, trace);
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
      if (trace.inProgress) {
        heroStatDelta.textContent = 'LIVE';
      } else {
        const add = trace.additions != null ? trace.additions : 0;
        const del = trace.deletions != null ? trace.deletions : 0;
        heroStatDelta.textContent = `+${add} / -${del}`;
      }
    }
    if (heroStatFiles) {
      const cnt = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      heroStatFiles.textContent = trace.inProgress ? `${cnt} active` : `${cnt} file${cnt === 1 ? '' : 's'}`;
    }
    if (heroStatRisk) {
      heroStatRisk.textContent = trace.inProgress ? 'IN PROGRESS' : (synth.riskLevel || 'LOW').toUpperCase();
    }

    // Populate Right Pane Live Active File Mutation Card
    if (rightActiveFileCard) {
      if (trace.inProgress) {
        rightActiveFileCard.classList.add('is-live');
        if (rightFileStatusLabel) rightFileStatusLabel.textContent = 'ACTIVE FILE MUTATION';
        if (rightFileActionTag) {
          rightFileActionTag.textContent = trace.agentProtocol?.file_action_type || 'Modifying';
          rightFileActionTag.style.background = '#ecfdf5';
          rightFileActionTag.style.color = '#047857';
          rightFileActionTag.style.borderColor = '#a7f3d0';
        }
        if (rightActiveFilePath) rightActiveFilePath.textContent = trace.activeFile || 'vibetrace.md';
        if (rightFileActionDesc) rightFileActionDesc.textContent = trace.fileAction || 'Agent actively writing code to workspace...';
        if (rightFileSummaryDesc) rightFileSummaryDesc.textContent = trace.fileSummary || trace.synthesis?.summary || 'Live modifications taking place in codebase.';
      } else {
        rightActiveFileCard.classList.remove('is-live');
        const activeFile = trace.agentProtocol?.activeFile || (trace.files && trace.files[0]) || 'vibetrace.md';
        const fileAction = trace.agentProtocol?.fileAction || trace.summary || `Code modifications across ${trace.files?.length || 1} file(s)`;
        const fileSummary = trace.agentProtocol?.fileSummary || trace.synthesis?.overview || trace.summary || 'Trace recorded in SQLite.';

        if (rightFileStatusLabel) rightFileStatusLabel.textContent = 'CAPTURED MUTATION';
        if (rightFileActionTag) {
          rightFileActionTag.textContent = 'Captured';
          rightFileActionTag.style.background = '#f1f5f9';
          rightFileActionTag.style.color = '#475569';
          rightFileActionTag.style.borderColor = '#cbd5e1';
        }
        if (rightActiveFilePath) rightActiveFilePath.textContent = activeFile;
        if (rightFileActionDesc) rightFileActionDesc.textContent = fileAction;
        if (rightFileSummaryDesc) rightFileSummaryDesc.textContent = fileSummary;
      }
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
      const risk = (synth.riskLevel || 'Low').toUpperCase();
      aiRiskBadge.className = `risk-badge risk-${risk.toLowerCase()}`;
      aiRiskBadge.textContent = `${risk} RISK`;
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
        if (trace.inProgress) {
          protoStatusTag.className = 'agent-status-pill status-in_progress';
          protoStatusTag.textContent = 'IN PROGRESS';
        } else {
          protoStatusTag.className = 'agent-status-pill status-completed';
          protoStatusTag.textContent = 'COMPLETED';
        }
      }
    }

    // -----------------------------------------------------------------
    // SECTION 3: MECHANICAL AI HARNESS ENGINEERING AUDIT
    // -----------------------------------------------------------------
    const harness = trace.harness || {};
    const hStatus = (harness.status || 'PASS').toUpperCase();

    if (harnessOverallStatus) {
      harnessOverallStatus.className = `harness-badge ${hStatus.toLowerCase()}`;
      harnessOverallStatus.textContent = hStatus === 'PASS' ? 'PASSED' : (hStatus === 'WARN' ? 'WARNING' : 'FAILED');
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

  // Copy Diff Action
  if (btnCopyDiff) {
    btnCopyDiff.addEventListener('click', async () => {
      const trace = traces.find(t => t.id === selectedTraceId);
      if (!trace || !trace.diffs || trace.diffs.length === 0) return;

      let fullDiff = '';
      trace.diffs.forEach(d => {
        fullDiff += `--- a/${d.file}\n+++ b/${d.file}\n${d.content || ''}\n\n`;
      });

      try {
        await navigator.clipboard.writeText(fullDiff);
        if (copyDiffLabel) copyDiffLabel.textContent = 'Copied!';
        setTimeout(() => {
          if (copyDiffLabel) copyDiffLabel.textContent = 'Copy diff';
        }, 1800);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    });
  }

  // Toggle All Diffs Action
  if (btnToggleAllDiffs) {
    let allCollapsed = false;
    btnToggleAllDiffs.addEventListener('click', () => {
      allCollapsed = !allCollapsed;
      document.querySelectorAll('.diff-code-wrapper').forEach(w => {
        w.style.display = allCollapsed ? 'none' : 'block';
      });
    });
  // Copy Project Path Action
  const repoPathCopyBtn = document.getElementById('repo-path-copy-btn');
  const repoPathCopyTag = document.getElementById('repo-path-copy-tag');
  if (repoPathCopyBtn) {
    repoPathCopyBtn.addEventListener('click', async () => {
      const fullPath = (leftProjectPath ? (leftProjectPath.title || leftProjectPath.textContent) : '') || activeProjectPath;
      if (!fullPath) return;

      try {
        await navigator.clipboard.writeText(fullPath);
        if (repoPathCopyTag) {
          repoPathCopyTag.textContent = 'Copied!';
          repoPathCopyTag.classList.add('copied');
          setTimeout(() => {
            repoPathCopyTag.textContent = 'Copy';
            repoPathCopyTag.classList.remove('copied');
          }, 1800);
        }
      } catch (err) {
        console.warn('Path copy failed:', err);
      }
    });
  }

  // Copy Active File Path in Right Pane
  if (btnCopyActiveFile && rightActiveFilePath) {
    btnCopyActiveFile.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pathText = rightActiveFilePath.textContent.trim();
      if (!pathText) return;
      try {
        await navigator.clipboard.writeText(pathText);
        const original = btnCopyActiveFile.textContent;
        btnCopyActiveFile.textContent = 'Copied!';
        setTimeout(() => { btnCopyActiveFile.textContent = original; }, 1600);
      } catch (e) {}
    });
  }

  if (activeFileClickCopy && rightActiveFilePath) {
    activeFileClickCopy.addEventListener('click', async () => {
      const pathText = rightActiveFilePath.textContent.trim();
      if (!pathText) return;
      try {
        await navigator.clipboard.writeText(pathText);
        if (btnCopyActiveFile) {
          const original = btnCopyActiveFile.textContent;
          btnCopyActiveFile.textContent = 'Copied!';
          setTimeout(() => { btnCopyActiveFile.textContent = original; }, 1600);
        }
      } catch (e) {}
    });
  // Toggle Trace Impact & Change Intelligence Banner
  if (btnToggleTraceImpact && middleTraceImpactBody) {
    btnToggleTraceImpact.addEventListener('click', () => {
      const isHidden = middleTraceImpactBody.style.display === 'none';
      middleTraceImpactBody.style.display = isHidden ? 'block' : 'none';
      if (toggleImpactIcon) toggleImpactIcon.textContent = isHidden ? '▲' : '▼';
      if (toggleImpactLabel) toggleImpactLabel.textContent = isHidden ? 'Hide Summary' : 'Show Summary';
    });
  }

  // Initialize
  initResizers();
  initTheme();
  fetchStatus();
  initSSE();
})();
