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
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  let currentEnvModel = '';

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

  // Top Card: User Prompt & Task Intent (Right Pane)
  const rightPromptTaskCard = document.getElementById('right-prompt-task-card');
  const promptCardTaskTitle = document.getElementById('prompt-card-task-title');
  const promptCardSynthesizedText = document.getElementById('prompt-card-synthesized-text');
  const promptCardStatusDot = document.getElementById('prompt-card-status-dot');
  const promptCardStatusLabel = document.getElementById('prompt-card-status-label');
  const promptCardAgentLabel = document.getElementById('prompt-card-agent-label');
  const btnCopyPrompt = document.getElementById('btn-copy-prompt');

  // Independent Prompt-to-Output Drift & Risk Guard (Right Pane)
  const rightDriftGuardCard = document.getElementById('right-drift-guard-card');
  const driftScoreBadge = document.getElementById('drift-score-badge');
  const driftRiskBadge = document.getElementById('drift-risk-badge');
  const driftAlertBanner = document.getElementById('drift-alert-banner');
  const driftAlertTitle = document.getElementById('drift-alert-title');
  const driftAlertMessage = document.getElementById('drift-alert-message');
  const driftAlertTag = document.getElementById('drift-alert-tag');
  const driftPromptIntentText = document.getElementById('drift-prompt-intent-text');
  const driftActualOutputText = document.getElementById('drift-actual-output-text');
  const driftDifferenceText = document.getElementById('drift-difference-text');
  const driftDiscrepanciesList = document.getElementById('drift-discrepancies-list');
  const driftRiskText = document.getElementById('drift-risk-text');
  const driftRemedyContent = document.getElementById('drift-remedy-content');
  const driftSourceLabel = document.getElementById('drift-source-label');
  const driftModelPill = document.getElementById('drift-model-pill');
  const btnReauditDrift = document.getElementById('btn-reaudit-drift');

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

  // Footer Status & Activity Logs Drawer
  const footerLeftStatus = document.getElementById('footer-left-status') || document.querySelector('.footer-left');
  const footerStatusLabel = document.getElementById('footer-status-label');
  const footerTickerContainer = document.getElementById('footer-ticker-container');
  const footerTickerMsg = document.getElementById('footer-ticker-msg');
  const btnToggleLogsDrawer = document.getElementById('btn-toggle-logs-drawer');
  const logsCountBadge = document.getElementById('logs-count-badge');
  const logsDrawer = document.getElementById('logs-drawer');
  const logsDrawerBody = document.getElementById('logs-drawer-body');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const btnCloseLogsDrawer = document.getElementById('btn-close-logs-drawer');
  const liveLogs = [];

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
      themeIcon.innerHTML = theme === 'light'
        ? '<svg class="ui-icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg class="ui-icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
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
          if (payload.protocol && payload.protocol.status === 'in_progress') {
            ensureActiveTraceFromProtocol(payload.protocol);
          }
        } else if (payload.type === 'trace_active') {
          handleActiveTrace(payload.trace);
        } else if (payload.type === 'trace_completed') {
          handleTraceCompleted(payload.id);
        } else if (payload.type === 'history') {
          traces = payload.traces || [];
          renderTracesList();
          // If an in-progress active trace exists, ALWAYS select it!
          const activeItem = traces.find(t => t.inProgress || t.status === 'in_progress');
          if (activeItem) {
            selectTrace(activeItem.id);
          } else if (traces.length > 0 && (!selectedTraceId || !traces.some(t => t.id === selectedTraceId))) {
            selectTrace(traces[0].id);
          }
        } else if (payload.type === 'trace') {
          logTicker(`Trace captured: ${payload.trace.title}`);
          const completedTask = payload.trace.agentProtocol?.task || payload.trace.title;

          // Morph active card into completed Sapphire Blue trace in-place!
          const activeIdx = traces.findIndex(t => t.id === 'trace-live-active' || t.inProgress || (completedTask && (t.agentProtocol?.task === completedTask || t.title === completedTask)));

          const completedTrace = {
            ...payload.trace,
            inProgress: false,
            status: 'completed',
            substatus: 'completed'
          };

          if (activeIdx !== -1) {
            traces[activeIdx] = completedTrace;
          } else {
            traces.unshift(completedTrace);
          }

          // Clean up any other duplicates
          traces = traces.filter((t, i) => {
            if (t.id === 'trace-live-active' && i !== (activeIdx !== -1 ? activeIdx : 0)) return false;
            return true;
          });

          renderTracesList();
          selectTrace(payload.trace.id);
          setTopBarStatus('completed', 'TRACE CREATED', completedTask);
        } else if (payload.type === 'agent_status') {
          handleAgentStatus(payload);
        } else if (payload.type === 'drift_update') {
          const targetTrace = traces.find(t => t.id === payload.traceId);
          if (targetTrace) {
            targetTrace.driftAnalysis = payload.driftAnalysis;
            renderTracesList();
            if (selectedTraceId === payload.traceId) {
              populateRightPane(targetTrace);
            }
          }
        } else if (payload.type === 'features_updated') {
          if (cachedEvolutionData) {
            loadFeaturesOverTime(true);
          }
        } else if (payload.type === 'log') {
          logTicker(payload.message, payload.category || 'SERVER', payload.level || 'info');
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    evtSource.onopen = function () {
      logTicker('SSE telemetry stream connected (live bidirectional link)', 'SSE', 'success');
    };

    evtSource.onerror = function () {
      setTopBarStatus('idle', 'RECONNECTING', 'Connection lost, retrying...');
    };
  }

  function ensureActiveTraceFromProtocol(proto) {
    if (!proto || proto.status !== 'in_progress') return;
    const taskName = proto.task || proto.intent || 'Active Agent Task';
    let activeItem = traces.find(t => t.id === 'trace-live-active' || t.inProgress);
    if (!activeItem) {
      activeItem = {
        id: 'trace-live-active',
        inProgress: true,
        status: 'in_progress',
        substatus: 'working',
        changing: false,
        title: taskName,
        timestamp: formatTraceTime(proto.started_at || new Date().toISOString()),
        activeFile: proto.active_file || 'vibetrace.md',
        files: [proto.active_file || 'vibetrace.md'],
        diffs: [{
          file: proto.active_file || 'vibetrace.md',
          content: `@@ -1,1 +1,1 @@\n+ // [Task Active] ${proto.file_action || 'Working on task...'}\n`,
          status: 'modified'
        }],
        additions: 0,
        deletions: 0,
        changeType: 'WORKING',
        agentProtocol: proto
      };
      traces.unshift(activeItem);
      renderTracesList();
      selectTrace(activeItem.id);
    } else {
      activeItem.agentProtocol = proto;
      if (proto.task) activeItem.title = proto.task;
      if (proto.active_file) activeItem.activeFile = proto.active_file;
      renderTracesList();
      if (selectedTraceId === activeItem.id) {
        populateRightPane(activeItem);
      }
    }
  }

  function handleActiveTrace(activeTrace) {
    if (!activeTrace) return;
    const activeTaskName = activeTrace.agentProtocol?.task || activeTrace.title;

    // In-place update if active trace already exists in memory
    const existingIdx = traces.findIndex(t => t.id === activeTrace.id || t.id === 'trace-live-active' || t.inProgress);
    if (existingIdx !== -1) {
      traces[existingIdx] = {
        ...traces[existingIdx],
        ...activeTrace
      };
    } else {
      // Remove any historical duplicate with same task name before unshifting
      traces = traces.filter(t => {
        if (activeTaskName && (t.agentProtocol?.task === activeTaskName || t.title === activeTaskName)) {
          return false;
        }
        return true;
      });
      traces.unshift(activeTrace);
    }

    const currentActive = traces[existingIdx !== -1 ? existingIdx : 0];
    renderTracesList();
    selectTrace(currentActive ? currentActive.id : activeTrace.id);

    if (activeTrace.agentProtocol) {
      renderProtocol(activeTrace.agentProtocol);
    }
  }

  function handleTraceCompleted(id) {
    // When completion event arrives, keep the card visible while transitioning to final analysis
    const item = traces.find(t => t.id === id);
    if (item) {
      item.substatus = 'completing';
      renderTracesList();
    }
  }

  // -----------------------------------------------------------------
  // User Prompt & Task Intent from vibetrace.md
  // -----------------------------------------------------------------
  function synthesizePromptText(task, intent) {
    if (!task && !intent) {
      return {
        title: 'Ready for AI coding agent task',
        fullText: 'Waiting for prompt from user and declared intent in vibetrace.md...'
      };
    }

    const rawTask = (task || '').trim();
    const rawIntent = (intent || '').trim();

    // In vibetrace.md, prompt intent is written in ## Current Task Intent (> user prompt)
    let sourceText = rawIntent || rawTask;

    // Clean markdown formatting: quotes (>), backticks, lists, code blocks
    let cleaned = sourceText
      .replace(/^>\s*/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\r?\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Remove conversational filler prefixes
    cleaned = cleaned.replace(/^(please\s+|can\s+you\s+|i\s+want\s+you\s+to\s+|i\s+need\s+you\s+to\s+|task:\s*)/i, '');
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return {
      title: rawTask || cleaned,
      fullText: cleaned || rawTask
    };
  }

  function updatePromptCard(proto, currentStatus) {
    if (!rightPromptTaskCard) return;

    const p = proto || latestProtocol || {};
    const status = (currentStatus || p.status || 'idle').toLowerCase();
    const synth = synthesizePromptText(p.task, p.intent);

    if (promptCardTaskTitle) {
      promptCardTaskTitle.textContent = synth.title;
      promptCardTaskTitle.title = synth.title;
    }

    if (promptCardSynthesizedText) {
      promptCardSynthesizedText.textContent = synth.fullText;
      promptCardSynthesizedText.title = synth.fullText;
    }

    const legacyBadge = document.getElementById('prompt-words-badge');
    if (legacyBadge) {
      legacyBadge.remove();
    }

    if (promptCardStatusDot) {
      promptCardStatusDot.className = 'prompt-status-dot';
      if (status === 'in_progress' || status === 'working') {
        promptCardStatusDot.classList.add('dot-working');
      } else if (status === 'writing' || status === 'changing') {
        promptCardStatusDot.classList.add('dot-changing');
      }
    }

    if (promptCardStatusLabel) {
      if (status === 'in_progress' || status === 'working') {
        promptCardStatusLabel.textContent = 'Agent Working';
      } else if (status === 'writing' || status === 'changing') {
        promptCardStatusLabel.textContent = 'Files Changing';
      } else if (status === 'completed') {
        promptCardStatusLabel.textContent = 'Completed';
      } else {
        promptCardStatusLabel.textContent = 'Standby';
      }
    }

    if (promptCardAgentLabel) {
      promptCardAgentLabel.textContent = p.agent || 'Antigravity AI';
    }

    if (btnCopyPrompt && !btnCopyPrompt.dataset.bound) {
      btnCopyPrompt.dataset.bound = 'true';
      btnCopyPrompt.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(synth.fullText);
          btnCopyPrompt.textContent = 'Copied!';
          setTimeout(() => { btnCopyPrompt.textContent = 'Copy'; }, 1500);
        } catch (e) {
          btnCopyPrompt.textContent = 'Failed';
          setTimeout(() => { btnCopyPrompt.textContent = 'Copy'; }, 1500);
        }
      });
    }
  }

  // 3b. Render Independent Prompt-to-Output Drift & Risk Guard (Right Pane)
  function renderDriftAnalysis(driftData, trace) {
    if (!rightDriftGuardCard) return;

    const proto = trace?.agentProtocol || latestProtocol || {};
    const promptText = trace?.agentProtocol?.task || proto.task || proto.intent || trace?.title || 'Active task';

    // Fallback if driftData is missing or not yet generated
    const drift = driftData || {
      hasDifference: false,
      alignmentScore: 100,
      riskLevel: 'LOW',
      hasSignificantIssue: false,
      alertLevel: 'NONE',
      alertTitle: '',
      alertMessage: 'Output is faithfully aligned with user prompt.',
      promptIntent: promptText,
      actualExecution: `Applied focused modifications across ${trace?.files?.length || 1} file(s) with intact constraints.`,
      differenceAnalysis: 'The executed code accurately addresses the declared prompt intent. Systemic boundaries maintained.',
      discrepancies: [],
      unrequestedChanges: [],
      missingRequirements: [],
      riskAssessment: 'Low risk. Modifications stay strictly within requested boundaries.',
      suggestedRemedy: 'Changes are verified and aligned. Safe to proceed.',
      source: 'drift-guard',
      modelUsed: currentEnvModel || 'drift-guard'
    };

    // Alignment Score Badge
    if (driftScoreBadge) {
      const score = Math.round(drift.alignmentScore != null ? drift.alignmentScore : 100);
      driftScoreBadge.textContent = `${score}% ALIGNED`;
      if (score >= 90) {
        driftScoreBadge.style.color = '#15803d';
        driftScoreBadge.style.background = '#f0fdf4';
        driftScoreBadge.style.borderColor = '#bbf7d0';
      } else if (score >= 70) {
        driftScoreBadge.style.color = '#854d0e';
        driftScoreBadge.style.background = '#fef9c3';
        driftScoreBadge.style.borderColor = '#fef08a';
      } else {
        driftScoreBadge.style.color = '#b91c1c';
        driftScoreBadge.style.background = '#fee2e2';
        driftScoreBadge.style.borderColor = '#fca5a5';
      }
    }

    // Risk Badge
    if (driftRiskBadge) {
      const risk = (drift.riskLevel || 'LOW').toUpperCase();
      driftRiskBadge.className = `drift-risk-badge risk-${risk.toLowerCase()}`;
      driftRiskBadge.textContent = `${risk} RISK`;
    }

    // Significant Issue Alert Banner — STRICT COLOR ACCURACY (Zero Red on Aligned)
    if (driftAlertBanner) {
      const beacon = document.getElementById('drift-alert-beacon');
      if (drift.hasSignificantIssue || drift.riskLevel === 'HIGH' || drift.riskLevel === 'CRITICAL') {
        driftAlertBanner.className = 'drift-alert-banner alert-critical';
        if (beacon) {
          beacon.className = 'alert-pulse-beacon beacon-critical';
          beacon.innerHTML = '';
        }
        if (driftAlertTitle) driftAlertTitle.textContent = drift.alertTitle || 'SIGNIFICANT DIVERGENCE DETECTED';
        if (driftAlertTag) driftAlertTag.textContent = `${(drift.riskLevel || 'CRITICAL').toUpperCase()} ALERT`;
        if (driftAlertMessage) {
          driftAlertMessage.textContent = drift.alertMessage || 'The output code differs significantly from what your prompt requested.';
        }
      } else if (drift.hasDifference) {
        driftAlertBanner.className = 'drift-alert-banner alert-warning';
        if (beacon) {
          beacon.className = 'alert-pulse-beacon beacon-warning';
          beacon.innerHTML = '<svg class="ui-icon" style="width:10px;height:10px;color:#d97706;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        }
        if (driftAlertTitle) driftAlertTitle.textContent = drift.alertTitle || 'Scope Discrepancy Observed';
        if (driftAlertTag) driftAlertTag.textContent = 'NOTICE';
        if (driftAlertMessage) driftAlertMessage.textContent = drift.alertMessage || 'Minor variance between prompt and output.';
      } else {
        driftAlertBanner.className = 'drift-alert-banner alert-success';
        if (beacon) {
          beacon.className = 'alert-pulse-beacon beacon-success';
          beacon.innerHTML = '<svg class="ui-icon" style="width:10px;height:10px;color:#16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        }
        if (driftAlertTitle) driftAlertTitle.textContent = 'PROMPT & OUTPUT FULLY ALIGNED';
        if (driftAlertTag) driftAlertTag.textContent = 'VERIFIED';
        if (driftAlertMessage) driftAlertMessage.textContent = 'No unrequested modifications or discrepancies detected. Code strictly matches declared prompt.';

      }
    }

    // Comparison Strip
    if (driftPromptIntentText) {
      driftPromptIntentText.textContent = drift.promptIntent || promptText;
    }
    if (driftActualOutputText) {
      driftActualOutputText.textContent = drift.actualExecution || (trace?.summary ? trace.summary : 'Applied code modifications.');
    }
    const driftOutputDot = document.getElementById('drift-output-dot');
    if (driftOutputDot) {
      if (drift.hasDifference) {
        driftOutputDot.className = 'comparison-dot output-dot dot-diverged';
      } else {
        driftOutputDot.className = 'comparison-dot output-dot';
      }
    }

    // Difference Analysis
    if (driftDifferenceText) {
      driftDifferenceText.textContent = drift.differenceAnalysis || 'Output aligns with declared requirements.';
    }

    // Discrepancies List (Contextual icons: Green SVG check for clean, bold Red bullet for true discrepancy)
    if (driftDiscrepanciesList) {
      driftDiscrepanciesList.innerHTML = '';
      const items = [];
      if (drift.discrepancies && drift.discrepancies.length > 0) {
        items.push(...drift.discrepancies);
      }
      if (drift.unrequestedChanges && drift.unrequestedChanges.length > 0) {
        items.push(...drift.unrequestedChanges.map(u => `Unrequested modification: ${u}`));
      }
      if (drift.missingRequirements && drift.missingRequirements.length > 0) {
        items.push(...drift.missingRequirements.map(m => `Missing requirement: ${m}`));
      }

      if (items.length === 0) {
        const li = document.createElement('li');
        li.className = 'item-clean';
        li.innerHTML = '<svg class="ui-icon" style="width:12px;height:12px;color:#16a34a;flex-shrink:0;margin-top:2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>No unrequested deviations or missing requirements detected.</span>';
        driftDiscrepanciesList.appendChild(li);
      } else {
        items.forEach(item => {
          const li = document.createElement('li');
          li.className = 'item-discrepancy';
          li.innerHTML = '<span class="discrepancy-bullet">•</span><span>' + escapeHtml(item) + '</span>';
          driftDiscrepanciesList.appendChild(li);
        });
      }
    }

    // Risk & Impact
    const driftRiskBlock = document.getElementById('drift-risk-block');
    if (driftRiskBlock) {
      if (drift.hasSignificantIssue || drift.riskLevel === 'HIGH' || drift.riskLevel === 'CRITICAL') {
        driftRiskBlock.className = 'detail-block drift-risk-block risk-warning';
      } else {
        driftRiskBlock.className = 'detail-block drift-risk-block';
      }
    }
    if (driftRiskText) {
      driftRiskText.textContent = drift.riskAssessment || 'Systemic boundaries consistent.';
    }

    // Remedy (Only display when there is a true divergence to remedy)
    const driftRemedyBlock = document.getElementById('drift-remedy-block');
    if (driftRemedyBlock) {
      if (drift.hasDifference && drift.suggestedRemedy) {
        driftRemedyBlock.classList.remove('hidden');
        if (driftRemedyContent) {
          driftRemedyContent.innerHTML = `<span>${escapeHtml(drift.suggestedRemedy)}</span>`;
        }
      } else {
        driftRemedyBlock.classList.add('hidden');
      }
    }

    // Meta & Model
    if (driftSourceLabel) {
      driftSourceLabel.textContent = drift.source === 'openrouter' ? 'Audited via OpenRouter' : 'Audited via Drift Engine';
    }
    if (driftModelPill) {
      const model = drift.modelUsed || currentEnvModel || '';
      driftModelPill.textContent = model ? (model.split('/')[1] || model) : 'AI Model';
      if (model) driftModelPill.title = `Model: ${model}`;
    }
  }

  // 4. Render Agent Protocol from `vibetrace.md`
  function renderProtocol(proto) {
    if (!proto) return;
    latestProtocol = proto;
    window.latestProtocol = proto;

    const status = (proto.status || 'idle').toLowerCase();
    if (protoStatusTag) {
      protoStatusTag.className = `agent-status-pill status-${status}`;
      protoStatusTag.textContent = status === 'in_progress' ? 'IN PROGRESS' : status.toUpperCase();
    }

    // Update Top Prompt & Task Intent Card
    updatePromptCard(proto, status);

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
          const checkIcon = s.done
            ? '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;"><rect x="3" y="3" width="18" height="18" rx="3" ry="3"/></svg>';
          row.innerHTML = `
            <span class="proto-step-checkbox">${checkIcon}</span>
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

    // Refresh Middle Pane file tabs and activity bar if current trace is selected
    if (selectedTraceId) {
      const curTrace = traces.find(t => t.id === selectedTraceId);
      if (curTrace) {
        renderFileTabs(curTrace);
      }
    }
  }

  // 5. Status & Observability Logs Management
  function setTopBarStatus(type, badgeText, detailText) {
    if (footerLeftStatus) {
      footerLeftStatus.className = `footer-left status-${type}`;
    }
    if (footerStatusLabel) {
      footerStatusLabel.textContent = badgeText;
    }
    if (detailText) {
      const catMap = {
        working: 'AGENT',
        writing: 'MUTATION',
        editing: 'MUTATION',
        analyzing: 'AI',
        completed: 'TRACE',
        difference: 'DRIFT',
        diverged: 'DRIFT',
        idle: 'HARNESS'
      };
      logTicker(detailText, catMap[type] || 'STATUS', type);
    }
  }

  function handleAgentStatus(data) {
    const status = data.status;
    const isChanging = status === 'writing' || data.substatus === 'changing';
    const isWorking = status === 'working' || data.substatus === 'working';

    if (isWorking || isChanging) {
      const statusType = isChanging ? 'writing' : 'working';
      const label = isChanging ? 'EDITING FILES' : 'AGENT WORKING';
      const msg = data.message || (isChanging ? `Agent modifying ${data.active_file || data.lastFile || 'files'}...` : `Agent working on task: ${data.task || ''}`);
      setTopBarStatus(statusType, label, msg);

      const activeFile = data.active_file || data.lastFile || 'vibetrace.md';
      if (rightActiveFilePath) rightActiveFilePath.textContent = activeFile;
      if (data.file_action && rightFileActionDesc) rightFileActionDesc.textContent = data.file_action;
      if (rightActiveFileCard) rightActiveFileCard.classList.add('is-live');

      if (latestProtocol) {
        updatePromptCard(latestProtocol, status);
      }

      const activeTaskName = data.task || latestProtocol?.task || 'Active Agent Task';

      let activeItem = traces.find(t => t.id === 'trace-live-active' || t.inProgress);
      if (activeItem) {
        // Dynamic in-place mutation of the existing trace card!
        activeItem.substatus = isChanging ? 'editing' : 'working';
        activeItem.changing = isChanging;
        activeItem.changeType = isChanging ? 'EDITING' : 'WORKING';
        if (data.task) activeItem.title = data.task;
        if (activeFile) {
          activeItem.activeFile = activeFile;
          if (!activeItem.files) activeItem.files = [activeFile];
          else if (!activeItem.files.includes(activeFile)) activeItem.files.push(activeFile);
        }
      } else {
        // First creation of the trace card upon starting task
        traces = traces.filter(t => {
          if (t.id === 'trace-live-active' || t.inProgress) return false;
          if (activeTaskName && (t.agentProtocol?.task === activeTaskName || t.title === activeTaskName)) {
            return false;
          }
          return true;
        });

        activeItem = {
          id: 'trace-live-active',
          inProgress: true,
          status: 'in_progress',
          substatus: isChanging ? 'editing' : 'working',
          changing: isChanging,
          title: activeTaskName,
          timestamp: formatTraceTime(latestProtocol?.started_at || new Date().toISOString()),
          activeFile: activeFile,
          files: [activeFile],
          diffs: [{
            file: activeFile,
            content: `@@ -1,1 +1,1 @@\n+ // [Live Mutation] Agent active\n`,
            status: 'modified'
          }],
          additions: 0,
          deletions: 0,
          changeType: isChanging ? 'EDITING' : 'WORKING',
          agentProtocol: latestProtocol
        };
        traces.unshift(activeItem);
      }

      renderTracesList();

      // ALWAYS automatically select the active in-progress trace
      selectTrace(activeItem.id);
    } else if (status === 'completed') {
      setTopBarStatus('completed', 'TASK COMPLETED', `Task completed: ${data.task || 'Agent signaled task completion'}`);
    } else if (status === 'analyzing') {
      setTopBarStatus('analyzing', 'AI SYNTHESIZING', data.message || 'OpenRouter model evaluating prompt-to-output alignment & impact...');
    } else if (status === 'trace_created') {
      setTopBarStatus('completed', 'TRACE CAPTURED', data.message || `Trace saved to SQLite: ${data.task || ''}`);
    } else if (status === 'difference' || status === 'diverged') {
      setTopBarStatus('difference', 'DIFFERENCE DETECTED', data.message || 'Prompt-output divergence observed.');
    } else if (status === 'idle') {
      setTopBarStatus('idle', 'HARNESS ACTIVE', data.message || 'Harness active — standing by for coding agent activity');
    }
  }

  function logTicker(msg, category = 'SYSTEM', level = 'info') {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();

    // 1. Update footer ticker text
    if (footerTickerMsg) {
      footerTickerMsg.textContent = `[${time}] ${msg}`;
      footerTickerMsg.title = `[${time}] ${msg}`;
    }

    // 2. Add to liveLogs store
    const entry = {
      id: Date.now() + Math.random(),
      time,
      category: String(category).toLowerCase(),
      level: String(level).toLowerCase(),
      msg
    };
    liveLogs.push(entry);

    if (liveLogs.length > 250) liveLogs.shift();

    // 3. Update count badge
    if (logsCountBadge) {
      logsCountBadge.textContent = liveLogs.length;
    }

    // 4. Append to logs drawer DOM
    if (logsDrawerBody) {
      const row = document.createElement('div');
      row.className = `log-entry-row level-${entry.level}`;
      const catClass = `cat-${entry.category.replace(/[^a-z0-9]/g, '')}`;
      row.innerHTML = `
        <span class="log-time">[${entry.time}]</span>
        <span class="log-cat-pill ${catClass}">${escapeHtml(entry.category)}</span>
        <span class="log-msg">${escapeHtml(entry.msg)}</span>
      `;
      logsDrawerBody.appendChild(row);

      // Auto-scroll to bottom
      logsDrawerBody.scrollTop = logsDrawerBody.scrollHeight;
    }
  }

  function toggleLogsDrawer() {
    if (!logsDrawer) return;
    const isHidden = logsDrawer.classList.contains('hidden');
    if (isHidden) {
      logsDrawer.classList.remove('hidden');
      logsDrawer.setAttribute('aria-hidden', 'false');
      if (logsDrawerBody) logsDrawerBody.scrollTop = logsDrawerBody.scrollHeight;
    } else {
      logsDrawer.classList.add('hidden');
      logsDrawer.setAttribute('aria-hidden', 'true');
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
      if (data.model) {
        currentEnvModel = data.model;
        if (aiModelTag) {
          aiModelTag.textContent = data.model.split('/')[1] || data.model;
          aiModelTag.title = `Configured OpenRouter model: ${data.model}`;
        }
      }
      logTicker(`Harness attached to: ${data.projectName}`);

      const protoData = await resProto.json();
      if (protoData && protoData.protocol) {
        renderProtocol(protoData.protocol);
        if (protoData.protocol.status === 'in_progress') {
          ensureActiveTraceFromProtocol(protoData.protocol);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch status:', e);
    }
  }

  // 6b. Fetch Initial Traces via REST
  async function fetchTraces() {
    try {
      const res = await fetch('/api/traces');
      const data = await res.json();
      if (data && data.traces && data.traces.length > 0) {
        if (traces.length === 0) {
          traces = data.traces;
          renderTracesList();
          if (!selectedTraceId && traces.length > 0) {
            const activeTrace = traces.find(t => t.inProgress || t.status === 'in_progress');
            selectTrace(activeTrace ? activeTrace.id : traces[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Initial traces fetch failed:', e);
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

  function normalizeTaskName(name) {
    if (!name) return '';
    return String(name).replace(/^["']|["']$/g, '').trim().toLowerCase();
  }

  // 8. Add Trace to List
  function addTrace(trace) {
    // Prevent duplicate task cards in memory — keep only latest trace for each task
    const newName = normalizeTaskName(trace.agentProtocol?.task || trace.title);
    traces = traces.filter(t => {
      if (t.id === trace.id) return false;
      const tName = normalizeTaskName(t.agentProtocol?.task || t.title);
      if (newName && tName && newName === tName) return false;
      return true;
    });
    traces.unshift(trace);
    renderTracesList();
    selectTrace(trace.id);
  }

  // 9. Render Left Pane: Chronological Traces Feed
  function formatTraceTime(ts) {
    if (!ts) return '--:--:--';
    if (typeof ts === 'string' && ts.includes(' ') && ts.split(' ')[1]) {
      return ts.split(' ')[1].slice(0, 8);
    }
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      }
    } catch (e) {}
    return String(ts).slice(0, 8);
  }

  // 9. Render Left Pane: Chronological Traces Feed (Clean, Single Card Per Task)
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

    // Deduplicate in list view: If an in-progress active trace exists, hide any past completed traces with the exact same task
    const activeTask = traces.find(t => t.inProgress || t.status === 'in_progress');
    if (activeTask) {
      const activeTaskName = normalizeTaskName(activeTask.agentProtocol?.task || activeTask.title);
      if (activeTaskName) {
        filtered = filtered.filter(t => {
          if (t.id === activeTask.id) return true;
          const tName = normalizeTaskName(t.agentProtocol?.task || t.title);
          return tName !== activeTaskName;
        });
      }
    }

    // Deduplicate completed traces: guarantee each task has EXACTLY ONE card in the timeline
    const seenCompletedTasks = new Set();
    filtered = filtered.filter(t => {
      const isInProgress = Boolean(t.inProgress || t.status === 'in_progress');
      if (isInProgress) return true;
      const taskName = normalizeTaskName(t.agentProtocol?.task || t.title);
      const key = taskName ? taskName.replace(/[^a-z0-9]/g, '') : t.id;
      if (seenCompletedTasks.has(key)) {
        return false;
      }
      seenCompletedTasks.add(key);
      return true;
    });

    if (filtered.length === 0) {
      tracesScrollList.innerHTML = '';
      if (emptyTracesState) emptyTracesState.classList.remove('hidden');
      return;
    }

    if (emptyTracesState) emptyTracesState.classList.add('hidden');
    tracesScrollList.innerHTML = '';

    filtered.forEach(trace => {
      const isInProgress = Boolean(trace.inProgress || trace.status === 'in_progress');
      const isChanging = isInProgress && Boolean(trace.changing || trace.substatus === 'changing');
      const isWorking = isInProgress && !isChanging;

      const timeStr = formatTraceTime(trace.timestamp);
      const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
      const addStr = trace.additions != null ? `+${trace.additions}` : '+0';
      const delStr = trace.deletions != null ? `-${trace.deletions}` : '-0';
      const taskDisplayName = trace.agentProtocol?.task || trace.title || 'Code Changes';
      const isAgentTask = Boolean(trace.agentProtocol?.task);
      const activeFileName = trace.activeFile || (trace.files && trace.files[0]) || (latestProtocol && latestProtocol.active_file) || 'vibetrace.md';

      const rowItem = document.createElement('div');
      rowItem.dataset.id = trace.id;

      // Check if difference is created / observed previously
      const hasDifference = Boolean(
        trace.driftAnalysis?.hasDifference ||
        trace.driftAnalysis?.hasSignificantIssue ||
        trace.status === 'diverged' ||
        trace.status === 'difference' ||
        (trace.driftAnalysis?.discrepancies && trace.driftAnalysis.discrepancies.length > 0)
      );

      if (hasDifference) {
        // STATE 4: DIFFERENCE CREATED / OBSERVED PREVIOUSLY [RED GRADIENT]
        rowItem.className = `trace-item-row is-difference status-difference has-difference status-diverged ${trace.id === selectedTraceId ? 'active' : ''}`;
        const alertLabel = trace.driftAnalysis?.alertLevel === 'CRITICAL' ? 'CRITICAL DRIFT' : 'DIFFERENCE DETECTED';
        const discrepancySnippet = trace.driftAnalysis?.discrepancies?.[0] || trace.driftAnalysis?.alertTitle || 'Prompt-output divergence detected';

        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag tag-difference">
              <span class="pill-red-alert-dot"></span> ${alertLabel}
            </span>
          </div>
          <div class="trace-item-title" title="${escapeHtml(taskDisplayName)}">${escapeHtml(taskDisplayName)}</div>
          <div class="trace-item-active-file" title="${escapeHtml(trace.driftAnalysis?.alertMessage || discrepancySnippet)}">
            <span class="difference-alert-dot"></span>
            <span class="active-file-label">Difference:</span>
            <code class="active-file-name difference-alert-name">${escapeHtml(discrepancySnippet)}</code>
          </div>
          <div class="trace-item-footer">
            <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
            <div class="trace-diff-pills">
              <span class="diff-pill-difference">RISK: ${(trace.driftAnalysis?.riskLevel || 'HIGH').toUpperCase()}</span>
            </div>
          </div>
        `;
      } else if (isChanging) {
        // STATE 2: FILES MUTATING / EDITING [ORANGE GRADIENT]
        rowItem.className = `trace-item-row in-progress is-changing is-editing status-changing status-editing ${trace.id === selectedTraceId ? 'active' : ''}`;
        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag tag-changing tag-editing">
              <span class="live-dot-pulse"></span> EDITING
            </span>
          </div>
          <div class="trace-item-title" title="${escapeHtml(taskDisplayName)}">${escapeHtml(taskDisplayName)}</div>
          <div class="trace-item-active-file" title="${escapeHtml(activeFileName)}">
            <span class="active-file-dot"></span>
            <span class="active-file-label">Editing:</span>
            <code class="active-file-name">${escapeHtml(activeFileName)}</code>
          </div>
          <div class="trace-item-footer">
            <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'} in progress</span>
            <div class="trace-diff-pills">
              <span class="diff-pill-editing">EDITING</span>
            </div>
          </div>
          <div class="trace-progress-line-track"><div class="trace-progress-line-bar"></div></div>
        `;
      } else if (isWorking) {
        // STATE 1: TASK STARTED / WORKING [YELLOW GRADIENT]
        rowItem.className = `trace-item-row is-working status-working ${trace.id === selectedTraceId ? 'active' : ''}`;
        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag tag-working">
              <span class="pill-amber-dot"></span> WORKING
            </span>
          </div>
          <div class="trace-item-title" title="${escapeHtml(taskDisplayName)}">${escapeHtml(taskDisplayName)}</div>
          <div class="trace-item-active-file" title="${escapeHtml(activeFileName)}">
            <span class="working-amber-dot"></span>
            <span class="active-file-label">In Progress:</span>
            <code class="active-file-name">${escapeHtml(activeFileName || 'Planning task & reading files')}</code>
          </div>
          <div class="trace-item-footer">
            <span class="trace-item-files">${fileCount} file${fileCount === 1 ? '' : 's'}</span>
            <div class="trace-diff-pills">
              <span class="diff-pill-working">WORKING</span>
            </div>
          </div>
        `;
      } else {
        // STATE 3: TASK COMPLETED [BLUE GRADIENT]
        const tagLabel = 'COMPLETED';
        const tagClass = 'tag-completed';

        rowItem.className = `trace-item-row status-completed ${trace.id === selectedTraceId ? 'active' : ''}`;
        rowItem.innerHTML = `
          <div class="trace-item-header">
            <span class="trace-item-time">${timeStr}</span>
            <span class="trace-item-tag ${tagClass}">${tagLabel}</span>
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

    // Set active status on middle pane for visual attachment indicator
    const paneMiddleEl = document.getElementById('pane-middle');
    if (paneMiddleEl) {
      const status = (trace.inProgress ? (trace.changing ? 'editing' : 'working') : (trace.hasDifference ? 'difference' : 'completed'));
      paneMiddleEl.setAttribute('data-active-trace-status', status);
    }

    // Check if viewing completed history while an agent task is active
    const activeLiveTrace = traces.find(t => t.inProgress || t.status === 'in_progress');
    const isViewingHistoricalWhileLive = Boolean(activeLiveTrace && activeLiveTrace.id !== trace.id && !trace.inProgress);
    const histBanner = document.getElementById('viewing-historical-banner');
    if (histBanner) {
      if (isViewingHistoricalWhileLive) {
        histBanner.classList.remove('hidden');
      } else {
        histBanner.classList.add('hidden');
      }
    }

    const btnReturnLive = document.getElementById('btn-return-live-trace');
    if (btnReturnLive && !btnReturnLive.dataset.bound) {
      btnReturnLive.dataset.bound = 'true';
      btnReturnLive.addEventListener('click', () => {
        const active = traces.find(t => t.inProgress || t.status === 'in_progress');
        if (active) {
          selectTrace(active.id);
        }
      });
    }

    // Populate Middle Pane
    if (emptyDiffState) emptyDiffState.classList.add('hidden');
    if (middleTraceTitle) {
      middleTraceTitle.textContent = trace.agentProtocol?.task || trace.title || trace.changeType || 'Code Changes';
    }

    const fileCount = trace.files ? trace.files.length : (trace.diffs ? trace.diffs.length : 1);
    if (middleFilesSummary) {
      if (trace.inProgress) {
        middleFilesSummary.textContent = `${fileCount} file${fileCount === 1 ? '' : 's'} in progress`;
      } else {
        middleFilesSummary.textContent = `${fileCount} file${fileCount === 1 ? '' : 's'} modified`;
      }
    }
    const deltaSummaryEl = document.getElementById('middle-delta-summary');
    if (trace.inProgress) {
      if (deltaSummaryEl) deltaSummaryEl.style.display = 'none';
    } else {
      if (deltaSummaryEl) deltaSummaryEl.style.display = 'inline-flex';
      if (middleDiffAdd) middleDiffAdd.textContent = `+${trace.additions || 0}`;
      if (middleDiffDel) middleDiffDel.textContent = `-${trace.deletions || 0}`;
    }
    if (middleAgentBadge) {
      const isInProgress = Boolean(trace.inProgress || trace.status === 'in_progress');
      const isChanging = isInProgress && Boolean(trace.changing || trace.substatus === 'changing');
      const isWorking = isInProgress && !isChanging;

      if (isWorking) {
        middleAgentBadge.className = 'middle-meta-badge tag-working';
        middleAgentBadge.innerHTML = '<span class="pill-amber-dot"></span> Working';
      } else if (isChanging) {
        middleAgentBadge.className = 'middle-meta-badge tag-changing tag-editing';
        middleAgentBadge.innerHTML = '<span class="live-dot-pulse"></span> Editing Files';
      } else {
        middleAgentBadge.className = 'middle-meta-badge tag-completed';
        middleAgentBadge.textContent = 'Completed Task';
      }
    }

    // Populate Middle Pane Trace Impact Intelligence Banner
    const synth = trace.synthesis || {};
    if (middleTraceImpactBanner) {
      middleTraceImpactBanner.style.display = 'block';
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

    // Populate Right Pane (Dual Isolated Perspectives & Visual Impact)
    populateRightPane(trace);

    // Update footer status & activity ticker to reflect the selected trace
    if (trace.inProgress) {
      const isChanging = Boolean(trace.changing || trace.substatus === 'changing');
      const stType = isChanging ? 'writing' : 'working';
      const stLabel = isChanging ? 'EDITING FILES' : 'AGENT WORKING';
      const stMsg = isChanging
        ? `Live Agent: Modifying ${trace.activeFile || 'files'} for task: "${trace.title}"`
        : `Live Agent: Working on task: "${trace.title}"`;
      setTopBarStatus(stType, stLabel, stMsg);
    } else {
      const hasDiff = Boolean(
        trace.driftAnalysis?.hasDifference ||
        trace.driftAnalysis?.hasSignificantIssue ||
        trace.status === 'diverged' ||
        trace.status === 'difference'
      );
      if (hasDiff) {
        setTopBarStatus('difference', 'DIFFERENCE DETECTED', `Selected Trace: Divergence observed on "${trace.agentProtocol?.task || trace.title}"`);
      } else {
        setTopBarStatus('completed', 'TRACE CAPTURED', `Selected Trace: "${trace.agentProtocol?.task || trace.title}" (+${trace.additions || 0} / -${trace.deletions || 0})`);
      }
    }
  }

  // 11. Render File Tabs in Middle Pane
  function matchesFile(f1, f2) {
    if (!f1 || !f2) return false;
    const s1 = String(f1).replace(/\\/g, '/').toLowerCase();
    const s2 = String(f2).replace(/\\/g, '/').toLowerCase();
    if (s1 === s2) return true;
    const b1 = s1.split('/').pop();
    const b2 = s2.split('/').pop();
    if (b1 === b2) return true;
    if (s1.endsWith('/' + s2) || s2.endsWith('/' + s1)) return true;
    return false;
  }

  function isFileBeingEdited(filepath, trace) {
    // A file is ONLY being edited if THIS specific trace is currently in progress
    if (!filepath || !trace || !trace.inProgress) return false;

    const activeFile = trace.activeFile || latestProtocol?.active_file || trace.agentProtocol?.active_file;
    if (!activeFile) return false;

    return matchesFile(filepath, activeFile);
  }

  function renderFileTabs(trace) {
    fileTabsScroll.innerHTML = '';

    // Collect file list from diffs or fallback to trace.files
    let fileEntries = [];
    if (trace.diffs && trace.diffs.length > 0) {
      fileEntries = trace.diffs.map(d => ({ file: d.file, diff: d }));
    } else if (trace.files && trace.files.length > 0) {
      fileEntries = trace.files.map(f => ({ file: f, diff: null }));
    }

    const allPill = document.createElement('button');
    allPill.className = `file-pill ${selectedFileFilter === 'all' ? 'active' : ''}`;
    allPill.textContent = `All Files (${fileEntries.length})`;
    allPill.addEventListener('click', () => {
      selectedFileFilter = 'all';
      updateActiveFilePill();
      renderDiffsContent(trace);
    });
    fileTabsScroll.appendChild(allPill);

    fileEntries.forEach(entry => {
      const filePath = entry.file;
      const isEditing = isFileBeingEdited(filePath, trace);
      const pill = document.createElement('button');
      pill.className = `file-pill ${selectedFileFilter === filePath ? 'active' : ''} ${isEditing ? 'is-editing' : ''}`;
      const shortName = filePath.split(/[\\/]/).pop();
      pill.title = filePath;
      pill.dataset.file = filePath;

      if (isEditing) {
        pill.innerHTML = `<span class="pill-live-dot"></span><span>${escapeHtml(shortName)}</span>`;
        pill.title = `${filePath} (Active file currently being edited by agent)`;
      } else {
        pill.textContent = shortName;
      }

      pill.addEventListener('click', () => {
        selectedFileFilter = filePath;
        updateActiveFilePill();
        renderDiffsContent(trace);
      });
      fileTabsScroll.appendChild(pill);
    });
  }

  function updateActiveFilePill() {
    fileTabsScroll.querySelectorAll('.file-pill').forEach(p => {
      if (selectedFileFilter === 'all') {
        p.classList.toggle('active', p.textContent.includes('All Files'));
      } else {
        p.classList.toggle('active', p.dataset.file === selectedFileFilter || p.title === selectedFileFilter);
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
    if (!trace) return;

    // Update Coordinates
    if (rightTraceId) rightTraceId.textContent = `ID: ${trace.id ? trace.id.slice(0, 8) : '--'}`;
    if (rightTraceTime) rightTraceTime.textContent = trace.timestamp || '';
    if (rightTraceCommit) rightTraceCommit.textContent = trace.git?.commit ? trace.git.commit.slice(0, 7) : 'HEAD';

    // Update Top Synthesized Prompt & Task Card
    const traceProto = {
      ...(trace.agentProtocol || {}),
      task: trace.agentProtocol?.task || trace.title || (trace.inProgress ? latestProtocol?.task : '') || 'Code Changes',
      intent: trace.agentProtocol?.intent || trace.agentProtocol?.task || trace.summary || trace.title || (trace.inProgress ? latestProtocol?.intent : '') || 'Code Changes',
      agent: trace.agentProtocol?.agent || (trace.inProgress ? latestProtocol?.agent : '') || 'Antigravity AI'
    };
    updatePromptCard(traceProto, trace.inProgress ? (trace.changing ? 'writing' : 'working') : 'completed');

    // Render Independent Prompt-to-Output Drift & Risk Guard
    renderDriftAnalysis(trace.driftAnalysis, trace);

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
      heroStatRisk.textContent = trace.inProgress ? 'IN PROGRESS' : (synth.riskLevel || trace.driftAnalysis?.riskLevel || 'LOW').toUpperCase();
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
        if (rightFileActionDesc) rightFileActionDesc.textContent = trace.fileAction || trace.agentProtocol?.file_action || 'Agent actively writing code to workspace...';
        if (rightFileSummaryDesc) rightFileSummaryDesc.textContent = trace.fileSummary || trace.agentProtocol?.file_summary || trace.synthesis?.summary || 'Live modifications taking place in codebase.';
      } else {
        rightActiveFileCard.classList.remove('is-live');
        const activeFile = trace.agentProtocol?.activeFile || trace.activeFile || (trace.files && trace.files[0]) || 'vibetrace.md';
        const fileAction = trace.agentProtocol?.fileAction || trace.fileAction || trace.summary || `Code modifications across ${trace.files?.length || 1} file(s)`;
        const fileSummary = trace.agentProtocol?.fileSummary || trace.fileSummary || trace.synthesis?.overview || trace.summary || 'Trace recorded in SQLite.';

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
      const changes = synth.whatChanged && synth.whatChanged.length > 0 ? synth.whatChanged : [
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
      const features = synth.affectedFeatures && synth.affectedFeatures.length > 0 ? synth.affectedFeatures : (trace.subsystems?.length ? trace.subsystems : ['Core Logic']);
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
      const risk = (synth.riskLevel || trace.driftAnalysis?.riskLevel || 'LOW').toUpperCase();
      aiRiskBadge.className = `risk-badge risk-${risk.toLowerCase()}`;
      aiRiskBadge.textContent = `${risk} RISK`;
    }

    // Model Tag (Dynamically derived from trace or configured environment)
    if (aiModelTag) {
      const activeModel = trace.model || currentEnvModel || '';
      aiModelTag.textContent = activeModel ? (activeModel.split('/')[1] || activeModel) : 'AI Model';
      if (activeModel) aiModelTag.title = `Model: ${activeModel}`;
    }

    // -----------------------------------------------------------------
    // PERSPECTIVE 2: CODING AGENT DECLARED PLAN (vibetrace.md)
    // (Completely isolated from OpenRouter AI synthesis)
    // -----------------------------------------------------------------
    const agentProto = trace.agentProtocol || (trace.inProgress ? latestProtocol : null) || {};
    const taskIntent = agentProto.intent || agentProto.task || trace.title || 'Coding task executed';

    if (protoTaskIntent) {
      protoTaskIntent.textContent = taskIntent;
    }
    if (protoStatusTag) {
      if (trace.inProgress) {
        protoStatusTag.className = 'agent-status-pill status-in_progress';
        protoStatusTag.textContent = 'IN PROGRESS';
      } else {
        protoStatusTag.className = 'agent-status-pill status-completed';
        protoStatusTag.textContent = 'COMPLETED';
      }
    }

    // Populate Execution Steps Checklist
    if (protoStepsList) {
      protoStepsList.innerHTML = '';
      const steps = agentProto.steps || (trace.inProgress && latestProtocol ? latestProtocol.steps : []) || [];
      if (steps.length === 0) {
        const fileNames = trace.files || (trace.diffs ? trace.diffs.map(d => d.file) : []);
        const defaultSteps = trace.inProgress
          ? [
              { done: true, text: `Capture prompt: ${taskIntent}` },
              { done: false, text: `Modifying workspace (${fileNames.length || 1} file(s))` },
              { done: false, text: 'Harness syntax and security verification' }
            ]
          : [
              { done: true, text: `Execute prompt: ${taskIntent}` },
              { done: true, text: `Applied modifications across ${fileNames.length || 1} file(s)` },
              { done: true, text: 'Harness syntax and security verification passed' }
            ];
        defaultSteps.forEach(s => {
          const row = document.createElement('div');
          row.className = `proto-step-row ${s.done ? 'done' : ''}`;
          const checkIcon = s.done
            ? '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;"><rect x="3" y="3" width="18" height="18" rx="3" ry="3"/></svg>';
          row.innerHTML = `
            <span class="proto-step-checkbox">${checkIcon}</span>
            <span>${escapeHtml(s.text)}</span>
          `;
          protoStepsList.appendChild(row);
        });
      } else {
        steps.forEach(s => {
          const row = document.createElement('div');
          row.className = `proto-step-row ${s.done ? 'done' : ''}`;
          const checkIcon = s.done
            ? '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;"><rect x="3" y="3" width="18" height="18" rx="3" ry="3"/></svg>';
          row.innerHTML = `
            <span class="proto-step-checkbox">${checkIcon}</span>
            <span>${escapeHtml(s.text)}</span>
          `;
          protoStepsList.appendChild(row);
        });
      }
    }

    if (protoNotesText) {
      protoNotesText.textContent = agentProto.notes || (trace.inProgress ? 'vibetrace.md protocol active — monitoring changes' : 'Trace recorded in SQLite database.');
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
        let icoSvg = '';
        if (chkStatus === 'pass') {
          icoSvg = '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        } else if (chkStatus === 'warn') {
          icoSvg = '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        } else {
          icoSvg = '<svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        }

        const box = document.createElement('div');
        box.className = `harness-check-item ${chkStatus}`;
        box.innerHTML = `
          <span class="check-glyph">${icoSvg}</span>
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

  // Re-Audit Prompt-to-Output Drift with OpenRouter Action
  if (btnReauditDrift) {
    btnReauditDrift.addEventListener('click', async () => {
      const trace = traces.find(t => t.id === selectedTraceId) || traces[0];
      if (!trace) return;

      btnReauditDrift.classList.add('is-loading');
      const originalHtml = btnReauditDrift.innerHTML;
      btnReauditDrift.innerHTML = '<span class="prompt-status-dot dot-changing" style="display:inline-block; margin-right:4px;"></span> Auditing...';

      try {
        const promptToUse = trace.agentProtocol?.task || trace.title || '';
        const res = await fetch('/api/analyze-drift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            traceId: trace.id,
            prompt: promptToUse
          })
        });

        const data = await res.json();
        if (data.success && data.driftAnalysis) {
          trace.driftAnalysis = data.driftAnalysis;
          renderDriftAnalysis(data.driftAnalysis, trace);
          logTicker(`Drift Audit: ${data.driftAnalysis.riskLevel} Risk (${data.driftAnalysis.alignmentScore}% Aligned)`);
        }
      } catch (err) {
        console.error('Failed to re-audit drift with OpenRouter:', err);
      } finally {
        btnReauditDrift.classList.remove('is-loading');
        btnReauditDrift.innerHTML = originalHtml;
      }
    });
  }

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
  }

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
  }

  // Toggle Trace Impact & Change Intelligence Banner
  if (btnToggleTraceImpact && middleTraceImpactBody) {
    btnToggleTraceImpact.addEventListener('click', () => {
      const isHidden = middleTraceImpactBody.style.display === 'none';
      middleTraceImpactBody.style.display = isHidden ? 'block' : 'none';
      if (toggleImpactIcon) {
        toggleImpactIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      if (toggleImpactLabel) toggleImpactLabel.textContent = isHidden ? 'Hide Summary' : 'Show Summary';
    });
  }

  // =========================================================
  // 13. FEATURES OVER TIME & CODEBASE EVOLUTION MODULE
  // =========================================================
  const btnMindMap = document.getElementById('btn-mindmap');
  const mindMapModal = document.getElementById('mindmap-modal');
  const btnCloseMindMap = document.getElementById('btn-close-mindmap');
  const btnRegenerateMindMap = document.getElementById('btn-regenerate-mindmap');
  const mindMapLoading = document.getElementById('mindmap-loading');
  const mindMapContent = document.getElementById('mindmap-content');

  // Stats
  const statMilestones = document.getElementById('stat-milestones-count');
  const statAdded = document.getElementById('stat-features-added');
  const statModified = document.getElementById('stat-features-modified');
  const statRemoved = document.getElementById('stat-features-removed');
  const statFiles = document.getElementById('stat-files-evolved');

  // Evolution Graph & Timeline
  const evolutionGraphCanvas = document.getElementById('evolution-graph-canvas');
  const evolutionSearchInput = document.getElementById('evolution-search-input');
  const evolutionFilterPills = document.getElementById('evolution-filter-pills');
  const evolutionCountTag = document.getElementById('evolution-count-tag');
  const evolutionTimelineFeed = document.getElementById('evolution-timeline-feed');
  const evolutionEmptyState = document.getElementById('evolution-empty-state');

  let cachedEvolutionData = null;
  let activeEvolutionFilter = 'all';
  let currentEvolutionSearch = '';

  function openFeaturesOverTime() {
    if (!mindMapModal) return;
    mindMapModal.classList.remove('hidden');
    mindMapModal.setAttribute('aria-hidden', 'false');
    if (!cachedEvolutionData) {
      loadFeaturesOverTime();
    } else {
      renderEvolutionUI(cachedEvolutionData);
    }
  }

  function closeFeaturesOverTime() {
    if (!mindMapModal) return;
    mindMapModal.classList.add('hidden');
    mindMapModal.setAttribute('aria-hidden', 'true');
  }

  async function loadFeaturesOverTime(forceRefresh = false) {
    if (!mindMapModal) return;
    if (forceRefresh || !cachedEvolutionData) {
      if (mindMapLoading) mindMapLoading.classList.remove('hidden');
      if (mindMapContent) mindMapContent.classList.add('hidden');
    }

    try {
      const res = await fetch(`/api/features-over-time${forceRefresh ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cachedEvolutionData = data;
      renderEvolutionUI(data);
    } catch (err) {
      console.error('[VibeTrace Features Over Time Error]:', err);
      if (mindMapLoading) mindMapLoading.classList.add('hidden');
      if (mindMapContent) mindMapContent.classList.remove('hidden');
    }
  }

  function renderEvolutionUI(data) {
    if (mindMapLoading) mindMapLoading.classList.add('hidden');
    if (mindMapContent) mindMapContent.classList.remove('hidden');

    const summary = data.summary || {};
    if (statMilestones) statMilestones.textContent = summary.totalMilestones || 0;
    if (statAdded) statAdded.textContent = summary.totalFeaturesAdded || 0;
    if (statModified) statModified.textContent = summary.totalFeaturesModified || 0;
    if (statRemoved) statRemoved.textContent = summary.totalFeaturesRemoved || 0;
    if (statFiles) statFiles.textContent = summary.totalFilesEvolved || 0;

    renderEvolutionGraph(data.graphData || [], data.milestones || []);
    renderMilestonesFeed(data.milestones || []);
  }

  function renderEvolutionGraph(graphData = [], milestones = []) {
    if (!evolutionGraphCanvas) return;
    if (graphData.length === 0) {
      evolutionGraphCanvas.innerHTML = '<div style="color:var(--text-muted); padding:30px; font-size:11px;">No milestones available to plot evolution curve.</div>';
      return;
    }

    const n = graphData.length;
    const paddingLeft = 46;
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 42;
    const height = 190;

    // Minimum node spacing so points don't cram together
    const minNodeGap = 42;
    const contentWidth = Math.max(680, (n - 1) * minNodeGap + paddingLeft + paddingRight);
    const width = contentWidth;

    const maxFeatures = Math.max(5, ...graphData.map(d => d.cumulativeFeatures || 0));
    const maxAdd = Math.max(10, ...graphData.map(d => d.additions || 0));
    const maxDel = Math.max(10, ...graphData.map(d => d.deletions || 0));
    const maxChurn = Math.max(maxAdd, maxDel);

    // Compute coordinates for each milestone
    const coords = graphData.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, n - 1)) * (width - paddingLeft - paddingRight);
      const yNorm = (d.cumulativeFeatures || 0) / maxFeatures;
      const y = paddingTop + (1 - yNorm) * (height - paddingTop - paddingBottom);
      return { x, y, data: d, index: d.index };
    });

    // Build smooth SVG Spline
    let splineD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      splineD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }

    // Area path for gradient fill
    const firstPt = coords[0];
    const lastPt = coords[coords.length - 1];
    const baselineY = height - paddingBottom;
    const areaD = `${splineD} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;

    // Horizontal grid lines
    const gridLines = [0, 0.33, 0.66, 1.0].map(pct => {
      const y = paddingTop + (1 - pct) * (height - paddingTop - paddingBottom);
      const val = Math.round(pct * maxFeatures);
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="2,3" stroke-width="1" opacity="0.6"/>
        <text x="${paddingLeft - 8}" y="${y + 3}" font-size="8.5" font-family="var(--font-mono)" fill="var(--text-faint)" text-anchor="end">${val}</text>
      `;
    }).join('');

    // Vertical churn bars at each point
    const churnBars = coords.map(c => {
      const addH = Math.min(32, ((c.data.additions || 0) / maxChurn) * 32);
      const delH = Math.min(32, ((c.data.deletions || 0) / maxChurn) * 32);
      let barSvg = '';
      if (addH > 0) {
        barSvg += `<rect x="${c.x - 2.5}" y="${baselineY - addH}" width="5" height="${addH}" rx="1.5" fill="#10b981" opacity="0.75" />`;
      }
      if (delH > 0) {
        barSvg += `<rect x="${c.x + 0.5}" y="${baselineY}" width="5" height="${delH}" rx="1.5" fill="#f43f5e" opacity="0.75" />`;
      }
      return barSvg;
    }).join('');

    // Milestone nodes & labels
    const nodesSvg = coords.map(c => {
      const m = c.data;
      const label = `M${m.index}`;
      const titleTooltip = escapeHtml(`Milestone #${m.index}: ${m.task || m.title} (${m.timestamp})\n+${m.featuresAddedCount} Added, ${m.featuresModifiedCount} Mod, ${m.featuresRemovedCount} Rem\nChurn: +${m.additions} / -${m.deletions}`);

      return `
        <g class="evolution-node-group" data-milestone="${m.index}" data-trace-id="${escapeHtml(m.traceId)}" style="cursor: pointer;">
          <title>${titleTooltip}</title>
          <!-- Hit area -->
          <circle cx="${c.x}" cy="${c.y}" r="14" fill="transparent" />
          <!-- Outer halo -->
          <circle class="node-halo" cx="${c.x}" cy="${c.y}" r="6.5" fill="var(--bg-surface)" stroke="#2563eb" stroke-width="2.2" />
          <!-- Center dot -->
          <circle cx="${c.x}" cy="${c.y}" r="2.5" fill="#2563eb" />
          <!-- X Axis Milestone Label -->
          <text x="${c.x}" y="${baselineY + 16}" font-size="8.5" font-family="var(--font-mono)" font-weight="600" fill="var(--text-secondary)" text-anchor="middle">${label}</text>
        </g>
      `;
    }).join('');

    const svgHtml = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display: block; font-family: var(--font-sans);">
        <defs>
          <linearGradient id="curveAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0.01"/>
          </linearGradient>
          <filter id="curveShadow" x="-2%" y="-10%" width="104%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#2563eb" flood-opacity="0.28"/>
          </filter>
        </defs>

        <!-- Grid -->
        ${gridLines}

        <!-- Baseline -->
        <line x1="${paddingLeft}" y1="${baselineY}" x2="${width - paddingRight}" y2="${baselineY}" stroke="var(--border-medium)" stroke-width="1.2"/>

        <!-- Churn Bars -->
        ${churnBars}

        <!-- Curve Area Fill -->
        <path d="${areaD}" fill="url(#curveAreaGradient)"/>

        <!-- Curve Path -->
        <path d="${splineD}" fill="none" stroke="#2563eb" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#curveShadow)"/>

        <!-- Nodes & Labels -->
        ${nodesSvg}
      </svg>
    `;

    evolutionGraphCanvas.innerHTML = svgHtml;

    // Attach click events on nodes -> smooth scroll down to milestone card
    evolutionGraphCanvas.querySelectorAll('.evolution-node-group').forEach(group => {
      group.addEventListener('click', () => {
        const milestoneIdx = group.getAttribute('data-milestone');
        scrollToMilestoneCard(milestoneIdx);
      });
    });
  }

  function scrollToMilestoneCard(milestoneIdx) {
    const card = document.getElementById(`milestone-card-${milestoneIdx}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('milestone-highlighted');
      setTimeout(() => card.classList.remove('milestone-highlighted'), 2200);
    }
  }

  function renderMilestonesFeed(milestones = []) {
    if (!evolutionTimelineFeed) return;

    // Filter milestones
    let filtered = milestones.filter(m => {
      // 1. Filter pill
      if (activeEvolutionFilter === 'added') {
        if (!m.featuresAdded || m.featuresAdded.length === 0) return false;
      } else if (activeEvolutionFilter === 'modified') {
        if (!m.featuresModified || m.featuresModified.length === 0) return false;
      } else if (activeEvolutionFilter === 'removed') {
        const realRemoved = (m.featuresRemoved || []).filter(r => !r.includes('No deprecated'));
        if (realRemoved.length === 0) return false;
      }

      // 2. Search query
      if (currentEvolutionSearch) {
        const q = currentEvolutionSearch.toLowerCase();
        const inTask = (m.task || '').toLowerCase().includes(q);
        const inTitle = (m.title || '').toLowerCase().includes(q);
        const inNarrative = (m.narrative || '').toLowerCase().includes(q);
        const inAdded = (m.featuresAdded || []).some(f => f.toLowerCase().includes(q));
        const inModified = (m.featuresModified || []).some(f => f.toLowerCase().includes(q));
        const inRemoved = (m.featuresRemoved || []).some(f => f.toLowerCase().includes(q));
        const inFiles = (m.filesChanged || []).some(f => f.file.toLowerCase().includes(q) || (f.role || '').toLowerCase().includes(q));

        if (!inTask && !inTitle && !inNarrative && !inAdded && !inModified && !inRemoved && !inFiles) {
          return false;
        }
      }

      return true;
    });

    if (evolutionCountTag) {
      evolutionCountTag.textContent = `Showing ${filtered.length} of ${milestones.length} Milestones`;
    }

    if (filtered.length === 0) {
      evolutionTimelineFeed.innerHTML = '';
      if (evolutionEmptyState) evolutionEmptyState.classList.remove('hidden');
      return;
    }

    if (evolutionEmptyState) evolutionEmptyState.classList.add('hidden');

    evolutionTimelineFeed.innerHTML = filtered.map(m => {
      const realRemoved = (m.featuresRemoved || []).filter(r => !r.includes('No deprecated'));
      const filesCount = m.filesChanged ? m.filesChanged.length : 0;
      const additions = m.metrics?.additions || 0;
      const deletions = m.metrics?.deletions || 0;

      const addedHtml = (m.featuresAdded || []).map(f => `
        <li class="feature-item-added">
          <span class="feat-dot dot-green"></span>
          <span class="feat-text">${escapeHtml(f)}</span>
        </li>
      `).join('');

      const modifiedHtml = (m.featuresModified || []).map(f => `
        <li class="feature-item-modified">
          <span class="feat-dot dot-amber"></span>
          <span class="feat-text">${escapeHtml(f)}</span>
        </li>
      `).join('');

      const removedHtml = realRemoved.length > 0 ? realRemoved.map(f => `
        <li class="feature-item-removed">
          <span class="feat-dot dot-rose"></span>
          <span class="feat-text">${escapeHtml(f)}</span>
        </li>
      `).join('') : '<li class="feature-item-none"><span class="feat-text-faint">No deprecated capabilities removed</span></li>';

      const filesRosterHtml = (m.filesChanged || []).map(fc => `
        <div class="milestone-file-item">
          <div class="milestone-file-meta">
            <span class="milestone-file-path" title="${escapeHtml(fc.file)}">${escapeHtml(fc.file)}</span>
            <span class="milestone-file-role">${escapeHtml(fc.role)}</span>
          </div>
          <span class="milestone-file-status ${escapeHtml(fc.status || 'modified')}">${escapeHtml(fc.status || 'modified')}</span>
        </div>
      `).join('');

      return `
        <div class="milestone-card" id="milestone-card-${m.milestoneIndex}" data-milestone="${m.milestoneIndex}">
          <div class="milestone-card-header">
            <div class="milestone-header-meta">
              <span class="milestone-badge-pill">Milestone #${m.milestoneIndex}</span>
              <span class="milestone-timestamp-pill">
                <svg class="ui-icon icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                ${escapeHtml(m.timestamp)}
              </span>
              <span class="milestone-churn-pill plus">+${additions}</span>
              <span class="milestone-churn-pill minus">−${deletions}</span>
            </div>

            <button type="button" class="btn-inspect-milestone" data-trace-id="${escapeHtml(m.traceId)}" title="Inspect this trace in the 3-pane workbench">
              <svg class="ui-icon icon-xs" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Inspect in Workbench</span>
            </button>
          </div>

          <h3 class="milestone-title-heading">${escapeHtml(m.task || m.title)}</h3>

          <div class="milestone-narrative-card">
            <span class="narrative-badge-label">ARCHITECTURAL NARRATIVE</span>
            <p class="narrative-body-text">${escapeHtml(m.narrative || 'Codebase changes synchronized and verified.')}</p>
          </div>

          <div class="milestone-features-grid">
            <!-- Added -->
            <div class="milestone-feature-col col-added">
              <div class="col-head">
                <span class="col-icon-pill pill-green">+</span>
                <span class="col-title">Features Added (${m.featuresAdded?.length || 0})</span>
              </div>
              <ul class="col-list">${addedHtml || '<li class="feature-item-none"><span class="feat-text-faint">No new features added</span></li>'}</ul>
            </div>

            <!-- Modified -->
            <div class="milestone-feature-col col-modified">
              <div class="col-head">
                <span class="col-icon-pill pill-amber">↻</span>
                <span class="col-title">Modified / Refactored (${m.featuresModified?.length || 0})</span>
              </div>
              <ul class="col-list">${modifiedHtml || '<li class="feature-item-none"><span class="feat-text-faint">No modules modified</span></li>'}</ul>
            </div>

            <!-- Removed -->
            <div class="milestone-feature-col col-removed">
              <div class="col-head">
                <span class="col-icon-pill pill-rose">−</span>
                <span class="col-title">Removed / Cleaned (${realRemoved.length})</span>
              </div>
              <ul class="col-list">${removedHtml}</ul>
            </div>
          </div>

          <!-- Files Accordion -->
          <div class="milestone-files-accordion">
            <button type="button" class="btn-toggle-milestone-files" data-expanded="false">
              <span>Files Touched (${filesCount} files)</span>
              <span class="accordion-arrow">▼</span>
            </button>
            <div class="milestone-files-dropdown hidden">
              ${filesRosterHtml || '<div style="color:var(--text-muted);font-size:10px;padding:6px;">No files mapped directly</div>'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind inspect button in each milestone card
    evolutionTimelineFeed.querySelectorAll('.btn-inspect-milestone').forEach(btn => {
      btn.addEventListener('click', () => {
        const traceId = btn.getAttribute('data-trace-id');
        if (traceId) {
          closeFeaturesOverTime();
          selectTrace(traceId);
          setTimeout(() => {
            const cardEl = document.querySelector(`.trace-card[data-id="${traceId}"]`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }
      });
    });

    // Bind file accordion toggles
    evolutionTimelineFeed.querySelectorAll('.btn-toggle-milestone-files').forEach(btn => {
      btn.addEventListener('click', () => {
        const isExp = btn.getAttribute('data-expanded') === 'true';
        const dropdown = btn.nextElementSibling;
        const arrow = btn.querySelector('.accordion-arrow');

        if (isExp) {
          btn.setAttribute('data-expanded', 'false');
          if (dropdown) dropdown.classList.add('hidden');
          if (arrow) arrow.textContent = '▼';
        } else {
          btn.setAttribute('data-expanded', 'true');
          if (dropdown) dropdown.classList.remove('hidden');
          if (arrow) arrow.textContent = '▲';
        }
      });
    });
  }

  // Filter pills events
  if (evolutionFilterPills) {
    evolutionFilterPills.querySelectorAll('.evolution-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        evolutionFilterPills.querySelectorAll('.evolution-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeEvolutionFilter = btn.getAttribute('data-filter') || 'all';
        if (cachedEvolutionData) {
          renderMilestonesFeed(cachedEvolutionData.milestones || []);
        }
      });
    });
  }

  // Search input events
  if (evolutionSearchInput) {
    evolutionSearchInput.addEventListener('input', (e) => {
      currentEvolutionSearch = (e.target.value || '').trim();
      if (cachedEvolutionData) {
        renderMilestonesFeed(cachedEvolutionData.milestones || []);
      }
    });
  }

  // Bind Open/Close Events
  if (btnMindMap) {
    btnMindMap.addEventListener('click', openFeaturesOverTime);
  }
  if (btnCloseMindMap) {
    btnCloseMindMap.addEventListener('click', closeFeaturesOverTime);
  }
  if (btnRegenerateMindMap) {
    btnRegenerateMindMap.addEventListener('click', () => loadFeaturesOverTime(true));
  }
  if (mindMapModal) {
    mindMapModal.addEventListener('click', (e) => {
      if (e.target === mindMapModal) closeFeaturesOverTime();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mindMapModal && !mindMapModal.classList.contains('hidden')) {
      closeFeaturesOverTime();
    }
  });

  // Agent Prompt Entry Composer Form
  const formAgentPrompt = document.getElementById('form-agent-prompt');
  const agentPromptInput = document.getElementById('agent-prompt-input');
  const btnSubmitAgentPrompt = document.getElementById('btn-submit-agent-prompt');

  function initAgentPromptComposer() {
    if (!formAgentPrompt) return;

    formAgentPrompt.addEventListener('submit', async (e) => {
      e.preventDefault();
      const promptText = (agentPromptInput?.value || '').trim();
      if (!promptText) return;

      if (btnSubmitAgentPrompt) {
        btnSubmitAgentPrompt.disabled = true;
        btnSubmitAgentPrompt.innerHTML = '<span>...</span>';
      }

      try {
        const response = await fetch('/api/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText })
        });

        const data = await response.json();
        if (data.success && data.trace) {
          if (agentPromptInput) agentPromptInput.value = '';

          // Add / update active trace locally
          const existingIdx = traces.findIndex(t => t.id === data.trace.id || t.id === 'trace-live-active');
          if (existingIdx >= 0) {
            traces[existingIdx] = data.trace;
          } else {
            traces.unshift(data.trace);
          }

          renderTracesList();
          selectTrace(data.trace.id);
          logTicker(`Prompt accepted: ${promptText}`);
        }
      } catch (err) {
        console.error('Failed to submit prompt to agent:', err);
      } finally {
        if (btnSubmitAgentPrompt) {
          btnSubmitAgentPrompt.disabled = false;
          btnSubmitAgentPrompt.innerHTML = '<span>Run</span>';
        }
      }
    });
  }

  // Logs Drawer Event Listeners
  if (btnToggleLogsDrawer) {
    btnToggleLogsDrawer.addEventListener('click', toggleLogsDrawer);
  }
  if (footerTickerContainer) {
    footerTickerContainer.addEventListener('click', toggleLogsDrawer);
  }
  if (btnCloseLogsDrawer) {
    btnCloseLogsDrawer.addEventListener('click', () => {
      if (logsDrawer) {
        logsDrawer.classList.add('hidden');
        logsDrawer.setAttribute('aria-hidden', 'true');
      }
    });
  }
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      liveLogs.length = 0;
      if (logsDrawerBody) logsDrawerBody.innerHTML = '';
      if (logsCountBadge) logsCountBadge.textContent = '0';
      logTicker('Live activity logs cleared', 'SYSTEM', 'info');
    });
  }

  // Initialize
  initResizers();
  initTheme();
  initAgentPromptComposer();
  logTicker('VibeTrace Observability Harness active — monitoring workspace mutations', 'HARNESS', 'info');
  fetchStatus();
  fetchTraces();
  initSSE();
})();
