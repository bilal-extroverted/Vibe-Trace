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

      CREATE INDEX IF NOT EXISTS idx_traces_project ON traces(project_path);
      CREATE INDEX IF NOT EXISTS idx_diffs_trace ON diffs(trace_id);
    `);

    // Ensure migration for existing DBs
    try {
      this.db.exec('ALTER TABLE traces ADD COLUMN agent_protocol_json TEXT');
    } catch (e) {}
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
        agent_protocol_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(trace.agentProtocol || {})
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
    try { subsystems = JSON.parse(row.subsystems_json || '[]'); } catch (e) {}
    try { harness = JSON.parse(row.harness_report_json || '{}'); } catch (e) {}
    try { agentProtocol = JSON.parse(row.agent_protocol_json || '{}'); } catch (e) {}

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
      diffs
    };
  }

  // Save AI Query
  saveQuery({ traceId, question, answer, modelUsed, latencyMs }) {
    const stmt = this.db.prepare(`
      INSERT INTO queries (trace_id, question, answer, model_used, latency_ms)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(traceId || null, question, answer, modelUsed || 'unknown', latencyMs || 0);
  }

  // Get recent queries
  getQueries(limit = 10) {
    const stmt = this.db.prepare('SELECT * FROM queries ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }
}

module.exports = new Database();
