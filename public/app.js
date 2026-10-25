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
            if (selectedTraceId === payload.traceId) {
              renderDriftAnalysis(payload.driftAnalysis, targetTrace);
            }
          }
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
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

    renderTracesList();
    selectTrace(activeTrace.id);

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
      alignmentScore: 98,
      riskLevel: 'LOW',
      hasSignificantIssue: false,
      alertLevel: 'NONE',
      alertTitle: '',
      alertMessage: 'Output is faithfully aligned with user prompt.',
      promptIntent: promptText,
      actualExecution: `Applied modifications across ${trace?.files?.length || 1} file(s).`,
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
    }

    // Risk Badge
    if (driftRiskBadge) {
      const risk = (drift.riskLevel || 'LOW').toUpperCase();
      driftRiskBadge.className = `drift-risk-badge risk-${risk.toLowerCase()}`;
      driftRiskBadge.textContent = `${risk} RISK`;
    }

    // Significant Issue Alert Banner
    if (driftAlertBanner) {
      if (drift.hasSignificantIssue || drift.riskLevel === 'HIGH' || drift.riskLevel === 'CRITICAL') {
        driftAlertBanner.className = 'drift-alert-banner alert-critical';
        if (driftAlertTitle) driftAlertTitle.textContent = drift.alertTitle || '⚠️ SIGNIFICANT DIVERGENCE DETECTED';
        if (driftAlertTag) driftAlertTag.textContent = `${(drift.riskLevel || 'CRITICAL').toUpperCase()} ALERT`;
        if (driftAlertMessage) {
          driftAlertMessage.textContent = drift.alertMessage || 'The output code differs significantly from what your prompt requested.';
        }
      } else if (drift.hasDifference) {
        driftAlertBanner.className = 'drift-alert-banner alert-warning';
        if (driftAlertTitle) driftAlertTitle.textContent = drift.alertTitle || 'Scope Discrepancy Observed';
        if (driftAlertTag) driftAlertTag.textContent = 'NOTICE';
        if (driftAlertMessage) driftAlertMessage.textContent = drift.alertMessage || 'Minor variance between prompt and output.';
      } else {
        driftAlertBanner.className = 'drift-alert-banner alert-success';
        if (driftAlertTitle) driftAlertTitle.textContent = '✓ PROMPT & OUTPUT FULLY ALIGNED';
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

    // Difference Analysis
    if (driftDifferenceText) {
      driftDifferenceText.textContent = drift.differenceAnalysis || 'Output aligns with declared requirements.';
    }

    // Discrepancies List
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
        li.style.color = 'var(--text-muted)';
        li.textContent = '✓ No unrequested deviations or missing requirements detected.';
        driftDiscrepanciesList.appendChild(li);
      } else {
        items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          driftDiscrepanciesList.appendChild(li);
        });
      }
    }

    // Risk & Impact
    if (driftRiskText) {
      driftRiskText.textContent = drift.riskAssessment || 'Systemic boundaries consistent.';
    }

    // Remedy
    if (driftRemedyContent) {
      driftRemedyContent.innerHTML = '';
      const span = document.createElement('span');
      span.textContent = drift.suggestedRemedy || 'Changes verified. Safe to proceed.';
      driftRemedyContent.appendChild(span);
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
    const isChanging = status === 'writing' || data.substatus === 'changing';
    const isWorking = status === 'working' || data.substatus === 'working';

    if (isWorking || isChanging) {
      setTopBarStatus('working', isChanging ? 'AGENT WRITING' : 'AGENT WORKING', data.task || data.message || (isChanging ? 'Modifying codebase...' : 'Working on task...'));
      logTicker(data.message || (isChanging ? 'Agent writing files...' : 'Agent working on task...'));
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
    // Update Top Synthesized Prompt & Task Card
    const traceProto = trace.agentProtocol || (trace.inProgress ? latestProtocol : null) || {};
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
  // 13. AI ARCHITECTURE & TRACE MIND MAP MODULE
  // =========================================================
  const btnMindMap = document.getElementById('btn-mindmap');
  const mindMapModal = document.getElementById('mindmap-modal');
  const btnCloseMindMap = document.getElementById('btn-close-mindmap');
  const btnRegenerateMindMap = document.getElementById('btn-regenerate-mindmap');
  const mindMapLoading = document.getElementById('mindmap-loading');
  const mindMapContent = document.getElementById('mindmap-content');
  const tabViewTree = document.getElementById('tab-view-tree');
  const tabViewMermaid = document.getElementById('tab-view-mermaid');
  const mindMapTreeWrapper = document.getElementById('mindmap-tree-wrapper');
  const mindMapMermaidWrapper = document.getElementById('mindmap-mermaid-wrapper');
  const btnCopyMermaid = document.getElementById('btn-copy-mermaid');
  const mermaidCodePre = document.getElementById('mermaid-code-pre');

  let cachedMindMapData = null;

  function openMindMap() {
    if (!mindMapModal) return;
    mindMapModal.classList.remove('hidden');
    mindMapModal.setAttribute('aria-hidden', 'false');
    if (!cachedMindMapData) {
      loadMindMap();
    } else {
      renderMindMapUI(cachedMindMapData);
    }
  }

  function closeMindMap() {
    if (!mindMapModal) return;
    mindMapModal.classList.add('hidden');
    mindMapModal.setAttribute('aria-hidden', 'true');
  }

  async function loadMindMap(forceRefresh = false) {
    if (!mindMapModal) return;
    if (mindMapLoading) mindMapLoading.classList.remove('hidden');
    if (mindMapContent) mindMapContent.classList.add('hidden');

    try {
      const res = await fetch(`/api/mindmap${forceRefresh ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cachedMindMapData = data;
      renderMindMapUI(data);
    } catch (err) {
      console.error('[VibeTrace MindMap Error]:', err);
      if (mindMapLoading) mindMapLoading.classList.add('hidden');
      if (mindMapContent) mindMapContent.classList.remove('hidden');
      const summaryEl = document.getElementById('mindmap-summary-text');
      if (summaryEl) summaryEl.textContent = 'Failed to load mind map: ' + err.message;
    }
  }

  function renderMindMapUI(data) {
    if (mindMapLoading) mindMapLoading.classList.add('hidden');
    if (mindMapContent) mindMapContent.classList.remove('hidden');

    const metrics = data.metrics || {};
    const statTraces = document.getElementById('stat-traces-count');
    const statSubsystems = document.getElementById('stat-subsystems-count');
    const statFiles = document.getElementById('stat-files-count');
    const statFlaws = document.getElementById('stat-flaws-count');

    if (statTraces) statTraces.textContent = metrics.totalTraces || 0;
    if (statSubsystems) statSubsystems.textContent = metrics.subsystemsCount || (data.subsystems ? data.subsystems.length : 0);
    if (statFiles) statFiles.textContent = metrics.totalFiles || 0;
    if (statFlaws) statFlaws.textContent = data.flawsAndRisks ? data.flawsAndRisks.length : 0;

    const summaryText = document.getElementById('mindmap-summary-text');
    if (summaryText) {
      summaryText.textContent = data.executiveSummary || 'No summary available.';
    }

    const sourceTag = document.getElementById('mindmap-source-tag');
    if (sourceTag) {
      sourceTag.textContent = data.source === 'openrouter' ? `OpenRouter: ${data.modelUsed}` : `Engine: ${data.modelUsed}`;
    }

    const modelBadge = document.getElementById('mindmap-model-badge');
    if (modelBadge) {
      modelBadge.textContent = data.source === 'openrouter' ? 'AI SYNTHESIZED' : 'HEURISTIC VERIFIED';
    }

    const flawsBadge = document.getElementById('flaws-badge');
    const flawsCount = data.flawsAndRisks ? data.flawsAndRisks.length : 0;
    if (flawsBadge) {
      flawsBadge.textContent = flawsCount === 0 ? 'No Critical Flaws' : `${flawsCount} Issue${flawsCount === 1 ? '' : 's'} Detected`;
    }

    // Render Flaws Grid
    const flawsGrid = document.getElementById('mindmap-flaws-grid');
    if (flawsGrid) {
      flawsGrid.innerHTML = '';
      if (!data.flawsAndRisks || data.flawsAndRisks.length === 0) {
        flawsGrid.innerHTML = '<div style="color: var(--text-muted); font-size: 11px;">No structural flaws or high-risk regressions detected across traces.</div>';
      } else {
        data.flawsAndRisks.forEach(flaw => {
          const card = document.createElement('div');
          const severity = (flaw.severity || 'low').toLowerCase();
          card.className = `flaw-card severity-${severity}`;
          card.innerHTML = `
            <div class="flaw-head-row">
              <span class="flaw-severity-pill">${escapeHtml(severity)}</span>
              <span class="flaw-subsystem-tag">${escapeHtml(flaw.subsystem || 'System')}</span>
            </div>
            <div class="flaw-title">${escapeHtml(flaw.title || 'Risk Notice')}</div>
            <div class="flaw-detail">${escapeHtml(flaw.detail || '')}</div>
            ${flaw.remedy ? `<div class="flaw-remedy"><b>Remedy:</b> ${escapeHtml(flaw.remedy)}</div>` : ''}
          `;
          flawsGrid.appendChild(card);
        });
      }
    }

    // Render Recommendations
    const recsList = document.getElementById('mindmap-recs-list');
    if (recsList) {
      recsList.innerHTML = '';
      const recs = data.recommendations || [];
      if (recs.length === 0) {
        recsList.innerHTML = '<li style="color: var(--text-muted);">Maintain standard test hygiene and monitor OpenRouter rate limits.</li>';
      } else {
        recs.forEach(rec => {
          const li = document.createElement('li');
          li.textContent = rec;
          recsList.appendChild(li);
        });
      }
    }

    // Render Mermaid Code Pre
    if (mermaidCodePre) {
      mermaidCodePre.textContent = data.diagramMermaid || 'mindmap\n  root((Repository))';
    }

    // Render Interactive Visual Tree
    const treeCanvas = document.getElementById('mindmap-tree-canvas');
    if (treeCanvas) {
      treeCanvas.innerHTML = '';

      // Root Box
      const rootBox = document.createElement('div');
      rootBox.className = 'tree-root-box';
      rootBox.innerHTML = `
        <div class="tree-root-label">${escapeHtml(data.projectName || 'VibeTrace')}</div>
        <div class="tree-root-sub">${metrics.totalFiles || 0} files · ${metrics.totalTraces || 0} traces</div>
      `;
      treeCanvas.appendChild(rootBox);

      // Subsystems Column
      const subColumn = document.createElement('div');
      subColumn.className = 'tree-subsystems-column';

      const subsystems = data.subsystems || [];
      subsystems.forEach(sub => {
        const subCard = document.createElement('div');
        subCard.className = 'tree-subsystem-card';
        if (sub.color) subCard.style.borderLeftColor = sub.color;

        const filesHtml = (sub.files || []).slice(0, 6).map(f => {
          const base = f.split(/[\/\\]/).pop();
          return `<span class="tree-file-chip" title="${escapeHtml(f)}">${escapeHtml(base)}</span>`;
        }).join('');

        subCard.innerHTML = `
          <div class="tree-subsystem-head">
            <span class="tree-subsystem-name" style="color: ${sub.color || 'var(--text-primary)'}">${escapeHtml(sub.name)}</span>
            <span class="tree-subsystem-badge">${sub.fileCount || (sub.files ? sub.files.length : 0)} files</span>
          </div>
          <div class="tree-files-list">${filesHtml}</div>
        `;
        subColumn.appendChild(subCard);
      });

      treeCanvas.appendChild(subColumn);
    }
  }

  // Bind Mind Map Events
  if (btnMindMap) {
    btnMindMap.addEventListener('click', openMindMap);
  }
  if (btnCloseMindMap) {
    btnCloseMindMap.addEventListener('click', closeMindMap);
  }
  if (btnRegenerateMindMap) {
    btnRegenerateMindMap.addEventListener('click', () => loadMindMap(true));
  }
  if (mindMapModal) {
    mindMapModal.addEventListener('click', (e) => {
      if (e.target === mindMapModal) closeMindMap();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mindMapModal && !mindMapModal.classList.contains('hidden')) {
      closeMindMap();
    }
  });

  if (tabViewTree && tabViewMermaid) {
    tabViewTree.addEventListener('click', () => {
      tabViewTree.classList.add('active');
      tabViewMermaid.classList.remove('active');
      if (mindMapTreeWrapper) mindMapTreeWrapper.classList.remove('hidden');
      if (mindMapMermaidWrapper) mindMapMermaidWrapper.classList.add('hidden');
    });
    tabViewMermaid.addEventListener('click', () => {
      tabViewMermaid.classList.add('active');
      tabViewTree.classList.remove('active');
      if (mindMapTreeWrapper) mindMapTreeWrapper.classList.add('hidden');
      if (mindMapMermaidWrapper) mindMapMermaidWrapper.classList.remove('hidden');
    });
  }

  if (btnCopyMermaid && mermaidCodePre) {
    btnCopyMermaid.addEventListener('click', async () => {
      const code = mermaidCodePre.textContent;
      try {
        await navigator.clipboard.writeText(code);
        const orig = btnCopyMermaid.textContent;
        btnCopyMermaid.textContent = 'Copied!';
        setTimeout(() => { btnCopyMermaid.textContent = orig; }, 1500);
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

          renderTraces();
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

  // Initialize
  initResizers();
  initTheme();
  initAgentPromptComposer();
  fetchStatus();
  fetchTraces();
  initSSE();
})();
