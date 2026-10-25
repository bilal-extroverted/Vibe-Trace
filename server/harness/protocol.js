// VibeTrace Protocol Parser for `vibetrace.md`
// Enables inter-agent communication, intent synchronization, and task lifecycle tracking

const fs = require('fs');
const path = require('path');

class ProtocolManager {
  getFilePath(watchDir = '.') {
    return path.join(path.resolve(watchDir), 'vibetrace.md');
  }

  ensureExists(watchDir = '.') {
    const filePath = this.getFilePath(watchDir);
    if (!fs.existsSync(filePath)) {
      const template = `---
status: idle
task: "Ready for AI coding agent task"
agent: "VibeTrace Observability Harness"
started_at: "${new Date().toISOString()}"
updated_at: "${new Date().toISOString()}"
---

# VibeTrace Agent-Harness Communication Protocol

## Current Task Intent
> Waiting for coding agent instruction...

## Execution Plan & Steps
- [ ] Connect agent to repository
- [ ] Observe code modifications live
- [ ] Run automated harness integrity checks

## Inter-Agent & Harness Communication Notes
- VibeTrace dashboard live on http://localhost:3000
- Persistent SQLite storage active
- Automated guardrails active
`;
      try {
        fs.writeFileSync(filePath, template, 'utf8');
      } catch (err) {
        console.error('[ProtocolManager] Failed to create vibetrace.md template:', err.message);
      }
    }
  }

  read(watchDir = '.') {
    const filePath = this.getFilePath(watchDir);
    if (!fs.existsSync(filePath)) {
      this.ensureExists(watchDir);
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return this.parse(raw);
    } catch (err) {
      return {
        status: 'idle',
        task: 'Observing repository',
        agent: 'Unknown',
        steps: [],
        notes: '',
        intent: ''
      };
    }
  }

  parse(content) {
    const meta = {
      status: 'idle',
      task: '',
      agent: '',
      started_at: '',
      completed_at: '',
      updated_at: ''
    };

    let body = content;

    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      body = frontmatterMatch[2];

      yaml.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim();
          // strip quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          meta[key] = val;
        }
      });
    }

    // Parse Intent
    let intent = '';
    const intentMatch = body.match(/## Current Task Intent\s*>*\s*([\s\S]*?)(?=##|$)/i);
    if (intentMatch) {
      intent = intentMatch[1].trim().replace(/^>\s*/gm, '');
    }

    // Parse Checklist Steps
    const steps = [];
    const stepLines = body.match(/-\s*\[([ xX])\]\s*(.+)/g) || [];
    stepLines.forEach(line => {
      const m = line.match(/-\s*\[([ xX])\]\s*(.+)/);
      if (m) {
        steps.push({
          done: m[1].toLowerCase() === 'x',
          text: m[2].trim()
        });
      }
    });

    // Parse Inter-Agent Notes
    let notes = '';
    const notesMatch = body.match(/## Inter-Agent & Harness Communication Notes\s*([\s\S]*?)(?=##|$)/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    }

    return {
      ...meta,
      intent: intent || meta.task || 'Active task',
      steps,
      notes,
      rawBody: body
    };
  }
}

module.exports = new ProtocolManager();
