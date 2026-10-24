// VibeTrace Dashboard Client Controller
(function () {
  let events = [];
  let selectedEventId = null;

  // DOM Elements
  const timelineList = document.getElementById('timeline-list');
  const eventCountBadge = document.getElementById('event-count-badge');
  const watchedDirEl = document.getElementById('watched-dir');
  const emptyState = document.getElementById('empty-state');
  const eventDetails = document.getElementById('event-details');
  const globalDriftStatus = document.getElementById('global-drift-status');
  const btnRunScenario = document.getElementById('btn-run-scenario');
  const btnEmptyDemo = document.getElementById('btn-empty-demo');

  // Detail Elements
  const detailTitle = document.getElementById('detail-title');
  const detailSummary = document.getElementById('detail-summary');
  const detailTimestamp = document.getElementById('detail-timestamp');
  const detailDriftTag = document.getElementById('detail-drift-tag');
  const driftAlertBanner = document.getElementById('drift-alert-banner');
  const driftAlertMessage = document.getElementById('drift-alert-message');
  const fishboneCause = document.getElementById('fishbone-cause');
  const fishboneBranches = document.getElementById('fishbone-branches');
  const diffContainer = document.getElementById('diff-container');
  const diffFileCount = document.getElementById('diff-file-count');

  // Initialize SSE Telemetry Connection
  function initSSE() {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = function (e) {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'connected') {
          console.log('[VibeTrace SSE]', payload.message);
        } else if (payload.type === 'history') {
          events = payload.events || [];
          renderTimeline();
          if (events.length > 0) selectEvent(events[0].id);
        } else if (payload.type === 'change') {
          addEvent(payload.event);
        }
      } catch (err) {
        console.error('Error parsing SSE payload:', err);
      }
    };

    evtSource.onerror = function (err) {
      console.warn('[VibeTrace SSE] Connection dropped, reconnecting automatically...');
    };
  }

  // Fetch initial system status
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.watchDir) {
        watchedDirEl.textContent = data.watchDir;
      }
    } catch (e) {
      watchedDirEl.textContent = 'localhost:3000';
    }
  }

  // Add event to timeline and select it
  function addEvent(event) {
    events.unshift(event);
    renderTimeline();
    selectEvent(event.id);

    // Update global status badge if drift detected
    if (event.driftDetected) {
      globalDriftStatus.className = 'health-badge badge-drift';
      globalDriftStatus.innerHTML = '<span class="badge-icon">⚠️</span> Drift Alert';
    }
  }

  // Render Timeline Tiles in Left Pane
  function renderTimeline() {
    eventCountBadge.textContent = events.length;

    if (events.length === 0) {
      timelineList.innerHTML = `
        <div style="padding: 20px 10px; text-align: center; color: var(--text-muted); font-size: 12px;">
          Waiting for first AI edit in workspace...
        </div>
      `;
      emptyState.classList.remove('hidden');
      eventDetails.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    eventDetails.classList.remove('hidden');

    timelineList.innerHTML = '';
    events.forEach(evt => {
      const tile = document.createElement('div');
      tile.className = `timeline-tile ${evt.id === selectedEventId ? 'active' : ''}`;
      tile.dataset.id = evt.id;

      const isDrift = evt.driftDetected;
      const badgeClass = isDrift ? 'drift' : 'safe';
      const badgeText = isDrift ? 'DRIFT ALERT' : 'SAFE';

      const fileCount = (evt.git && evt.git.filesChanged) ? evt.git.filesChanged.length : (evt.diffs ? evt.diffs.length : 1);

      tile.innerHTML = `
        <div class="tile-top">
          <span class="tile-time">${evt.timestamp || 'Just now'}</span>
          <span class="tile-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="tile-title">${evt.title || 'Code Change'}</div>
        <div class="tile-footer">
          <span>📁 ${fileCount} file${fileCount === 1 ? '' : 's'}</span>
          <span>${evt.git && evt.git.branch ? '🌿 ' + evt.git.branch : ''}</span>
        </div>
      `;

      tile.addEventListener('click', () => selectEvent(evt.id));
      timelineList.appendChild(tile);
    });
  }

  // Select an event and update Main Canvas
  function selectEvent(id) {
    selectedEventId = id;
    const evt = events.find(e => e.id === id);
    if (!evt) return;

    // Highlight active tile
    document.querySelectorAll('.timeline-tile').forEach(t => {
      t.classList.toggle('active', t.dataset.id === id);
    });

    // Populate header card
    detailTitle.textContent = evt.title || 'Code Change';
    detailSummary.textContent = evt.summary || 'No summary available.';
    detailTimestamp.textContent = evt.timestamp || 'Recorded';

    if (evt.driftDetected) {
      detailDriftTag.className = 'drift-tag drift';
      detailDriftTag.textContent = 'DRIFT WARNING';
      driftAlertBanner.classList.remove('hidden');
      driftAlertMessage.textContent = evt.driftMessage || 'Unintended code changes detected outside prompt scope.';
    } else {
      detailDriftTag.className = 'drift-tag safe';
      detailDriftTag.textContent = 'VERIFIED SAFE';
      driftAlertBanner.classList.add('hidden');
    }

    // Populate Fishbone
    if (evt.fishbone) {
      fishboneCause.textContent = evt.fishbone.cause || 'AI Agent Prompt';
      if (window.fishboneRenderer) {
        window.fishboneRenderer.render(fishboneBranches, evt.fishbone);
      }
    }

    // Populate Diffs
    const diffs = evt.diffs || [];
    diffFileCount.textContent = `${diffs.length} file${diffs.length === 1 ? '' : 's'}`;
    if (window.diffViewer) {
      window.diffViewer.render(diffContainer, diffs);
    }
  }

  // Trigger Demo Scenario via API
  async function runDemoScenario() {
    btnRunScenario.disabled = true;
    btnRunScenario.textContent = 'Simulating...';

    try {
      const res = await fetch('/api/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'database_permission_drift' })
      });
      const data = await res.json();
      if (data.event) {
        addEvent(data.event);
      }
    } catch (err) {
      console.error('Failed to run demo scenario:', err);
    } finally {
      btnRunScenario.disabled = false;
      btnRunScenario.innerHTML = '<span class="btn-icon">⚡</span> Run Demo Scenario';
    }
  }

  // Wire event handlers
  if (btnRunScenario) btnRunScenario.addEventListener('click', runDemoScenario);
  if (btnEmptyDemo) btnEmptyDemo.addEventListener('click', runDemoScenario);

  // Initialize
  fetchStatus();
  initSSE();
})();
