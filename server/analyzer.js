// VibeTrace Causal Intelligence & OpenRouter Engine
// Evaluates prompt intent vs. diffs to detect architectural and permission drift

// Rule-based heuristic analyzer (Instant, robust, runs offline with zero API key)
function analyzeWithHeuristics({ prompt, diffs = [], gitContext = {} }) {
  const files = diffs.map(d => d.file || '');
  const diffContent = diffs.map(d => d.content || '').join('\n');

  // Subsystem layer detection
  const dbFiles = files.filter(f => /\.(sql|prisma)$|migration|schema|database/i.test(f));
  const logicFiles = files.filter(f => /\.(js|ts|py|go|rs|jsx|tsx)$/i.test(f) && !dbFiles.includes(f));
  const configFiles = files.filter(f => /(\.env|config|\.ya?ml|\.toml)/i.test(f) && !/permission|auth|key/i.test(f));
  const permFiles = files.filter(f => /permission|auth|token|secret|key|policy|\.env/i.test(f) || /chmod|public_access|0777|allow_all/i.test(diffContent));

  const promptLower = (prompt || '').toLowerCase();
  const isDbPrompt = /table|database|schema|migration|column|model/i.test(promptLower);
  const isAuthPrompt = /permission|auth|role|access|login|security|secret/i.test(promptLower);

  // Drift condition: Sensitive security/permissions touched when prompt was non-security (e.g. database table)
  let driftDetected = false;
  let driftMessage = '';

  if (permFiles.length > 0 && !isAuthPrompt) {
    driftDetected = true;
    driftMessage = `Unintended Drift Warning: Permission/security files (${permFiles.join(', ')}) were modified without an explicit security prompt.`;
  }

  // Determine Title and Plain-English Summary
  let title = 'Code Modifications Detected';
  let summary = 'The AI agent made changes across your workspace.';

  if (isDbPrompt && dbFiles.length > 0) {
    title = `Created Database Table Schema`;
    summary = `The AI created or updated database schema definitions in ${dbFiles.join(', ')}.`;
    if (driftDetected) {
      summary += ` However, it also silently altered permissions in ${permFiles.join(', ')}, which was outside your stated prompt.`;
    }
  } else if (logicFiles.length > 0) {
    title = `Updated Application Logic`;
    summary = `Modified application code across ${logicFiles.slice(0, 3).join(', ')}.`;
  }

  // Construct structured fishbone layers
  const layers = [
    {
      name: 'Database Layer',
      status: dbFiles.length > 0 ? (isDbPrompt ? 'intended' : 'drift') : 'neutral',
      description: dbFiles.length > 0 
        ? `Modified schema/tables in: ${dbFiles.join(', ')}` 
        : 'No database schema changes in this step.',
      files: dbFiles
    },
    {
      name: 'Application Logic',
      status: logicFiles.length > 0 ? 'intended' : 'neutral',
      description: logicFiles.length > 0 
        ? `Updated business logic in: ${logicFiles.join(', ')}` 
        : 'No core application logic modified.',
      files: logicFiles
    },
    {
      name: 'Configuration',
      status: configFiles.length > 0 ? 'intended' : 'neutral',
      description: configFiles.length > 0 
        ? `Altered configuration files: ${configFiles.join(', ')}` 
        : 'Configuration unchanged.',
      files: configFiles
    },
    {
      name: 'Configuration & Permissions',
      status: permFiles.length > 0 ? (driftDetected ? 'drift' : 'intended') : 'neutral',
      description: permFiles.length > 0
        ? (driftDetected 
            ? `WARNING: Security rules altered in ${permFiles.join(', ')} without explicit request!` 
            : `Updated security rules in ${permFiles.join(', ')}`)
        : 'Security and permission boundaries remained untouched.',
      files: permFiles
    }
  ];

  return {
    title,
    summary,
    fishbone: {
      cause: prompt || 'AI Agent Prompt',
      layers
    },
    driftDetected,
    driftMessage,
    git: {
      branch: gitContext.branch || 'main',
      filesChanged: files,
      additions: (diffContent.match(/^\+[^+]/gm) || []).length,
      deletions: (diffContent.match(/^-[^-]/gm) || []).length
    },
    diffs
  };
}

// OpenRouter API Analyzer with heuristic fallback
async function analyze({ prompt, diffs = [], gitContext = {}, harnessRules = '' }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Instant heuristic fallback
    return analyzeWithHeuristics({ prompt, diffs, gitContext });
  }

  try {
    const diffSummary = diffs.map(d => `File: ${d.file}\nStatus: ${d.status}\n${d.content}`).join('\n---\n');

    const systemPrompt = `You are VibeTrace, an expert AI observability engine for developer code changes.
Given a prompt intent and code diffs, produce a valid JSON object analyzing the cause-and-effect:
{
  "title": "Short 3-6 word plain English highlight of what was done",
  "summary": "2-3 sentences explaining to a non-technical or junior developer what changed and any consequences",
  "driftDetected": boolean (true if the AI modified permissions, configs, or files outside the prompt's intent),
  "driftMessage": "Clear warning if driftDetected is true, else empty string",
  "layers": [
    {
      "name": "Database Layer",
      "status": "intended" | "drift" | "neutral",
      "description": "What changed here",
      "files": ["file names"]
    },
    {
      "name": "Application Logic",
      "status": "intended" | "drift" | "neutral",
      "description": "What changed here",
      "files": ["file names"]
    },
    {
      "name": "Configuration",
      "status": "intended" | "drift" | "neutral",
      "description": "What changed here",
      "files": ["file names"]
    },
    {
      "name": "Configuration & Permissions",
      "status": "intended" | "drift" | "neutral",
      "description": "What changed here",
      "files": ["file names"]
    }
  ]
}
Return ONLY pure JSON.`;

    const userPrompt = `User Prompt / Intent: "${prompt}"
Agent Harness Rules: "${harnessRules || 'Standard repo rules'}"
Code Diffs:
${diffSummary.slice(0, 4000)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/challengepost/learn-ai-basics',
        'X-Title': 'VibeTrace'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[VibeTrace] OpenRouter HTTP ${response.status}, falling back to local heuristics.`);
      return analyzeWithHeuristics({ prompt, diffs, gitContext });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      title: parsed.title,
      summary: parsed.summary,
      driftDetected: Boolean(parsed.driftDetected),
      driftMessage: parsed.driftMessage || '',
      fishbone: {
        cause: prompt,
        layers: parsed.layers
      },
      git: {
        branch: gitContext.branch || 'main',
        filesChanged: diffs.map(d => d.file),
        additions: (diffSummary.match(/^\+[^+]/gm) || []).length,
        deletions: (diffSummary.match(/^-[^-]/gm) || []).length
      },
      diffs
    };
  } catch (err) {
    console.warn(`[VibeTrace] OpenRouter error (${err.message}), using local heuristic engine.`);
    return analyzeWithHeuristics({ prompt, diffs, gitContext });
  }
}

module.exports = { analyze, analyzeWithHeuristics };
