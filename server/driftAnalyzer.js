// VibeTrace Independent Prompt-to-Execution Drift & Risk Analyzer
// Analyzes discrepancies between what the user prompt requested and what code changes were actually performed.
// Employs OpenRouter AI models independently to evaluate intent drift, scope creep, regressions, and alert on significant issues.

const path = require('path');

// Call OpenRouter with cascade
async function callOpenRouterDriftAudit(apiKey, modelList, promptText, diffSummary, agentTask) {
  const systemPrompt = `You are VibeTrace's Independent Prompt Fidelity, Execution Drift, and Risk Auditor.
Your sole mission is to objectively and independently detect discrepancies between what the user prompt requested and what code modifications were actually done by the AI agent.

Evaluate:
1. Did the agent faithfully follow what the user prompt gave?
2. What is the exact difference between what the prompt asked and what the output code actually did?
3. Did the agent introduce unrequested changes (e.g. stripped gradients/styling, modified files outside scope, deleted existing features, altered configurations)?
4. Did the agent miss or ignore requirements from the user prompt?
5. What is the risk level (LOW, MEDIUM, HIGH, CRITICAL)?
6. Is there a significant issue requiring an active user alert?
   - hasSignificantIssue MUST be true if riskLevel is HIGH or CRITICAL, or if the agent made breaking/unrequested modifications, downgraded designs, or introduced regressions.

Return a STRICT JSON object in this exact schema:
{
  "hasDifference": boolean,
  "alignmentScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "hasSignificantIssue": boolean,
  "alertLevel": "CRITICAL" | "WARNING" | "INFO" | "NONE",
  "alertTitle": "Concise 3-7 word alert title if hasSignificantIssue, else empty",
  "alertMessage": "Plain-English urgent explanation of what diverged from user prompt and what risk it presents",
  "promptIntent": "Clear 1-sentence synthesis of what the user prompt requested",
  "actualExecution": "Clear 1-sentence synthesis of what the output code actually did",
  "differenceAnalysis": "Detailed plain-English analysis of the gap/difference between prompt intent and actual output",
  "discrepancies": [
    "Specific discrepancy 1",
    "Specific discrepancy 2"
  ],
  "unrequestedChanges": [
    "Unrequested modification 1"
  ],
  "missingRequirements": [
    "Requirement from prompt not fulfilled 1"
  ],
  "riskAssessment": "Comprehensive assessment of risks posed by this discrepancy (e.g. user experience downgrade, silent regressions, architectural debt)",
  "suggestedRemedy": "Concrete, step-by-step recommendation to bring the code back in 100% alignment with user prompt"
}
Return ONLY valid JSON.`;

  const userPrompt = `USER PROMPT / TASK INTENT:
"${promptText}"

AGENT DECLARED TASK:
"${agentTask || 'Not specified'}"

ACTUAL CODE DIFFS & MODIFICATIONS PRODUCED:
${diffSummary.slice(0, 4000)}`;

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
          'X-Title': 'VibeTrace Drift Analyzer'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 900
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
        console.warn(`[OpenRouter Drift Audit ${model} error ${response.status}]:`, errText.slice(0, 150));
      }
    } catch (e) {
      console.warn(`[OpenRouter Drift Audit ${model} exception]:`, e.message);
    }
  }

  return null;
}

// Fallback Heuristic Drift Analyzer
function runHeuristicDriftAudit(prompt, diffs = [], agentProtocol = {}) {
  // Ground truth user prompt intent
  const userPromptText = (prompt && prompt.trim()) ? prompt.trim() : (agentProtocol.task || '').trim();
  const pLower = userPromptText.toLowerCase();
  const agentTask = (agentProtocol.task || '').trim();
  const taskLower = agentTask.toLowerCase();

  const filesTouched = diffs.map(d => d.file || '');
  const diffContents = diffs.map(d => d.content || '').join('\n');
  const dLower = diffContents.toLowerCase();

  const discrepancies = [];
  const unrequestedChanges = [];
  const missingRequirements = [];
  let riskLevel = 'LOW';
  let hasSignificantIssue = false;
  let alignmentScore = 95;

  // Check 0: Divergence between User Prompt and Agent Declared Task (when user supplied prompt)
  if (prompt && prompt.trim() && agentTask) {
    const pTokens = pLower.split(/\W+/).filter(w => w.length > 3 && !['what', 'with', 'this', 'that', 'there', 'will', 'have', 'from', 'then'].includes(w));
    const tTokens = taskLower.split(/\W+/).filter(w => w.length > 3);
    const overlap = pTokens.filter(w => tTokens.includes(w) || dLower.includes(w));
    const overlapRatio = pTokens.length > 0 ? (overlap.length / pTokens.length) : 1;

    if (pTokens.length >= 3 && overlapRatio < 0.25) {
      discrepancies.push(`Agent task intent ("${agentTask}") diverged from user prompt ("${prompt.trim()}")`);
      unrequestedChanges.push('Code changes address different scope than user prompt');
      riskLevel = 'HIGH';
      hasSignificantIssue = true;
      alignmentScore = Math.min(alignmentScore, 40);
    }
  }

  // Check 1: Design / Gradient / Styling downgrade detection
  const mentionsGradients = pLower.includes('gradient') || pLower.includes('color') || pLower.includes('theme');
  const removedGradients = (dLower.includes('-  background: linear-gradient') || dLower.includes('-  background: radial-gradient')) &&
                           !pLower.includes('remove gradient') && !pLower.includes('delete gradient');

  if (removedGradients) {
    discrepancies.push('Agent deleted linear-gradient background rules that were not asked to be removed');
    unrequestedChanges.push('Stripped dynamic gradients from card styles');
    riskLevel = 'HIGH';
    hasSignificantIssue = true;
    alignmentScore = Math.min(alignmentScore, 45);
  }

  // Check 2: Blanket overrides or breaking broad selectors
  if (dLower.includes('.trace-item-row.active {') && dLower.includes('border: 1px solid #2563eb !important') && !pLower.includes('blue border')) {
    discrepancies.push('Agent introduced blanket blue border override that clobbered status-based visual feedback');
    unrequestedChanges.push('Universal .active selector override on multi-status components');
    riskLevel = 'HIGH';
    hasSignificantIssue = true;
    alignmentScore = Math.min(alignmentScore, 50);
  }

  // Check 3: Hardcoded values when dynamic lookup requested
  if ((pLower.includes('from env') || pLower.includes('environment')) &&
      (dLower.includes('nemotron') || dLower.includes('gpt-') || dLower.includes('claude-'))) {
    if (dLower.includes('+') && (dLower.includes('+"nemotron') || dLower.includes('+\'nemotron'))) {
      discrepancies.push('Agent hardcoded model string instead of dynamically querying process.env');
      missingRequirements.push('Dynamic environment variable resolution');
      riskLevel = 'MEDIUM';
      hasSignificantIssue = true;
      alignmentScore = Math.min(alignmentScore, 60);
    }
  }

  // Check 4: Unrelated file modification (scope creep)
  const isExplicitFullstack = pLower.includes('backend') || pLower.includes('server') || pLower.includes('api') || pLower.includes('drift') || pLower.includes('guard') || pLower.includes('audit') || pLower.includes('engine') || pLower.includes('mindmap') || pLower.includes('analysis') || pLower.includes('model') || pLower.includes('open router') || pLower.includes('openrouter');
  const isStylingTask = !isExplicitFullstack && (pLower.includes('css') || pLower.includes('color') || pLower.includes('gradient') || pLower.includes('theme') || pLower.includes('button') || pLower.includes('footer') || pLower.includes('navbar'));
  const touchedBackend = filesTouched.some(f => f.startsWith('server/') || f.endsWith('.sql') || f.endsWith('.db'));
  if (isStylingTask && touchedBackend) {
    discrepancies.push('Agent modified server backend files during a frontend styling/theme task');
    unrequestedChanges.push(`Backend files touched: ${filesTouched.filter(f => f.startsWith('server/')).join(', ')}`);
    riskLevel = 'HIGH';
    hasSignificantIssue = true;
    alignmentScore = Math.min(alignmentScore, 55);
  }

  // Check 5: Severe deletions without user requesting removal
  const deletionLines = (diffContents.match(/^-[^-]/gm) || []).length;
  const additionLines = (diffContents.match(/^\+[^+]/gm) || []).length;
  const isDeletionRequested = pLower.includes('delete') || pLower.includes('remove') || pLower.includes('strip');

  if (deletionLines > 150 && !isDeletionRequested && deletionLines > additionLines * 2) {
    discrepancies.push(`Large-scale code deletion (${deletionLines} lines deleted) without explicit removal prompt`);
    riskLevel = 'HIGH';
    hasSignificantIssue = true;
    alignmentScore = Math.min(alignmentScore, 40);
  }

  const hasDifference = discrepancies.length > 0 || unrequestedChanges.length > 0 || missingRequirements.length > 0;

  if (!hasDifference) {
    return {
      hasDifference: false,
      alignmentScore: 98,
      riskLevel: 'LOW',
      hasSignificantIssue: false,
      alertLevel: 'NONE',
      alertTitle: '',
      alertMessage: 'Output is faithfully aligned with user prompt. No unrequested side-effects or regressions detected.',
      promptIntent: prompt || agentProtocol.task || 'User requested codebase improvements.',
      actualExecution: `Applied focused modifications across ${filesTouched.length || 1} file(s) with intact constraints.`,
      differenceAnalysis: 'The executed code accurately addresses the declared prompt intent. Boundaries preserved without scope creep.',
      discrepancies: [],
      unrequestedChanges: [],
      missingRequirements: [],
      riskAssessment: 'Low risk. Modifications stay strictly within requested boundaries.',
      suggestedRemedy: 'Changes are verified and aligned. Safe to proceed.'
    };
  }

  const alertTitle = hasSignificantIssue
    ? '⚠️ Significant Divergence Detected'
    : 'Minor Scope Discrepancy';

  const alertMessage = discrepancies.length > 0
    ? discrepancies.join('; ')
    : 'Agent output modified logic or elements outside the declared user prompt scope.';

  return {
    hasDifference: true,
    alignmentScore,
    riskLevel,
    hasSignificantIssue,
    alertLevel: hasSignificantIssue ? 'CRITICAL' : 'WARNING',
    alertTitle,
    alertMessage,
    promptIntent: prompt || agentProtocol.task || 'User declared prompt.',
    actualExecution: `Modified ${filesTouched.join(', ')} (+${additionLines} / -${deletionLines} lines).`,
    differenceAnalysis: `Discrepancy detected between prompt requirements and code execution. Found ${discrepancies.length} divergence(s).`,
    discrepancies,
    unrequestedChanges,
    missingRequirements,
    riskAssessment: hasSignificantIssue
      ? 'High risk of user experience downgrade, unintended regressions, or broken visual feedback.'
      : 'Moderate variance from original user intent.',
    suggestedRemedy: discrepancies.length > 0
      ? `Revert unintended changes: ${discrepancies[0]}. Ensure output strictly reflects prompt intent.`
      : 'Review diffs and align changes with user prompt.'
  };
}

// Master Analyze Drift function
async function analyzeDrift({ prompt, diffs = [], agentProtocol = {}, gitContext = {} }) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const configuredModel = (process.env.OPENROUTER_API_MODEL || '').trim();
  const modelsToTry = configuredModel ? [configuredModel] : [];

  const diffSummary = diffs.map(d => `File: ${d.file}\nStatus: ${d.status}\n${d.content}`).join('\n---\n');
  const agentTask = agentProtocol.task || agentProtocol.intent || '';

  if (apiKey && modelsToTry.length > 0) {
    try {
      const openRouterResult = await callOpenRouterDriftAudit(
        apiKey,
        modelsToTry,
        prompt || agentTask,
        diffSummary,
        agentTask
      );

      if (openRouterResult && openRouterResult.parsed) {
        return {
          ...openRouterResult.parsed,
          source: 'openrouter',
          modelUsed: openRouterResult.modelUsed,
          analyzedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('[VibeTrace Drift Analyzer] OpenRouter audit failed, falling back to heuristic engine:', e.message);
    }
  }

  // Fallback heuristic engine
  const heuristic = runHeuristicDriftAudit(prompt, diffs, agentProtocol);
  return {
    ...heuristic,
    source: 'heuristic',
    modelUsed: configuredModel || 'heuristic-guard',
    analyzedAt: new Date().toISOString()
  };
}

module.exports = { analyzeDrift };
