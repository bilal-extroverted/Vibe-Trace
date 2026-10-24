// VibeTrace Observability & Trace Engine
// Analyzes real filesystem mutations, Git diffs, and repository harness context

const crypto = require('crypto');

function generateTraceId() {
  return crypto.randomBytes(12).toString('hex');
}

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Generate real trace object from git diffs and context
function generateTraceObject({ prompt, diffs = [], gitContext = {}, harnessRules = '', aiResponse = null, latencyMs = 240, modelUsed = 'heuristic-tracer' }) {
  const files = diffs.map(d => d.file || '');
  const diffContent = diffs.map(d => d.content || '').join('\n');
  const additions = (diffContent.match(/^\+[^+]/gm) || []).length;
  const deletions = (diffContent.match(/^-[^-]/gm) || []).length;

  const traceId = generateTraceId();
  const timestamp = formatTimestamp();

  // Subsystem classification
  const dbFiles = files.filter(f => /\.(sql|prisma)$|migration|schema|database/i.test(f));
  const logicFiles = files.filter(f => /\.(js|ts|py|go|rs|jsx|tsx|html|css|c|cpp|java)$/i.test(f) && !dbFiles.includes(f));
  const configFiles = files.filter(f => /(\.env|config|\.ya?ml|\.toml|\.json)/i.test(f));

  let changeType = 'Code Mutation';
  if (dbFiles.length > 0) changeType = 'Database Update';
  else if (configFiles.length > 0 && logicFiles.length === 0) changeType = 'Config Update';
  else if (additions > 50 && deletions > 30) changeType = 'Architectural Refactor';

  const summary = aiResponse?.summary || `Observed code modifications across ${files.length} file(s). Added ${additions} line(s), removed ${deletions} line(s).`;
  const architecturalImpact = aiResponse?.architecturalImpact || `Files modified in ${files.slice(0, 3).join(', ')}. Code structure updated with consistent boundaries.`;
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
    summary,
    architecturalImpact,
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
    harness: {
      rulesLoaded: Boolean(harnessRules && harnessRules.length > 10),
      rulesPreview: (harnessRules || 'Standard workspace guidelines').slice(0, 300)
    },
    diffs
  };
}

// OpenRouter API call with cascade
async function callOpenRouter(apiKey, modelList, promptText, diffSummary, harnessRules) {
  const systemPrompt = `You are VibeTrace, an industrial AI observability and traceability system for codebases and agent harness engineering.
Analyze the prompt and code diffs, and return a strict JSON object:
{
  "title": "Concise 3-6 word summary of what the code change did",
  "summary": "2-3 clear, technical sentences explaining what was implemented, refactored, or fixed",
  "architecturalImpact": "A concise assessment of how this change impacts system architecture and downstream dependencies"
}
Return ONLY valid JSON.`;

  const userPrompt = `Context: "${promptText}"
Harness Rules: "${harnessRules.slice(0, 1000)}"
Code Changes:
${diffSummary.slice(0, 3500)}`;

  for (const model of modelList) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

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
          max_tokens: 350
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices[0].message.content;
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return { parsed, modelUsed: model };
        }
      }
    } catch (e) {
      // try next candidate
    }
  }

  return null;
}

async function analyze({ prompt, diffs = [], gitContext = {}, harnessRules = '' }) {
  const startTime = Date.now();
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const configuredModel = (process.env.OPENROUTER_API_MODEL || 'thinkingmachines/inkling-small:free').trim();

  const modelsToTry = [
    configuredModel,
    'nvidia/nemotron-3.5-lightning:free'
  ];

  const diffSummary = diffs.map(d => `File: ${d.file}\nStatus: ${d.status}\n${d.content}`).join('\n---\n');

  if (apiKey) {
    const aiResult = await callOpenRouter(apiKey, modelsToTry, prompt, diffSummary, harnessRules);
    if (aiResult && aiResult.parsed) {
      const latencyMs = Date.now() - startTime;
      return generateTraceObject({
        prompt,
        diffs,
        gitContext,
        harnessRules,
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
    harnessRules,
    latencyMs: 120,
    modelUsed: 'heuristic-tracer'
  });
}

module.exports = { analyze };
