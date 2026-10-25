// VibeTrace AI Mind Map Engine
// Synthesizes repository evolution, subsystem taxonomy, flaw detection, and visual mind map diagram

const path = require('path');

// Subsystem Classifier
function classifyFileSubsystem(filePath) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('style.css') || norm.includes('css') || norm.includes('fonts') || norm.includes('theme')) {
    return { id: 'styling', name: 'Design System & CSS', category: 'Frontend', color: '#10b981' };
  }
  if (norm.includes('public/app.js') || norm.includes('index.html') || norm.includes('diffviewer') || norm.includes('public/')) {
    return { id: 'frontend', name: 'UI & Observability Feed', category: 'Frontend', color: '#3b82f6' };
  }
  if (norm.includes('server/index.js') || norm.includes('server/db.js')) {
    return { id: 'backend', name: 'Backend Daemon & SQLite DB', category: 'Backend', color: '#6366f1' };
  }
  if (norm.includes('analyzer') || norm.includes('queryengine') || norm.includes('mindmapengine')) {
    return { id: 'ai_engine', name: 'AI Synthesis & OpenRouter Cascade', category: 'AI Intelligence', color: '#8b5cf6' };
  }
  if (norm.includes('protocol') || norm.includes('watcher') || norm.includes('vibetrace.md') || norm.includes('.agents')) {
    return { id: 'harness', name: 'VibeTrace Protocol & Watcher', category: 'Harness', color: '#f59e0b' };
  }
  if (norm.includes('devpost') || norm.includes('readme') || norm.includes('license') || norm.includes('.md')) {
    return { id: 'documentation', name: 'Docs & Competition Submission', category: 'Documentation', color: '#ec4899' };
  }
  return { id: 'core', name: 'Repository Core & Configs', category: 'Core', color: '#64748b' };
}

// Deterministic Heuristic Analysis & Flaw Scanner
function analyzeRepositoryTraces(traces, projectName = 'Repository') {
  const subsystemMap = new Map();
  const allFiles = new Set();
  let totalAdditions = 0;
  let totalDeletions = 0;
  const recentIntents = [];

  // 1. Ingest all traces
  traces.forEach((trace, idx) => {
    const files = trace.files || (trace.diffs ? trace.diffs.map(d => d.file) : []);
    const additions = trace.additions || 0;
    const deletions = trace.deletions || 0;
    totalAdditions += additions;
    totalDeletions += deletions;

    const taskName = trace.agentProtocol?.task || trace.title || 'Code Refactor';
    if (idx < 8) {
      recentIntents.push({
        id: trace.id,
        task: taskName,
        time: trace.timestamp,
        filesCount: files.length,
        additions,
        deletions,
        status: trace.inProgress ? 'in_progress' : 'completed'
      });
    }

    files.forEach(file => {
      allFiles.add(file);
      const sub = classifyFileSubsystem(file);
      if (!subsystemMap.has(sub.id)) {
        subsystemMap.set(sub.id, {
          id: sub.id,
          name: sub.name,
          category: sub.category,
          color: sub.color,
          files: new Set(),
          traceCount: 0,
          additions: 0,
          deletions: 0,
          tasks: new Set()
        });
      }
      const entry = subsystemMap.get(sub.id);
      entry.files.add(file);
      entry.traceCount += 1;
      entry.additions += additions;
      entry.deletions += deletions;
      entry.tasks.add(taskName);
    });
  });

  // Convert map to array
  const subsystems = Array.from(subsystemMap.values()).map(sub => ({
    id: sub.id,
    name: sub.name,
    category: sub.category,
    color: sub.color,
    fileCount: sub.files.size,
    files: Array.from(sub.files),
    traceCount: sub.traceCount,
    additions: sub.additions,
    deletions: sub.deletions,
    tasks: Array.from(sub.tasks).slice(0, 4)
  }));

  // 2. Automated Flaw & Risk Detection Scanner
  const flawsAndRisks = [];

  // Check 1: OpenRouter API cascading & rate limit exposure
  const aiSubsystem = subsystems.find(s => s.id === 'ai_engine');
  if (aiSubsystem) {
    flawsAndRisks.push({
      id: 'flaw-openrouter-ratelimit',
      severity: 'medium',
      subsystem: 'AI Intelligence',
      title: 'Free Model Rate Limit (HTTP 429) Cascading Risk',
      detail: 'OpenRouter free-tier models enforce strict daily/hourly token quotas. While model cascading is configured, high-frequency watcher sweeps may trigger repeated 429 errors.',
      remedy: 'Local heuristic fallbacks are active. Ensure debouncing interval remains >= 500ms and model cascade includes at least 3 distinct free providers.'
    });
  }

  // Check 2: High mutation churn in styling
  const styleSub = subsystems.find(s => s.id === 'styling');
  if (styleSub && styleSub.traceCount > 5) {
    flawsAndRisks.push({
      id: 'flaw-css-specificity',
      severity: 'low',
      subsystem: 'Design System & CSS',
      title: 'CSS Specificity & !important Accumulation',
      detail: `${styleSub.traceCount} recent traces modified styling. Multiple theme overrides utilize !important tags to enforce palette consistency, which can introduce CSS cascade contention.`,
      remedy: 'Consolidate styles into CSS root custom properties (--bg-surface, --text-primary) so dark/light switching does not require component-level !important rules.'
    });
  }

  // Check 3: Synchronous / Asynchronous Daemon Lifecycle
  const backendSub = subsystems.find(s => s.id === 'backend');
  if (backendSub) {
    flawsAndRisks.push({
      id: 'flaw-db-locking',
      severity: 'low',
      subsystem: 'Backend Daemon & SQLite DB',
      title: 'SQLite Single-Writer Concurrency Consideration',
      detail: 'VibeTrace stores mutations in vibetrace.db via better-sqlite3 with WAL journal mode. High-volume concurrent file writes must stay non-blocking.',
      remedy: 'Keep WAL (Write-Ahead Logging) enabled and verify debounced batch writes in watcherEngine.'
    });
  }

  // Check 4: Test Coverage & Regression Protection
  const hasTests = Array.from(allFiles).some(f => f.includes('test') || f.includes('spec') || f.includes('__tests__'));
  if (!hasTests) {
    flawsAndRisks.push({
      id: 'flaw-automated-tests',
      severity: 'medium',
      subsystem: 'Quality Assurance',
      title: 'Absence of Automated End-to-End Test Suite',
      detail: 'No automated Playwright or Jest unit tests were detected in the touched files. Manual verification is currently the primary validation gate.',
      remedy: 'Introduce lightweight smoke tests for /api/traces, SSE live streams, and syntax validation.'
    });
  }

  // 3. Build Mind Map Hierarchical Tree Structure
  const treeRoot = {
    id: 'root-repo',
    label: projectName,
    type: 'root',
    metrics: {
      totalTraces: traces.length,
      totalFiles: allFiles.size,
      additions: totalAdditions,
      deletions: totalDeletions
    },
    children: subsystems.map(sub => ({
      id: `node-${sub.id}`,
      label: sub.name,
      category: sub.category,
      color: sub.color,
      type: 'subsystem',
      fileCount: sub.fileCount,
      children: sub.files.map(filePath => ({
        id: `node-file-${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        label: path.basename(filePath),
        path: filePath,
        type: 'file',
        subsystem: sub.name
      }))
    }))
  };

  // 4. Generate Mermaid Mind Map Syntax String
  let mermaid = `mindmap\n  root(("${projectName}"))\n`;
  subsystems.forEach(sub => {
    mermaid += `    ${sub.name.replace(/[^a-zA-Z0-9 ]/g, '')}\n`;
    sub.files.slice(0, 4).forEach(f => {
      mermaid += `      ["${path.basename(f)}"]\n`;
    });
  });

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalTraces: traces.length,
      totalFiles: allFiles.size,
      subsystemsCount: subsystems.length,
      flawsCount: flawsAndRisks.length,
      additions: totalAdditions,
      deletions: totalDeletions
    },
    executiveSummary: `Observed ${traces.length} execution traces impacting ${allFiles.size} distinct files across ${subsystems.length} core architectural subsystems. The codebase has undergone significant visual, protocol, and observability refinement, moving from basic mutation logging to real-time agent-harness telemetry with persistent SQLite tracking.`,
    subsystems,
    flawsAndRisks,
    recentIntents,
    treeRoot,
    diagramMermaid: mermaid,
    recommendations: [
      'Maintain strict 4-color dark theme palette (#C5D4CA, #FFFFFF, #444242, #312F30) across all future components.',
      'Keep VibeTrace markdown protocol updated with task lifecycle states (WORKING, EDITING, COMPLETED).',
      'Leverage local heuristic fallback whenever OpenRouter upstream free quotas return HTTP 429.'
    ]
  };
}

// Generate Full AI Mind Map via OpenRouter Cascade
async function generateAiMindMap({ traces = [], watchDir = '.', projectName = 'VibeTrace' }) {
  const heuristicData = analyzeRepositoryTraces(traces, projectName);

  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const configuredModel = (process.env.OPENROUTER_API_MODEL || 'thinkingmachines/inkling-small:free').trim();

  const modelsToTry = [
    configuredModel,
    'nvidia/nemotron-3.5-lightning:free',
    'google/gemma-4-26b-a4b-it:free'
  ];

  if (!apiKey || traces.length === 0) {
    return {
      ...heuristicData,
      source: 'heuristic',
      modelUsed: 'local-heuristic-engine'
    };
  }

  // Construct prompt for OpenRouter
  const systemPrompt = `You are VibeTrace AI Architecture Engine.
Analyze the provided repository traces, file mutations, and detected subsystem graph.
Return ONLY a valid JSON object with architectural insights, systemic flaws, and an executive summary.

JSON Structure:
{
  "executiveSummary": "Concise 2-3 sentence technical overview of what was changed and the current state.",
  "aiInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "flawsAndRisks": [
    {
      "severity": "high"|"medium"|"low",
      "subsystem": "Name of subsystem",
      "title": "Short flaw title",
      "detail": "Why this is a flaw or potential hazard",
      "remedy": "How to resolve or mitigate it"
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

  const userContent = `Repository: ${projectName}
Traces Count: ${traces.length}
Total Files Touched: ${heuristicData.metrics.totalFiles}
Subsystems: ${heuristicData.subsystems.map(s => `${s.name} (${s.files.join(', ')})`).join('; ')}

Recent Traces & Tasks:
${heuristicData.recentIntents.map(t => `- [${t.status.toUpperCase()}] "${t.task}" touching ${t.filesCount} files (+${t.additions}/-${t.deletions})`).join('\n')}

Detect any architectural flaws, regression vulnerabilities, edge cases, or optimization needs across these changes.`;

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/challengepost/learn-ai-basics',
          'X-Title': 'VibeTrace MindMap'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...heuristicData,
            source: 'openrouter',
            modelUsed: model,
            executiveSummary: parsed.executiveSummary || heuristicData.executiveSummary,
            aiInsights: parsed.aiInsights || [],
            flawsAndRisks: parsed.flawsAndRisks?.length ? parsed.flawsAndRisks : heuristicData.flawsAndRisks,
            recommendations: parsed.recommendations?.length ? parsed.recommendations : heuristicData.recommendations
          };
        }
      }
    } catch (err) {
      // Cascade to next model or fallback
    }
  }

  // Graceful fallback to heuristic analysis
  return {
    ...heuristicData,
    source: 'heuristic_fallback',
    modelUsed: 'local-heuristic-engine'
  };
}

module.exports = {
  classifyFileSubsystem,
  analyzeRepositoryTraces,
  generateAiMindMap
};
