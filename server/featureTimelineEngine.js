// VibeTrace Features Over Time & Codebase Evolution Engine
// Parses completed execution traces into chronological milestones detailing:
// - What files changed (with line churn + additions / - deletions)
// - What new features were added
// - What features were modified or refactored
// - What code/features were removed or simplified
// - Plain-English causal narrative explaining codebase evolution over time
// Persists milestones permanently to SQLite (features_evolution table).

const path = require('path');
const db = require('./db');

// Domain role knowledge for known files in VibeTrace
const FILE_ROLES = {
  'server/watcher.js': 'Chokidar sliding-window observer & batch mutation debouncer',
  'server/gitService.js': 'Git diff extraction & commit history inspection service',
  'server/driftAnalyzer.js': 'Prompt-to-output fidelity auditor & regression detector',
  'server/analyzer.js': 'Dual-perspective trace synthesizer (AI summary + mechanical checks)',
  'server/queryEngine.js': 'Natural language Q&A engine querying codebase execution history',
  'server/mindMapEngine.js': 'Architectural subsystem topology generator & flaw scanner',
  'server/featureTimelineEngine.js': 'Features-over-time evolution graph & milestone persistence engine',
  'server/db.js': 'Node.js native node:sqlite database persistence layer',
  'server/sse.js': 'High-frequency Server-Sent Events real-time broadcaster',
  'server/index.js': 'Express backend daemon hosting REST APIs and telemetry streams',
  'server/harness/protocol.js': 'Agent-Harness protocol (vibetrace.md) lifecycle parser',
  'server/harness/harnessEngine.js': 'AST mechanical rules, syntax validator & security scanner',
  'public/app.js': 'Frontend client workbench controller, SSE listener, & timeline UI',
  'public/diffViewer.js': 'Syntax-highlighted diff inspector with mechanical overlay badges',
  'public/index.html': 'Workbench layout, 3-pane DOM, modal containers, & logs drawer',
  'public/style.css': 'Design tokens, 4 card status gradients, pastel themes & animations',
  'vibetrace.md': 'Shared agent-harness protocol file tracking tasks & active file targets',
  'README.md': 'VibeTrace official documentation, setup guide, & architecture specs',
  'LICENSE': 'Official MIT open-source license'
};

/**
 * Extract added, modified, and removed features from a trace
 */
function extractFeaturesFromTrace(trace) {
  const added = [];
  const modified = [];
  const removed = [];

  const task = (trace.agentProtocol?.task || trace.title || '').trim();
  const summary = trace.summary || trace.synthesis?.summary || '';
  const whatChanged = trace.synthesis?.whatChanged || [];
  const diffs = trace.diffs || [];
  const files = trace.files || diffs.map(d => d.file);
  const additions = trace.additions || 0;
  const deletions = trace.deletions || 0;

  const taskLower = task.toLowerCase();
  const summaryLower = summary.toLowerCase();

  // 1. Analyze Task & Commit Intent Keywords
  if (taskLower.includes('mindmap') || taskLower.includes('mind map')) {
    if (taskLower.includes('overhaul') || taskLower.includes('fix') || taskLower.includes('improve')) {
      modified.push('Interactive Subsystem Topology with 5-tier architectural grouping');
      added.push('Diagnostic Flaw & Anomaly Scanner with actionable remediation tips');
      added.push('Interactive SVG architectural diagram and Mermaid exporter');
    }
  }

  if (taskLower.includes('pastel') || taskLower.includes('layout') || taskLower.includes('normalise') || taskLower.includes('ui ux')) {
    modified.push('Pastel Theme Normalization across Middle & Right panes for high readability');
    modified.push('Workbench card attachment: Selected trace card connects seamlessly to diff inspector');
    removed.push('Harsh bright contrast borders and jarring non-pastel color clashing');
  }

  if (taskLower.includes('desync') || taskLower.includes('zombie') || taskLower.includes('lifecycle')) {
    modified.push('Trace Lifecycle Guard: Immediate nullification of activeTrace on task completion');
    modified.push('Protocol ground-truth priority: Actively written file takes precedence over stale metadata');
    removed.push('Zombie in-progress active trace state persisting after browser refresh');
  }

  if (taskLower.includes('openrouter') || taskLower.includes('model')) {
    modified.push('Strict .env model locking: OpenRouter queries bound strictly to configured model');
    added.push('Zero-downtime offline AST & heuristic fallback for rate-limited models');
  }

  if (taskLower.includes('drift')) {
    added.push('Prompt vs Output Drift Guard: Audits code diffs against declared prompt requirements');
  }

  if (taskLower.includes('database') || taskLower.includes('sqlite') || taskLower.includes('persist')) {
    added.push('Native SQLite (node:sqlite DatabaseSync) persistence layer for zero-dependency storage');
  }

  if (taskLower.includes('sse') || taskLower.includes('telemetry') || taskLower.includes('stream')) {
    added.push('High-frequency Server-Sent Events stream for instant live trace broadcast');
  }

  if (taskLower.includes('organize') || taskLower.includes('spec') || taskLower.includes('prd') || taskLower.includes('license')) {
    added.push('Official MIT License for VibeTrace');
    added.push('Devpost submission specs: learner-profile.md, spec.md, and prd.md');
    modified.push('Project file organization separating VibeTrace core from competition blueprints');
  }

  if (taskLower.includes('features overtime') || taskLower.includes('feature evolution') || taskLower.includes('history')) {
    added.push('Features Over Time Evolution Graph & Chronological Milestone Timeline');
    added.push('SQLite features_evolution table for instant reload without lag');
    removed.push('Static mindmap graph replaced with dynamic feature evolution timeline');
  }

  // 2. Diff-Level Feature Deduction
  diffs.forEach(d => {
    const fLower = d.file.toLowerCase();
    const content = d.content || '';

    // Check for deletions / removals in diff content
    if (content.includes('DELETE FROM') || content.includes('delete ') || d.status === 'deleted') {
      removed.push(`Cleaned deprecated code in ${path.basename(d.file)}`);
    }

    if (fLower.includes('featuretimelineengine') || fLower.includes('features-over-time')) {
      added.push('Feature Timeline Synthesis Engine tracking additions, modifications, and removals');
    }

    if (fLower.includes('style.css')) {
      if (additions > 150) {
        modified.push('Refined typography tokens, card gradients, and micro-design spacing');
      }
      if (deletions > 80) {
        removed.push('Obsolete CSS rules and conflicting layout overrides');
      }
    }

    if (fLower.includes('app.js')) {
      if (content.includes('addEventListener') || content.includes('render')) {
        modified.push(`UI event orchestration and reactive rendering in ${path.basename(d.file)}`);
      }
    }

    if (fLower.includes('db.js')) {
      if (content.includes('CREATE TABLE')) {
        added.push('Persistent database schema expansion in SQLite');
      }
    }
  });

  // 3. WhatChanged synthesis deductions
  whatChanged.forEach(wc => {
    const wcLower = wc.toLowerCase();
    if (wcLower.includes('add') || wcLower.includes('create') || wcLower.includes('new') || wcLower.includes('implement')) {
      added.push(wc.replace(/^[-*•+]\s*/, ''));
    } else if (wcLower.includes('remove') || wcLower.includes('delete') || wcLower.includes('deprecat') || wcLower.includes('clean')) {
      removed.push(wc.replace(/^[-*•+]\s*/, ''));
    } else if (wcLower.includes('updat') || wcLower.includes('modif') || wcLower.includes('refactor') || wcLower.includes('fix') || wcLower.includes('improv')) {
      modified.push(wc.replace(/^[-*•+]\s*/, ''));
    }
  });

  // Fallbacks if arrays are empty so each milestone has clear, informative content
  if (added.length === 0 && additions > 0) {
    if (diffs.length > 0) {
      added.push(`Added +${additions} lines of new functionality across ${files.length} file(s)`);
    } else {
      added.push('New system capabilities committed');
    }
  }

  if (modified.length === 0) {
    modified.push(`Refactored ${files.map(f => path.basename(f)).slice(0, 3).join(', ')} for system stability`);
  }

  if (removed.length === 0) {
    if (deletions > 0) {
      removed.push(`Pruned ${deletions} lines of redundant code and unused statements`);
    } else {
      removed.push('No deprecated features removed in this milestone');
    }
  }

  // Deduplicate entries
  return {
    added: Array.from(new Set(added)).slice(0, 5),
    modified: Array.from(new Set(modified)).slice(0, 5),
    removed: Array.from(new Set(removed)).slice(0, 4)
  };
}

/**
 * Generate a clear plain-English architectural narrative for a milestone
 */
function generateMilestoneNarrative(trace, features, filesCount, additions, deletions) {
  const task = trace.agentProtocol?.task || trace.title || 'Codebase Modification';
  const mainFile = trace.files && trace.files[0] ? path.basename(trace.files[0]) : 'core files';
  
  if (features.added.length > 0 && features.removed.length > 0 && features.removed[0] !== 'No deprecated features removed in this milestone') {
    return `In this milestone, the team focused on "${task}". Newly introduced capabilities include ${features.added[0]}, while eliminating ${features.removed[0]} across ${filesCount} file(s) (+${additions} / -${deletions} lines).`;
  }

  if (features.added.length > 0) {
    return `Milestone executed for "${task}". Introduced ${features.added[0]} with primary modifications centered around ${mainFile} (+${additions} / -${deletions} lines).`;
  }

  return `Architectural adjustments applied for "${task}". Refactored ${mainFile} to enhance maintainability and preserve prompt fidelity across the codebase.`;
}

/**
 * Format files changed with line churn and semantic roles
 */
function formatFilesChanged(diffs = [], files = []) {
  const fileList = diffs.length > 0 ? diffs.map(d => ({ file: d.file, status: d.status || 'modified', additions: 0, deletions: 0 })) : files.map(f => ({ file: f, status: 'modified', additions: 0, deletions: 0 }));

  return fileList.map(item => {
    const norm = item.file.replace(/\\/g, '/');
    const basename = path.basename(norm);
    const roleKey = Object.keys(FILE_ROLES).find(k => norm.toLowerCase().includes(k.toLowerCase()));

    return {
      file: norm,
      basename,
      status: item.status,
      role: roleKey ? FILE_ROLES[roleKey] : `Module in ${path.dirname(norm) || 'root'}`,
      additions: item.additions || 0,
      deletions: item.deletions || 0
    };
  });
}

/**
 * Build a single Milestone object from a trace
 */
function buildMilestoneFromTrace(trace, milestoneIndex, previousCumulative = { features: 0, additions: 0, deletions: 0, knownFiles: new Set() }) {
  const diffs = trace.diffs || [];
  const files = trace.files || (diffs ? diffs.map(d => d.file) : []);
  const additions = trace.additions || 0;
  const deletions = trace.deletions || 0;

  const features = extractFeaturesFromTrace(trace);
  const filesChanged = formatFilesChanged(diffs, files);

  // Update cumulative totals
  const totalAddedFeatures = previousCumulative.features + features.added.length;
  const totalAdditions = previousCumulative.additions + additions;
  const totalDeletions = previousCumulative.deletions + deletions;
  files.forEach(f => previousCumulative.knownFiles.add(f));

  const narrative = generateMilestoneNarrative(trace, features, files.length, additions, deletions);

  // Format clean timestamp
  let formattedTime = trace.timestamp || new Date().toISOString();
  if (formattedTime.length > 8 && formattedTime.includes('T')) {
    try {
      formattedTime = new Date(formattedTime).toLocaleTimeString('en-US', { hour12: false });
    } catch (e) {}
  }

  return {
    traceId: trace.id,
    milestoneIndex,
    timestamp: formattedTime,
    title: trace.title || 'Code Mutation',
    task: trace.agentProtocol?.task || trace.title || 'Codebase Refactor',
    narrative,
    featuresAdded: features.added,
    featuresModified: features.modified,
    featuresRemoved: features.removed,
    filesChanged,
    metrics: {
      additions,
      deletions,
      netDelta: additions - deletions,
      cumulativeFeatures: totalAddedFeatures,
      cumulativeAdditions: totalAdditions,
      cumulativeDeletions: totalDeletions,
      totalFilesEvolved: previousCumulative.knownFiles.size
    },
    graphPoint: {
      index: milestoneIndex,
      label: `M${milestoneIndex}`,
      title: trace.title || `Milestone ${milestoneIndex}`,
      cumulativeFeatures: totalAddedFeatures,
      additions,
      deletions,
      timestamp: formattedTime
    },
    createdAt: trace.timestamp || new Date().toISOString()
  };
}

/**
 * Record a newly completed trace as an evolution milestone in SQLite
 */
function recordTraceMilestone(trace, projectPath = '.') {
  const resolvedPath = path.resolve(projectPath);
  
  // Read existing milestones from SQLite
  const existingMilestones = db.getFeaturesEvolution(resolvedPath);
  
  // Prevent duplicate insertion if traceId already recorded
  const alreadyExists = existingMilestones.find(m => m.traceId === trace.id);
  if (alreadyExists) {
    return alreadyExists;
  }

  // Calculate previous cumulative metrics
  const last = existingMilestones[existingMilestones.length - 1];
  const previousCumulative = {
    features: last ? (last.metrics?.cumulativeFeatures || 0) : 0,
    additions: last ? (last.metrics?.cumulativeAdditions || 0) : 0,
    deletions: last ? (last.metrics?.cumulativeDeletions || 0) : 0,
    knownFiles: new Set()
  };

  existingMilestones.forEach(m => {
    (m.filesChanged || []).forEach(f => previousCumulative.knownFiles.add(f.file));
  });

  const milestoneIndex = existingMilestones.length + 1;
  const milestone = buildMilestoneFromTrace(trace, milestoneIndex, previousCumulative);

  // Save permanently in SQLite features_evolution table
  db.saveFeatureEvolutionStep(milestone, resolvedPath);
  console.log(`[Feature Evolution] Saved milestone #${milestoneIndex}: "${milestone.title}" (+${milestone.featuresAdded.length} features, ${milestone.filesChanged.length} files) to SQLite.`);

  return milestone;
}

/**
 * Ensure historical traces in SQLite are all converted into features_evolution records
 */
function ensureFeaturesEvolutionInitialized(projectPath = '.') {
  const resolvedPath = path.resolve(projectPath);
  const existing = db.getFeaturesEvolution(resolvedPath);
  const traces = db.getTraces(resolvedPath, 200);

  // If already up-to-date, return immediately
  if (existing.length >= traces.length && traces.length > 0) {
    return existing;
  }

  console.log(`[Feature Evolution] Initializing features_evolution table from ${traces.length} historical SQLite traces...`);
  db.clearFeaturesEvolution(resolvedPath);

  // Sort traces chronologically (oldest first)
  const sortedTraces = [...traces].reverse();

  const previousCumulative = {
    features: 0,
    additions: 0,
    deletions: 0,
    knownFiles: new Set()
  };

  const milestones = [];
  sortedTraces.forEach((trace, idx) => {
    const milestone = buildMilestoneFromTrace(trace, idx + 1, previousCumulative);
    db.saveFeatureEvolutionStep(milestone, resolvedPath);
    milestones.push(milestone);
  });

  console.log(`[Feature Evolution] Successfully backfilled ${milestones.length} milestones into SQLite features_evolution table.`);
  return milestones;
}

/**
 * Get comprehensive Features Over Time payload for API response
 */
function getFeaturesEvolutionPayload(projectPath = '.') {
  const resolvedPath = path.resolve(projectPath);
  let milestones = db.getFeaturesEvolution(resolvedPath);

  if (milestones.length === 0) {
    milestones = ensureFeaturesEvolutionInitialized(resolvedPath);
  }

  // Calculate summary metrics
  let totalFeaturesAdded = 0;
  let totalFeaturesModified = 0;
  let totalFeaturesRemoved = 0;
  let totalAdditions = 0;
  let totalDeletions = 0;
  const allFiles = new Set();

  milestones.forEach(m => {
    totalFeaturesAdded += (m.featuresAdded || []).length;
    totalFeaturesModified += (m.featuresModified || []).length;
    totalFeaturesRemoved += (m.featuresRemoved || []).filter(r => !r.includes('No deprecated')).length;
    totalAdditions += (m.metrics?.additions || 0);
    totalDeletions += (m.metrics?.deletions || 0);
    (m.filesChanged || []).forEach(f => allFiles.add(f.file));
  });

  // Prepare graph points
  const graphData = milestones.map(m => ({
    index: m.milestoneIndex,
    label: `M${m.milestoneIndex}`,
    title: m.title,
    task: m.task,
    timestamp: m.timestamp,
    traceId: m.traceId,
    cumulativeFeatures: m.metrics?.cumulativeFeatures || 0,
    additions: m.metrics?.additions || 0,
    deletions: m.metrics?.deletions || 0,
    featuresAddedCount: (m.featuresAdded || []).length,
    featuresModifiedCount: (m.featuresModified || []).length,
    featuresRemovedCount: (m.featuresRemoved || []).filter(r => !r.includes('No deprecated')).length
  }));

  const projectName = path.basename(resolvedPath) || 'VibeTrace';

  return {
    success: true,
    projectName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalMilestones: milestones.length,
      totalFeaturesAdded,
      totalFeaturesModified,
      totalFeaturesRemoved,
      totalFilesEvolved: allFiles.size,
      totalAdditions,
      totalDeletions
    },
    graphData,
    milestones: [...milestones].reverse() // Present newest first in list, while graph is chronological
  };
}

module.exports = {
  extractFeaturesFromTrace,
  generateMilestoneNarrative,
  formatFilesChanged,
  buildMilestoneFromTrace,
  recordTraceMilestone,
  ensureFeaturesEvolutionInitialized,
  getFeaturesEvolutionPayload
};
