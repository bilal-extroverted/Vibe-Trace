// VibeTrace Persistent SQLite Database Layer
// Built using Node.js native `node:sqlite`

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../vibetrace.db');

class Database {
  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        last_active_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS traces (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        change_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        architectural_impact TEXT,
        subsystems_json TEXT,
        git_branch TEXT,
        git_commit TEXT,
        additions INTEGER DEFAULT 0,
        deletions INTEGER DEFAULT 0,
        latency TEXT,
        model TEXT,
        harness_status TEXT,
        harness_report_json TEXT,
        agent_protocol_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS diffs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        status TEXT,
        content TEXT,
        FOREIGN KEY (trace_id) REFERENCES traces(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        model_used TEXT,
        latency_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS features_evolution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_path TEXT NOT NULL,
        trace_id TEXT NOT NULL UNIQUE,
        milestone_index INTEGER DEFAULT 1,
        timestamp TEXT NOT NULL,
        title TEXT NOT NULL,
        task TEXT,
        narrative TEXT,
        features_added_json TEXT,
        features_modified_json TEXT,
        features_removed_json TEXT,
        files_changed_json TEXT,
        metrics_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trace_id) REFERENCES traces(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_traces_project ON traces(project_path);
      CREATE INDEX IF NOT EXISTS idx_diffs_trace ON diffs(trace_id);
      CREATE INDEX IF NOT EXISTS idx_features_project ON features_evolution(project_path);
      CREATE INDEX IF NOT EXISTS idx_features_trace ON features_evolution(trace_id);
    `);

    // Ensure migration for existing DBs
    try {
      this.db.exec('ALTER TABLE traces ADD COLUMN agent_protocol_json TEXT');
    } catch (e) {}
    try {
      this.db.exec('ALTER TABLE traces ADD COLUMN synthesis_json TEXT');
    } catch (e) {}
    try {
      this.db.exec('ALTER TABLE traces ADD COLUMN drift_analysis_json TEXT');
    } catch (e) {}

    // Clean duplicate traces on startup
    this.cleanDuplicateTraces();
  }

  // Deduplicate existing duplicate rows in SQLite by task name
  cleanDuplicateTraces() {
    try {
      const rows = this.db.prepare('SELECT id, title, agent_protocol_json, created_at FROM traces ORDER BY created_at DESC').all();
      const seen = new Set();
      const toDelete = [];

      for (const r of rows) {
        let task = '';
        try {
          const proto = JSON.parse(r.agent_protocol_json || '{}');
          task = proto.task || proto.intent || '';
        } catch (e) {}
        if (!task) task = r.title || '';
        const norm = task.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!norm) continue;
        if (seen.has(norm)) {
          toDelete.push(r.id);
        } else {
          seen.add(norm);
        }
      }

      if (toDelete.length > 0) {
        const del = this.db.prepare('DELETE FROM traces WHERE id = ?');
        const delDiffs = this.db.prepare('DELETE FROM diffs WHERE trace_id = ?');
        for (const id of toDelete) {
          del.run(id);
          delDiffs.run(id);
        }
      }
    } catch (e) {
      console.warn('[DB Deduplication]', e.message);
    }
  }

  // Upsert project
  upsertProject(folderPath) {
    const resolved = path.resolve(folderPath);
    const name = path.basename(resolved) || 'workspace';
    const now = new Date().toISOString();
    const id = Buffer.from(resolved).toString('base64url').slice(0, 16);

    const checkStmt = this.db.prepare('SELECT id FROM projects WHERE path = ?');
    const existing = checkStmt.get(resolved);

    if (existing) {
      const updateStmt = this.db.prepare('UPDATE projects SET last_active_at = ? WHERE path = ?');
      updateStmt.run(now, resolved);
      return { id: existing.id, name, path: resolved };
    } else {
      const insertStmt = this.db.prepare(`
        INSERT INTO projects (id, name, path, created_at, last_active_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertStmt.run(id, name, resolved, now, now);
      return { id, name, path: resolved };
    }
  }

  // Get all projects
  getProjects() {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY last_active_at DESC');
    return stmt.all();
  }

  // Save trace and associated diffs
  saveTrace(trace, projectPath) {
    const resolvedPath = path.resolve(projectPath);
    this.upsertProject(resolvedPath);

    const insertTrace = this.db.prepare(`
      INSERT OR REPLACE INTO traces (
        id, project_path, timestamp, change_type, title,
        summary, architectural_impact, subsystems_json,
        git_branch, git_commit, additions, deletions,
        latency, model, harness_status, harness_report_json,
        agent_protocol_json, synthesis_json, drift_analysis_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTrace.run(
      trace.id,
      resolvedPath,
      trace.timestamp,
      trace.changeType || 'Code Mutation',
      trace.title || 'Code Change',
      trace.summary || '',
      trace.architecturalImpact || '',
      JSON.stringify(trace.subsystems || []),
      trace.git?.branch || 'main',
      trace.git?.commit || 'HEAD',
      trace.additions || 0,
      trace.deletions || 0,
      trace.latency || '0.24s',
      trace.model || 'local',
      trace.harness?.status || 'PASS',
      JSON.stringify(trace.harness || {}),
      JSON.stringify(trace.agentProtocol || {}),
      JSON.stringify(trace.synthesis || {}),
      JSON.stringify(trace.driftAnalysis || trace.drift || null)
    );

    // Insert diffs
    if (trace.diffs && Array.isArray(trace.diffs)) {
      const deleteDiffs = this.db.prepare('DELETE FROM diffs WHERE trace_id = ?');
      deleteDiffs.run(trace.id);

      const insertDiff = this.db.prepare(`
        INSERT INTO diffs (trace_id, file_path, status, content)
        VALUES (?, ?, ?, ?)
      `);

      for (const d of trace.diffs) {
        insertDiff.run(trace.id, d.file, d.status || 'modified', d.content || '');
      }
    }

    this.cleanDuplicateTraces();
    return trace;
  }

  // Get traces for a project
  getTraces(projectPath, limit = 50) {
    const resolvedPath = path.resolve(projectPath);
    const stmt = this.db.prepare(`
      SELECT * FROM traces
      WHERE project_path = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(resolvedPath, limit);
    return rows.map(r => this.hydrateTrace(r));
  }

  // Get single trace with diffs
  getTraceById(id) {
    const stmt = this.db.prepare('SELECT * FROM traces WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return this.hydrateTrace(row);
  }

  hydrateTrace(row) {
    const diffStmt = this.db.prepare('SELECT file_path as file, status, content FROM diffs WHERE trace_id = ?');
    const diffs = diffStmt.all(row.id);

    let subsystems = [];
    let harness = {};
    let agentProtocol = null;
    let synthesis = {};
    let driftAnalysis = null;
    try { subsystems = JSON.parse(row.subsystems_json || '[]'); } catch (e) {}
    try { harness = JSON.parse(row.harness_report_json || '{}'); } catch (e) {}
    try { agentProtocol = JSON.parse(row.agent_protocol_json || '{}'); } catch (e) {}
    try { synthesis = JSON.parse(row.synthesis_json || '{}'); } catch (e) {}
    try { driftAnalysis = JSON.parse(row.drift_analysis_json || 'null'); } catch (e) {}

    if (!synthesis.summary) {
      synthesis = {
        summary: row.summary || 'Code modifications recorded.',
        whatChanged: [
          `Modified ${diffs.length} file(s)`,
          `Delta of +${row.additions || 0} / -${row.deletions || 0} lines`
        ],
        affectedFeatures: diffs.map(d => d.file.split(/[\/\\]/).pop().replace(/\.[^.]+$/, '')).slice(0, 4),
        downstreamImpact: row.architectural_impact || 'Systemic boundaries consistent.',
        riskLevel: harness.status === 'FAIL' ? 'High' : (harness.status === 'WARN' ? 'Medium' : 'Low')
      };
    }

    return {
      id: row.id,
      changeType: row.change_type,
      title: row.title,
      timestamp: row.timestamp,
      summary: row.summary,
      architecturalImpact: row.architectural_impact,
      subsystems,
      files: diffs.map(d => d.file),
      additions: row.additions,
      deletions: row.deletions,
      latency: row.latency,
      model: row.model,
      git: {
        branch: row.git_branch,
        commit: row.git_commit
      },
      harness,
      agentProtocol,
      synthesis,
      driftAnalysis,
      diffs
    };
  }

  // Update Drift Analysis for a specific trace
  updateTraceDrift(traceId, driftAnalysis) {
    try {
      const stmt = this.db.prepare('UPDATE traces SET drift_analysis_json = ? WHERE id = ?');
      stmt.run(JSON.stringify(driftAnalysis), traceId);
      return true;
    } catch (e) {
      console.error('Failed to update trace drift analysis:', e);
      return false;
    }
  }

  // Save AI Query
  saveQuery({ traceId, question, answer, modelUsed, latencyMs }) {
    const stmt = this.db.prepare(`
      INSERT INTO queries (trace_id, question, answer, model_used, latency_ms)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(traceId || null, question, answer, modelUsed || 'unknown', latencyMs || 0);
  }

  // Save Feature Evolution Milestone
  saveFeatureEvolutionStep(step, projectPath) {
    const resolvedPath = path.resolve(projectPath);
    this.upsertProject(resolvedPath);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO features_evolution (
        project_path, trace_id, milestone_index, timestamp,
        title, task, narrative, features_added_json,
        features_modified_json, features_removed_json,
        files_changed_json, metrics_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      resolvedPath,
      step.traceId || step.id,
      step.milestoneIndex || 1,
      step.timestamp || new Date().toISOString(),
      step.title || 'Codebase Milestone',
      step.task || step.title || '',
      step.narrative || '',
      JSON.stringify(step.featuresAdded || []),
      JSON.stringify(step.featuresModified || []),
      JSON.stringify(step.featuresRemoved || []),
      JSON.stringify(step.filesChanged || []),
      JSON.stringify(step.metrics || {}),
      step.createdAt || new Date().toISOString()
    );

    return step;
  }

  // Get all Feature Evolution milestones for a project in chronological order
  getFeaturesEvolution(projectPath) {
    const resolvedPath = path.resolve(projectPath);
    const stmt = this.db.prepare(`
      SELECT * FROM features_evolution
      WHERE project_path = ?
      ORDER BY milestone_index ASC, created_at ASC
    `);

    const rows = stmt.all(resolvedPath);
    return rows.map(r => {
      let featuresAdded = [];
      let featuresModified = [];
      let featuresRemoved = [];
      let filesChanged = [];
      let metrics = {};

      try { featuresAdded = JSON.parse(r.features_added_json || '[]'); } catch (e) {}
      try { featuresModified = JSON.parse(r.features_modified_json || '[]'); } catch (e) {}
      try { featuresRemoved = JSON.parse(r.features_removed_json || '[]'); } catch (e) {}
      try { filesChanged = JSON.parse(r.files_changed_json || '[]'); } catch (e) {}
      try { metrics = JSON.parse(r.metrics_json || '{}'); } catch (e) {}

      return {
        id: r.id,
        traceId: r.trace_id,
        milestoneIndex: r.milestone_index,
        timestamp: r.timestamp,
        title: r.title,
        task: r.task,
        narrative: r.narrative,
        featuresAdded,
        featuresModified,
        featuresRemoved,
        filesChanged,
        metrics,
        createdAt: r.created_at
      };
    });
  }

  // Clear features evolution for a project (useful when recomputing all)
  clearFeaturesEvolution(projectPath) {
    const resolvedPath = path.resolve(projectPath);
    const stmt = this.db.prepare('DELETE FROM features_evolution WHERE project_path = ?');
    stmt.run(resolvedPath);
  }
}

module.exports = new Database();
