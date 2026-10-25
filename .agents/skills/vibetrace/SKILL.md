---
name: vibetrace
description: Connects AI coding agents to VibeTrace observability harness. Ensures VibeTrace server is running, maintains vibetrace.md communication protocol, and tracks task lifecycle (started, in_progress, completed).
---

# VibeTrace Agent Observability & Harness Skill

Use this skill whenever working on this repository or any codebase with VibeTrace. It establishes a real-time communication channel between you (the coding agent) and the VibeTrace observability server.

## Workflow

### 1. Check OpenRouter API Key & Ensure Server is Running
Before making code changes:
- Check if `.env` exists and has `OPENROUTER_API_KEY`. If missing, ask the user:
  > *"Would you like to provide an OpenRouter API key to configure AI-powered causal summaries and drift auditing in your `.env`? (Reply with your key or 'skip' to use offline heuristic mode)."*
  If provided, write it to `.env`:
  ```ini
  OPENROUTER_API_KEY=your_key_here
  OPENROUTER_API_MODEL=recursive/flint-v1.0:free
  PORT=3000
  ```
- Check if the VibeTrace server is active on `http://localhost:3000`. If not, start it in the background:
  - Inside this repository: `node server/index.js &`
  - In any other project (installed via `npx skills add bilal-extroverted/Vibe-Trace --all -y`): `npx -y github:bilal-extroverted/Vibe-Trace &`
- Ensure `vibetrace.md` exists in the project root (auto-create if missing).

### 2. Update `vibetrace.md` at Task Start
When you receive a coding instruction or user request, update `vibetrace.md` in the repository root to inform the harness and other agents:

```markdown
---
status: in_progress
task: "<Short description of what the user requested>"
agent: "<Agent Name (e.g. Antigravity, Cursor, Claude)>"
started_at: "<ISO timestamp>"
updated_at: "<ISO timestamp>"
---

# VibeTrace Agent-Harness Communication Protocol

## Current Task Intent
> Describe in 1-2 sentences what code changes or refactoring you are performing.

## Execution Plan & Steps
- [ ] Step 1: Modify file X
- [ ] Step 2: Implement logic Y
- [ ] Step 3: Run harness verification

## Inter-Agent & Harness Communication Notes
- Notes for other agents, constraints, or test requirements.
```

### 3. Update Progress While Coding
As you complete individual steps, update the checkboxes in `vibetrace.md`:
```markdown
- [x] Step 1: Modify file X
- [ ] Step 2: Implement logic Y
```

### 4. Mark Task Completion
When you finish your changes, update the frontmatter in `vibetrace.md`:
```markdown
---
status: completed
task: "<Description>"
agent: "<Agent Name>"
completed_at: "<ISO timestamp>"
---
```

When you set `status: completed`, VibeTrace immediately detects the completion, aggregates all Git diffs, runs the harness verification checks, and publishes the permanent execution trace to the dashboard.
