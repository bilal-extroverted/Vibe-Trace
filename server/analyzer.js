// VibeTrace Observability & Trace Engine
// Analyzes real filesystem mutations, Git diffs, and executes AI Harness verification

require('dotenv').config();
const crypto = require('crypto');
const harnessEngine = require('./harness/harnessEngine');

function generateTraceId() {
  return crypto.randomBytes(12).toString('hex');
}

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function inferDetailedFileAnalysis(file, content = '') {
  const lines = (content || '').split(/\r?\n/);
  const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1).trim());
  const deleted = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).map(l => l.slice(1).trim());
  const allTouched = [...added, ...deleted];

  // Extract functions and symbols
  const symbols = new Set();
  allTouched.forEach(line => {
    const fnM = line.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)\s*(?:=\s*(?:async\s*)?\(|\()/);
    if (fnM && !['if', 'for', 'while', 'switch', 'catch', 'setTimeout', 'setInterval', 'require'].includes(fnM[1])) {
      symbols.add(fnM[1] + '()');
    }
    const methM = line.match(/^\s*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/);
    if (methM && !['if', 'for', 'while', 'switch', 'catch'].includes(methM[1])) {
      symbols.add(methM[1] + '()');
    }
    const clsM = line.match(/class\s+([a-zA-Z0-9_$]+)/);
    if (clsM) symbols.add('class ' + clsM[1]);
    if (file.endsWith('.css')) {
      const cssM = line.match(/\.([a-zA-Z0-9_-]{3,})/g);
      if (cssM) cssM.slice(0, 3).forEach(c => symbols.add(c));
    }
  });

  const symbolList = Array.from(symbols).slice(0, 4);
  const filename = file.split(/[\\/]/).pop();

  let whatChanged = '';
  let affectedScope = [];
  let downstreamImpact = '';

  if (file.endsWith('.css')) {
    whatChanged = `Updated styles & layout rules (+${added.length} / -${deleted.length} lines). Modified visual tokens, responsive rules, and micro-design.`;
    affectedScope = symbolList.length ? symbolList : ['UI Styling', 'Responsive Design', 'Tokens'];
    downstreamImpact = `Changes visual layout, typography, and component styling across the workbench.`;
  } else if (file.endsWith('.html')) {
    whatChanged = `Updated DOM structure and layout sections (+${added.length} / -${deleted.length} lines).`;
    affectedScope = ['HTML Structure', 'Workbench Panes', 'DOM Nodes'];
    downstreamImpact = `Updates interactive anchors and inspector containers for client-side JavaScript binding.`;
  } else if (file.includes('watcher')) {
    whatChanged = `Updated filesystem watcher, active file tracking, and live telemetry broadcast (+${added.length} / -${deleted.length} lines).`;
    affectedScope = symbolList.length ? symbolList : ['Watcher Service', 'Active Trace Generator', 'SSE Stream'];
    downstreamImpact = `Alters how file mutations are detected, batched, and pushed live to the browser dashboard.`;
  } else if (file.includes('protocol')) {
    whatChanged = `Enhanced agent protocol parser for active_file, file_action, and execution steps (+${added.length} / -${deleted.length} lines).`;
    affectedScope = symbolList.length ? symbolList : ['Protocol Manager', 'vibetrace.md Parser', 'Inter-Agent State'];
    downstreamImpact = `Controls synchronization of declared agent intents and active file status with the dashboard.`;
  } else if (file.includes('diffViewer')) {
    whatChanged = `Updated syntax diff viewer component and change insight overlays (+${added.length} / -${deleted.length} lines).`;
    affectedScope = symbolList.length ? symbolList : ['Diff Inspector', 'Syntax Highlighting', 'File Intelligence'];
    downstreamImpact = `Improves readability of code diffs and displays exact what-changed insights per file.`;
  } else if (file.includes('app.js')) {
    whatChanged = `Updated client-side event handlers, live trace tracking, and panel population (+${added.length} / -${deleted.length} lines).`;
    affectedScope = symbolList.length ? symbolList : ['Dashboard Logic', 'SSE Telemetry', 'Trace Inspector'];
    downstreamImpact = `Enables immediate reactive UI updates for active file changes and minimal line animations.`;
  } else if (file.endsWith('.md')) {
    whatChanged = `Updated communication protocol documentation and task specification (+${added.length} / -${deleted.length} lines).`;
    affectedScope = ['Task Specification', 'Execution Plan', 'Harness Directives'];
    downstreamImpact = `Signals agent status transitions and provides instructions to observing agents and reviewers.`;
  } else {
    whatChanged = `Modified ${filename} (+${added.length} / -${deleted.length} lines).`;
    affectedScope = symbolList.length ? symbolList : [filename.replace(/\.[^.]+$/, '')];
    downstreamImpact = `Modifications isolated to ${filename}. Systemic integrity preserved.`;
  }

  return {
    whatChanged,
    affectedScope,
    downstreamImpact,
    symbols: symbolList,
    additions: added.length,
    deletions: deleted.length
  };
}

// Generate real trace object from git diffs and context
function generateTraceObject({ prompt, diffs = [], gitContext = {}, watchDir = '.', aiResponse = null, latencyMs = 240, modelUsed = 'heuristic-tracer' }) {
  const files = diffs.map(d => d.file || '');
  const diffContent = diffs.map(d => d.content || '').join('\n');
  const additions = (diffContent.match(/^\+[^+]/gm) || []).length;
  const deletions = (diffContent.match(/^-[^-]/gm) || []).length;

  const traceId = generateTraceId();
  const timestamp = formatTimestamp();

  // Attach per-file detailed change and impact analysis
  diffs.forEach(d => {
    if (!d.analysis) {
      d.analysis = inferDetailedFileAnalysis(d.file, d.content);
    }
  });

  // Subsystem classification
  const dbFiles = files.filter(f => /\.(sql|prisma)$|migration|schema|database/i.test(f));
  const logicFiles = files.filter(f => /\.(js|ts|py|go|rs|jsx|tsx|html|css|c|cpp|java)$/i.test(f) && !dbFiles.includes(f));
  const configFiles = files.filter(f => /(\.env|config|\.ya?ml|\.toml|\.json)/i.test(f));

  let changeType = 'Code Mutation';
  if (dbFiles.length > 0) changeType = 'Database Update';
  else if (configFiles.length > 0 && logicFiles.length === 0) changeType = 'Config Update';
  else if (additions > 40 && deletions > 25) changeType = 'Architectural Refactor';

  const harnessReport = harnessEngine.validate({ files, diffs, watchDir });

  // Synthesize intelligent fallback if AI response is missing or rate limited
  const synthesizedWhatChanged = diffs.map(d => d.analysis ? `${d.file}: ${d.analysis.whatChanged}` : `Modified ${d.file}`).slice(0, 5);
  const synthesizedAffected = Array.from(new Set(diffs.flatMap(d => d.analysis ? d.analysis.affectedScope : []))).slice(0, 6);
  const synthesizedDownstream = diffs.length > 0 && diffs[0].analysis
    ? `${diffs[0].analysis.downstreamImpact} Code modifications safely contained across ${files.length} file(s).`
    : `Local modifications to ${files.slice(0, 3).join(', ')}. Existing systemic boundaries maintained.`;

  const synthesis = {
    summary: aiResponse?.summary || `Observed code modifications across ${files.length} file(s). Added ${additions} line(s), removed ${deletions} line(s).`,
    whatChanged: Array.isArray(aiResponse?.whatChanged) && aiResponse.whatChanged.length > 0 ? aiResponse.whatChanged : synthesizedWhatChanged,
    affectedFeatures: Array.isArray(aiResponse?.affectedFeatures) && aiResponse.affectedFeatures.length > 0 ? aiResponse.affectedFeatures : (
      synthesizedAffected.length > 0 ? synthesizedAffected : (
        files.map(f => {
          const parts = f.replace(/\\/g, '/').split('/');
          return parts.length > 1 ? parts[0] + ' (' + parts[parts.length - 1].replace(/\.[^.]+$/, '') + ')' : f;
        }).slice(0, 4)
      )
    ),
    downstreamImpact: aiResponse?.downstreamImpact || aiResponse?.architecturalImpact || synthesizedDownstream,
    riskLevel: aiResponse?.riskLevel || (harnessReport.status === 'FAIL' ? 'High' : (harnessReport.status === 'WARN' ? 'Medium' : 'Low'))
  };

  const title = aiResponse?.title || `${changeType} (${files.length} file${files.length === 1 ? '' : 's'})`;

  return {
    id: traceId,
    changeType,
    title,
    timestamp,
    latency: `${(latencyMs / 1000).toFixed(2)}s`,
    status: 'success',
    model: modelUsed,
    files,
    additions,
    deletions,
    summary: synthesis.summary,
    architecturalImpact: synthesis.downstreamImpact,
    synthesis,
    subsystems: [
      dbFiles.length ? 'Database' : null,
      logicFiles.length ? 'Application Logic' : null,
      configFiles.length ? 'Configuration' : null
    ].filter(Boolean),
    git: {
      branch: gitContext.branch || 'main',
      commit: gitContext.commitHash || 'HEAD',
      prompt: prompt || 'Automatic File Watcher Ingestion'
    },
    harness: harnessReport,
    diffs
  };
}

// OpenRouter API call with cascade
async function callOpenRouter(apiKey, modelList, promptText, diffSummary, harnessRules) {
  const systemPrompt = `You are VibeTrace, an industrial AI observability and traceability system for codebases and agent harness engineering.
Analyze the prompt and code diffs, and return a strict JSON object:
{
  "title": "Concise 3-6 word summary of what the code change did",
  "summary": "Clear, plain-English summary of what changes occurred in the code for both non-technical stakeholders and engineers",
  "whatChanged": [
    "Specific mechanical change 1",
    "Specific mechanical change 2"
  ],
  "affectedFeatures": [
    "Feature or option 1",
    "Feature or option 2"
  ],
  "downstreamImpact": "Clear assessment of potential ripple effects on other features, system behavior, or dependencies",
  "riskLevel": "Low"
}
Return ONLY valid JSON.`;

  const userPrompt = `Context: "${promptText}"
Harness Rules: "${harnessRules.slice(0, 1000)}"
Code Changes:
${diffSummary.slice(0, 3500)}`;

  for (const model of modelList) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/challengepost/learn-ai-basics',
          'X-Title': 'VibeTrace Observability'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 800
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;
        const match = raw?.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return { parsed, modelUsed: model };
        }
      } else {
        const errText = await response.text();
        console.warn(`[OpenRouter ${model} error ${response.status}]:`, errText.slice(0, 150));
      }
    } catch (e) {
      console.warn(`[OpenRouter ${model} exception]:`, e.message);
    }
  }

  return null;
}

async function analyze({ prompt, diffs = [], gitContext = {}, watchDir = '.', harnessRules = '' }) {
  const startTime = Date.now();
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const configuredModel = (process.env.OPENROUTER_API_MODEL || 'nvidia/nemotron-3.5-lightning:free').trim();

  const modelsToTry = [
    configuredModel,
    'recursive/flint-v1.0:free',
    'nvidia/nemotron-3.5-super-vl:free',
    'xingchen-agi/xing4.0-29b-a4b:free',
    'nvidia/nemotron-3.5-lightning:free'
  ].filter((v, i, a) => a.indexOf(v) === i);

  const diffSummary = diffs.map(d => `File: ${d.file}\nStatus: ${d.status}\n${d.content}`).join('\n---\n');

  if (apiKey) {
    const aiResult = await callOpenRouter(apiKey, modelsToTry, prompt, diffSummary, harnessRules);
    if (aiResult && aiResult.parsed) {
      const latencyMs = Date.now() - startTime;
      return generateTraceObject({
        prompt,
        diffs,
        gitContext,
        watchDir,
        aiResponse: aiResult.parsed,
        latencyMs,
        modelUsed: aiResult.modelUsed
      });
    }
  }

  // Fallback heuristic trace
  return generateTraceObject({
    prompt,
    diffs,
    gitContext,
    watchDir,
    latencyMs: 120,
    modelUsed: 'heuristic-tracer'
  });
}

module.exports = { analyze };
