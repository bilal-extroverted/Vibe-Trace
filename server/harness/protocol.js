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
      updated_at: '',
      active_file: '',
      file_action: '',
      file_summary: '',
      file_action_type: 'modifying'
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

    // Parse Active File & Mutation Section (e.g. ## Current File Status or ## Active File & Live Mutation)
    let mdActiveFile = '';
    let mdFileAction = '';
    let mdFileSummary = '';
    const fileStatusMatch = body.match(/## (?:Current File Status|Active File & Live Mutation|Live File Status|Live File Mutation)\s*([\s\S]*?)(?=##|$)/i);
    if (fileStatusMatch) {
      const sectionText = fileStatusMatch[1];
      const fileM = sectionText.match(/(?:Active File|Current File|File):\s*`?([^`\r\n]+)`?/i);
      if (fileM) mdActiveFile = fileM[1].trim();
      const actionM = sectionText.match(/(?:What is Happening|Action|Activity):\s*([^\r\n]+)/i);
      if (actionM) mdFileAction = actionM[1].trim();
      const summaryM = sectionText.match(/(?:Live Summary|File Summary|Summary):\s*([^\r\n]+)/i);
      if (summaryM) mdFileSummary = summaryM[1].trim();
    }

    const activeFile = meta.active_file || meta.current_file || mdActiveFile || '';
    const fileAction = meta.file_action || meta.current_action || mdFileAction || '';
    const fileSummary = meta.file_summary || mdFileSummary || '';

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
      active_file: activeFile,
      current_file: activeFile,
      file_action: fileAction,
      current_action: fileAction,
      file_summary: fileSummary,
      intent: intent || meta.task || 'Active task',
      steps,
      notes,
      rawBody: body
    };
  }
}

module.exports = new ProtocolManager();
