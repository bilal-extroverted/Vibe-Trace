// VibeTrace Lightweight Diff Viewer Component
class DiffViewer {
  render(container, diffs) {
    container.innerHTML = '';
    if (!diffs || diffs.length === 0) {
      container.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px;">No code changes recorded for this event.</div>';
      return;
    }

    diffs.forEach((diffItem, index) => {
      const fileCard = document.createElement('div');
      fileCard.className = 'diff-file-card';

      const header = document.createElement('div');
      header.className = 'diff-file-header';
      header.innerHTML = `
        <span class="diff-filename">📄 ${diffItem.file}</span>
        <span style="font-size:11px;color:var(--text-muted);">${diffItem.status || 'modified'}</span>
      `;

      const codeContainer = document.createElement('div');
      codeContainer.className = 'diff-code';

      const lines = (diffItem.content || '').split('\n');
      lines.forEach(line => {
        const lineEl = document.createElement('span');
        if (line.startsWith('+')) {
          lineEl.className = 'diff-line-add';
        } else if (line.startsWith('-')) {
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
