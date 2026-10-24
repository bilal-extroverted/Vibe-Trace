// VibeTrace Diff Viewer Component
// Renders clean syntax-highlighted line-by-line git diffs

class DiffViewer {
  render(container, diffs = [], selectedFile = 'all') {
    container.innerHTML = '';

    if (!diffs || diffs.length === 0) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">No code changes recorded for this trace.</div>';
      return;
    }

    const filteredDiffs = (selectedFile === 'all')
      ? diffs
      : diffs.filter(d => d.file === selectedFile);

    filteredDiffs.forEach(diffItem => {
      const fileCard = document.createElement('div');
      fileCard.className = 'diff-file-card';

      const header = document.createElement('div');
      header.className = 'diff-file-header';
      header.innerHTML = `
        <span class="diff-filename">📄 ${diffItem.file}</span>
        <span class="diff-status-tag">${diffItem.status || 'modified'}</span>
      `;

      const codeContainer = document.createElement('div');
      codeContainer.className = 'diff-code';

      const lines = (diffItem.content || '').split('\n');
      lines.forEach(line => {
        const lineEl = document.createElement('span');
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineEl.className = 'diff-line-add';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineEl.className = 'diff-line-del';
        }
        lineEl.textContent = line || ' ';
        codeContainer.appendChild(lineEl);
      });

      fileCard.appendChild(header);
      fileCard.appendChild(codeContainer);
      container.appendChild(fileCard);
    });
  }
}

window.diffViewer = new DiffViewer();
