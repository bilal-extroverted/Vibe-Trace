// VibeTrace Professional Diff Viewer Component
// Line-by-line syntax-highlighted git diff inspector with line numbers and chunk headers

class DiffViewer {
  render(container, diffs = [], selectedFile = 'all') {
    container.innerHTML = '';

    if (!diffs || diffs.length === 0) {
      container.innerHTML = `
        <div class="diff-empty-notice">
          <div class="empty-icon">✓</div>
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
          <p>No diffs available for selected file: <b>${selectedFile}</b></p>
        </div>
      `;
      return;
    }

    filteredDiffs.forEach((diffItem, fileIdx) => {
      const fileCard = document.createElement('div');
      fileCard.className = 'diff-file-card';

      // File Card Header
      const header = document.createElement('div');
      header.className = 'diff-file-header';
      header.innerHTML = `
        <div class="diff-header-left">
          <span class="file-icon">📄</span>
          <span class="diff-filename">${this.escapeHtml(diffItem.file)}</span>
        </div>
        <span class="diff-status-tag ${diffItem.status || 'modified'}">${(diffItem.status || 'modified').toUpperCase()}</span>
      `;
      fileCard.appendChild(header);

      // Diff Code Container
      const codeWrapper = document.createElement('div');
      codeWrapper.className = 'diff-code-wrapper';

      const rawContent = diffItem.content || '';
      const lines = rawContent.split(/\r?\n/);

      let oldLineNum = 1;
      let newLineNum = 1;

      lines.forEach((line, idx) => {
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
          // Parse @@ -a,b +c,d @@ to reset line counters if present
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

        // Clean line content (strip leading + or - for display if present)
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
      container.appendChild(fileCard);
    });
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
