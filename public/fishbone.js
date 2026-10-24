// VibeTrace Interactive Fishbone Causal Breakdown Renderer
class FishboneRenderer {
  render(container, fishbone) {
    container.innerHTML = '';
    if (!fishbone || !fishbone.layers) return;

    fishbone.layers.forEach((layer, idx) => {
      const card = document.createElement('div');
      card.className = 'fishbone-branch-card';

      const iconMap = {
        'Database Layer': '🗄️',
        'Application Logic': '⚙️',
        'Configuration & Permissions': '🛡️',
        'Configuration': '🔧',
        'Security & Permissions': '🚨'
      };

      const icon = iconMap[layer.name] || '📦';
      const statusClass = layer.status || 'neutral';

      const header = document.createElement('div');
      header.className = 'fishbone-branch-header';
      header.innerHTML = `
        <div class="branch-left">
          <span class="branch-icon">${icon}</span>
          <span class="branch-name">${layer.name}</span>
        </div>
        <div class="branch-right">
          <span class="branch-status-pill ${statusClass}">${layer.status || 'neutral'}</span>
        </div>
      `;

      const body = document.createElement('div');
      body.className = 'fishbone-branch-body';
      
      let filesHtml = '';
      if (layer.files && layer.files.length > 0) {
        filesHtml = `
          <div class="branch-files-list">
            <strong style="font-size:10px;text-transform:uppercase;color:var(--text-muted);">Touched:</strong>
            ${layer.files.map(f => `<span class="branch-file-item">${f}</span>`).join(' ')}
          </div>
        `;
      }

      body.innerHTML = `
        <p>${layer.description || 'No direct mutations recorded in this subsystem.'}</p>
        ${filesHtml}
      `;

      // Accordion toggle behavior
      header.addEventListener('click', () => {
        body.classList.toggle('hidden');
      });

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    });
  }
}

window.fishboneRenderer = new FishboneRenderer();
