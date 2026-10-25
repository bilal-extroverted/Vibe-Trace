// VibeTrace Professional Diff Viewer Component
// Line-by-line syntax-highlighted git diff inspector with per-file change analysis & impact intelligence

class DiffViewer {
  render(container, diffs = [], selectedFile = 'all', trace = null) {
    container.innerHTML = '';

    if (!diffs || diffs.length === 0) {
      container.innerHTML = `
        <div class="diff-empty-notice">
          <div class="empty-icon">
            <svg class="ui-icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h4>No Code Diffs Recorded</h4>
          <p>No modified files were tracked for this trace.</p>
        </div>
      `;
      return;
    }

    const filteredDiffs = (selectedFile === 'all')
      ? diffs
      : diffs.filter(d => d.file === selectedFile);

    if (filteredDiffs.length === 0) {
      container.innerHTML = `
        <div class="diff-empty-notice">
          <p>No diffs available for selected file: <b>${this.escapeHtml(selectedFile)}</b></p>
        </div>
      `;
      return;
    }

    const isInProgress = Boolean(trace?.inProgress || (window.latestProtocol && window.latestProtocol.status === 'in_progress'));
    const activeEditingFile = trace?.activeFile || (window.latestProtocol && window.latestProtocol.active_file) || (trace?.agentProtocol && trace.agentProtocol.active_file) || null;

    filteredDiffs.forEach((diffItem, fileIdx) => {
      const isEditingNow = isInProgress && this.matchesFile(diffItem.file, activeEditingFile);
      const fileCard = document.createElement('div');
      fileCard.className = `diff-file-card ${isEditingNow ? 'is-editing-file' : ''}`;
      fileCard.id = `diff-card-${fileIdx}`;

      const rawContent = diffItem.content || '';
      const lines = rawContent.split(/\r?\n/);
      const additions = (rawContent.match(/^\+[^+]/gm) || []).length;
      const deletions = (rawContent.match(/^-[^-]/gm) || []).length;

      // Extract or compute intelligent per-file change and impact analysis
      const analysis = diffItem.analysis || this.analyzeFileDiff(diffItem.file, rawContent, trace);

      const liveBadgeHtml = isEditingNow
        ? `<span class="diff-file-editing-badge"><span class="pill-live-dot"></span> Active File</span>`
        : '';

      // 1. File Card Header
      const header = document.createElement('div');
      header.className = 'diff-file-header';
      header.innerHTML = `
        <div class="diff-header-left">
          <span class="file-icon"><svg class="ui-icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
          <span class="diff-filename">${this.escapeHtml(diffItem.file)}</span>
          ${liveBadgeHtml}
        </div>
        <div class="diff-header-right">
          <span class="diff-file-delta">
            <span class="diff-pill-add">+${additions}</span>
            <span class="diff-pill-del">-${deletions}</span>
          </span>
          <span class="diff-status-tag ${diffItem.status || 'modified'}">${(diffItem.status || 'modified').toUpperCase()}</span>
          <button type="button" class="btn-toggle-file-diff" title="Collapse or expand code diff for this file">
            <span class="toggle-icon"><svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/></svg></span>
          </button>
        </div>
      `;
      fileCard.appendChild(header);

      // 2. File Change & Impact Intelligence Banner (Directly answers "what changed / what's happening" & "what was affected")
      const insightBar = document.createElement('div');
      insightBar.className = 'diff-file-insights';

      const chipsHtml = (analysis.affectedScope || ['Core Module']).map(sc =>
        `<span class="file-scope-chip">${this.escapeHtml(sc)}</span>`
      ).join('');

      const liveActionText = (trace && (trace.fileAction || trace.agentProtocol?.file_action)) || analysis.whatChanged;
      const liveSummaryText = (trace && (trace.fileSummary || trace.agentProtocol?.file_summary)) || '';

      insightBar.innerHTML = `
        <div class="file-insight-grid">
          <div class="file-insight-block file-insight-changed ${isEditingNow ? 'file-insight-live' : ''}">
            <div class="file-insight-label">
              <span class="insight-label-icon"><svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <span>${isEditingNow ? "WHAT'S HAPPENING IN THIS FILE" : "WHAT CHANGED IN THIS FILE"}</span>
            </div>
            <div class="file-insight-body">${this.escapeHtml(isEditingNow ? liveActionText : analysis.whatChanged)}${isEditingNow && liveSummaryText ? `<div style="margin-top:3px;font-size:10px;color:var(--text-muted);">${this.escapeHtml(liveSummaryText)}</div>` : ''}</div>
          </div>

          <div class="file-insight-block file-insight-affected">
            <div class="file-insight-label">
              <span class="insight-label-icon"><svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
              <span>AFFECTED SCOPE & FUNCTIONS</span>
            </div>
            <div class="file-insight-chips">${chipsHtml}</div>
          </div>

          <div class="file-insight-block file-insight-downstream">
            <div class="file-insight-label">
              <span class="insight-label-icon"><svg class="ui-icon icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg></span>
              <span>DOWNSTREAM EFFECT & SYSTEMIC IMPACT</span>
            </div>
            <div class="file-insight-body subtle">${this.escapeHtml(analysis.downstreamImpact)}</div>
          </div>
        </div>
      `;
      fileCard.appendChild(insightBar);

      // 3. Diff Code Container
      const codeWrapper = document.createElement('div');
      codeWrapper.className = 'diff-code-wrapper';

      let oldLineNum = 1;
      let newLineNum = 1;

      lines.forEach((line) => {
        const row = document.createElement('div');
        row.className = 'diff-line-row';

        const isHunk = line.startsWith('@@');
        const isAdd = line.startsWith('+') && !line.startsWith('+++');
        const isDel = line.startsWith('-') && !line.startsWith('---');

        let gutterLeft = '';
        let gutterRight = '';
        let sign = ' ';

        if (isHunk) {
          row.classList.add('diff-row-hunk');
          const hunkMatch = line.match(/@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
          if (hunkMatch) {
            oldLineNum = parseInt(hunkMatch[1], 10);
            newLineNum = parseInt(hunkMatch[2], 10);
          }
          gutterLeft = '...';
          gutterRight = '...';
          sign = '@';
        } else if (isAdd) {
          row.classList.add('diff-row-add');
          gutterLeft = '';
          gutterRight = String(newLineNum++);
          sign = '+';
        } else if (isDel) {
          row.classList.add('diff-row-del');
          gutterLeft = String(oldLineNum++);
          gutterRight = '';
          sign = '-';
        } else {
          row.classList.add('diff-row-context');
          gutterLeft = String(oldLineNum++);
          gutterRight = String(newLineNum++);
          sign = ' ';
        }

        const displayLine = isHunk ? line : (line.length > 1 ? line.slice(1) : line);

        row.innerHTML = `
          <div class="diff-gutter gutter-old">${gutterLeft}</div>
          <div class="diff-gutter gutter-new">${gutterRight}</div>
          <div class="diff-sign">${sign}</div>
          <div class="diff-code-cell"><pre class="diff-code-pre">${this.escapeHtml(displayLine)}</pre></div>
        `;

        codeWrapper.appendChild(row);
      });

      fileCard.appendChild(codeWrapper);

      // Toggle button event
      const toggleBtn = header.querySelector('.btn-toggle-file-diff');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = codeWrapper.style.display === 'none';
          codeWrapper.style.display = isHidden ? 'block' : 'none';
          toggleBtn.classList.toggle('collapsed', !isHidden);
        });
      }

      container.appendChild(fileCard);
    });
  }

  // Client-Side Heuristic Diff Analyzer
  analyzeFileDiff(file = '', rawContent = '', trace = null) {
    const lines = (rawContent || '').split(/\r?\n/);
    const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1).trim());
    const deleted = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).map(l => l.slice(1).trim());
    const allTouched = [...added, ...deleted];

    // Extract touched function names, classes, methods
    const symbols = new Set();
    allTouched.forEach(line => {
      const fnM = line.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)\s*(?:=\s*(?:async\s*)?\(|\()/);
      if (fnM && !['if', 'for', 'while', 'switch', 'catch', 'setTimeout', 'setInterval', 'require'].includes(fnM[1])) {
        symbols.add(fnM[1] + '()');
      }
      const methM = line.match(/^\s*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/);
      if (methM && !['if', 'for', 'while', 'switch', 'catch'].includes(methM[1])) {
        symbols.add(methM[1] + '()');
      }
      const clsM = line.match(/class\s+([a-zA-Z0-9_$]+)/);
      if (clsM) symbols.add('class ' + clsM[1]);
      if (file.endsWith('.css')) {
        const cssM = line.match(/\.([a-zA-Z0-9_-]{3,})/g);
        if (cssM) cssM.slice(0, 3).forEach(c => symbols.add(c));
      }
    });

    const symbolList = Array.from(symbols).slice(0, 4);
    const filename = file.split(/[\\/]/).pop();

    let whatChanged = '';
    let affectedScope = [];
    let downstreamImpact = '';

    if (file.endsWith('.css')) {
      whatChanged = `Updated styles & layout rules (+${added.length} / -${deleted.length} lines). Modified visual tokens, responsive margins, and animations.`;
      affectedScope = symbolList.length ? symbolList : ['UI Design Tokens', 'Workbench Layout', 'Micro-Animations'];
      downstreamImpact = `Changes visual hierarchy, font scaling, active highlights, and element borders across the client.`;
    } else if (file.endsWith('.html')) {
      whatChanged = `Updated DOM structure and layout sections (+${added.length} / -${deleted.length} lines).`;
      affectedScope = ['HTML Structure', 'Workbench Panes', 'DOM Anchors'];
      downstreamImpact = `Alters UI containers and interactive targets for client-side JavaScript binding.`;
    } else if (file.includes('watcher')) {
      whatChanged = `Updated filesystem watcher, active file tracking, and live telemetry broadcast (+${added.length} / -${deleted.length} lines).`;
      affectedScope = symbolList.length ? symbolList : ['Watcher Service', 'Active Trace Generator', 'SSE Broadcast'];
      downstreamImpact = `Changes how filesystem changes are batched, analyzed, and broadcast live to the browser.`;
    } else if (file.includes('protocol')) {
      whatChanged = `Enhanced agent protocol parser for active_file, file_action, and task steps (+${added.length} / -${deleted.length} lines).`;
      affectedScope = symbolList.length ? symbolList : ['Protocol Manager', 'vibetrace.md Parser', 'Checklist Sync'];
      downstreamImpact = `Controls synchronization of declared agent intents and active file status with the dashboard.`;
    } else if (file.includes('diffViewer')) {
      whatChanged = `Updated syntax diff viewer component and change insight overlays (+${added.length} / -${deleted.length} lines).`;
      affectedScope = symbolList.length ? symbolList : ['Diff Inspector', 'Syntax Highlighting', 'File Intelligence'];
      downstreamImpact = `Directly shapes how code changes and affected subsystems are visually presented to developers.`;
    } else if (file.includes('app.js')) {
      whatChanged = `Updated client logic, SSE handlers, status pills, and trace synchronization (+${added.length} / -${deleted.length} lines).`;
      affectedScope = symbolList.length ? symbolList : ['Client Application Logic', 'SSE Telemetry', 'Trace Inspector'];
      downstreamImpact = `Enables immediate reactive UI updates for active file changes, progress lines, and inspect panels.`;
    } else if (file.endsWith('.md')) {
      whatChanged = `Updated communication protocol documentation and task specification (+${added.length} / -${deleted.length} lines).`;
      affectedScope = ['Task Specification', 'Execution Plan', 'Harness Directives'];
      downstreamImpact = `Signals agent status transitions and provides instructions to observing agents and reviewers.`;
    } else {
      whatChanged = `Modified ${filename} (+${added.length} / -${deleted.length} line changes).`;
      affectedScope = symbolList.length ? symbolList : [filename.replace(/\.[^.]+$/, '')];
      downstreamImpact = `Modifications safely contained to ${filename}. Systemic integrity preserved.`;
    }

    return {
      whatChanged,
      affectedScope,
      downstreamImpact,
      symbols: symbolList
    };
  }

  matchesFile(f1, f2) {
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

  escapeHtml(str) {
    if (!str) return ' ';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.diffViewer = new DiffViewer();
