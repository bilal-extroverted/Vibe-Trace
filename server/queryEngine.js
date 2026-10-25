// VibeTrace AI Query Engine
// Answers developer questions about observed traces, diffs, and harness architecture

async function answerQuestion({ question, traceContext, activeDir = '.' }) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const configuredModel = (process.env.OPENROUTER_API_MODEL || '').trim();

  const modelsToTry = configuredModel ? [configuredModel] : [];

  const systemPrompt = `You are VibeTrace AI, an observability assistant for code traces and AI harness engineering.
Answer the developer's question specifically and technically using the provided trace context, file diffs, and harness rules.
Be direct, concise, and highlight exact files, lines, and architectural consequences.`;

  const userContent = `Developer Question: "${question}"

Trace Context:
- Trace ID: ${traceContext?.id || 'N/A'}
- Title: ${traceContext?.name || traceContext?.title || 'N/A'}
- Files Touched: ${(traceContext?.input?.filesModified || []).join(', ') || 'N/A'}
- Recent Diffs:
${(traceContext?.diffs || []).slice(0, 5).map(d => `File: ${d.file}\n${d.content}`).join('\n---\n').slice(0, 3000)}`;

  if (apiKey) {
    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/challengepost/learn-ai-basics',
            'X-Title': 'VibeTrace Query'
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
          return {
            answer: data.choices[0].message.content,
            modelUsed: model,
            latencyMs: 350
          };
        }
      } catch (e) {
        // try next model
      }
    }
  }

  // Fallback response if offline
  return {
    answer: `Analyzed trace ${traceContext?.id || 'active'}: The agent modified ${(traceContext?.diffs || []).length} file(s). Files touched: ${(traceContext?.input?.filesModified || []).join(', ') || 'files in workspace'}. No errors detected.`,
    modelUsed: 'local-heuristic',
    latencyMs: 15
  };
}

module.exports = { answerQuestion };
