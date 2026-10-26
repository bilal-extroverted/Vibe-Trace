---
name: vibetrace
description: Connects AI coding agents to the VibeTrace observability harness. Prompts user to configure OPENROUTER_API_KEY in .env on first run, ensures VibeTrace daemon is active, manages the vibetrace.md inter-agent communication protocol, tracks active file mutations, enforces strict drift-prevention guardrails, and synchronizes task lifecycle states (working, editing, completed, diverged).
---

# VibeTrace AI Agent Observability & Harness Protocol Skill

Equips AI coding agents (Antigravity, Cursor, Claude Code, GitHub Copilot) to communicate seamlessly with the local **VibeTrace Observability Harness**.

By following this skill, your actions will stream live into the VibeTrace dashboard (`http://localhost:3000`), populate the 3-pane workbench, animate the real-time footer status ticker, and pass the independent OpenRouter **Drift Guard** audit with a 100% alignment score.

---

## The 4 Task Lifecycle States

Every user prompt transitions through 4 visual card states in VibeTrace:

| State | Visual Card | Trigger in `vibetrace.md` | Meaning |
|---|---|---|---|
| **Working** | Golden Amber | `status: in_progress` or `status: working` | Agent received user prompt and is planning steps |
| **Editing** | Tangerine Orange | `active_file: "path/to/file"` | Agent is actively mutating code in the repository |
| **Completed** | Sapphire Blue | `status: completed` | Task finished; 100% aligned with user prompt |
| **Diverged** | Crimson Red Alert | Unrequested changes / scope drift | Drift Guard detected discrepancy between prompt and output |

---

## Agent Step-by-Step Workflow

### Step 1: Ensure Git Repository, .gitignore Isolation & Auto-Setup
Before writing code or editing files:

1. **Mandatory Git Repository Requirement (CRITICAL):**
   VibeTrace extracts mechanical diffs, branch states, and file mutations strictly using Git.
   - The project **MUST** be a Git repository. Without Git, VibeTrace will not work!
   - The agent must check: `git rev-parse --is-inside-work-tree`.
   - If not a Git repository, the agent **MUST** run:
     ```bash
     git init
     ```
   - The agent **must use Git** to track and commit code changes throughout the task lifecycle.

2. **Default `.gitignore` File Creation & Shielding:**
   The agent **MUST** ensure a `.gitignore` file exists in the project root to prevent newly introduced files (such as `.agents/`) and local harness files from cluttering the user's project history.
   - If `.gitignore` does not exist, create it with:
     ```
     # VibeTrace & Agent Isolation
     .agents/
     .env
     .env.*
     !.env.example
     node_modules/
     vibetrace.db*
     vibetrace.md
     ```
   - If `.gitignore` already exists, append `.agents/`, `.env`, `node_modules/`, `vibetrace.db*`, and `vibetrace.md` if they are missing.

3. **Check for OpenRouter API Key in `.env`:**
   Inspect the project root for `.env`. If `.env` is missing or `OPENROUTER_API_KEY` is not set:
   - Ask the user directly:
     > *"Would you like to provide an OpenRouter API key to configure AI-powered causal summaries and drift auditing in your `.env`? (Reply with your key or 'skip' to use zero-cost offline heuristic mode)."*
   - If the user provides an API key, create or update `.env`:
     ```ini
     OPENROUTER_API_KEY=provided_key_here
     OPENROUTER_API_MODEL=nvidia/nemotron-3.5-lightning:free
     PORT=3000
     ```
   - If the user replies with 'skip' or declines, proceed in offline heuristic mode.

4. **Verify & Auto-Start VibeTrace Observability Server:**
   - Check `http://localhost:3000/api/status`.
   - If not running, start it in the background:
     - Inside this repository: `node server/index.js &`
     - In any other project (installed via `npx skills add bilal-extroverted/Vibe-Trace --all -y`): `npx -y github:bilal-extroverted/Vibe-Trace &`
   - Ensure `vibetrace.md` exists in the project root (auto-create it if missing).

### Step 2: Initialize `vibetrace.md` at Task Inception
**CRITICAL:** Update `vibetrace.md` in the repository root **immediately** upon receiving a user prompt, *before* creating or editing code files.

```markdown
---
status: in_progress
task: "<Short 5-8 word description of what the user requested>"
agent: "<Agent Name (e.g. Antigravity AI, Cursor, Claude)>"
active_file: "<Primary file you will inspect or modify first>"
file_action: "Inspecting codebase and planning implementation steps"
file_summary: "Planning changes to fulfill user prompt"
started_at: "<ISO 8601 Timestamp, e.g. 2026-10-25T11:00:00.000Z>"
updated_at: "<ISO 8601 Timestamp>"
---

# VibeTrace Agent-Harness Communication Protocol

## Current Task Intent
> 1-2 sentences summarizing the exact user prompt intent and expected changes.

## Execution Plan & Steps
- [ ] Step 1: Inspect existing implementation in file X
- [ ] Step 2: Implement logic Y
- [ ] Step 3: Verify syntax and test functionality

## Inter-Agent & Harness Communication Notes
- State any technical constraints, dependencies, or scope boundaries here.
```

### Step 3: Broadcast Progress & Active File Transitions
As you touch files in the codebase, update `vibetrace.md` to inform the dashboard:
- Update `active_file` to the file you are currently modifying.
- Update `file_action` with a concise summary of the action (e.g., `"Adding rate-limiting middleware"`).
- Update `file_summary` explaining the architectural impact.
- Check off completed steps in the execution plan (`- [ ]` ➔ `- [x]`).

```markdown
active_file: "server/middleware/rateLimiter.js"
file_action: "Added sliding window rate limiting middleware"
file_summary: "Protects API endpoints against repeated HTTP 429 quota exhaustion"
```

### Step 4: Finalize Task Completion
When all planned edits are done and verified:
1. Update `vibetrace.md` with `status: completed`.
2. Ensure all completed steps are marked `- [x]`.
3. Add a `completed_at` ISO timestamp.

```markdown
---
status: completed
task: "<Exact prompt description>"
agent: "Antigravity AI"
active_file: "<Final file modified>"
file_action: "Finalized changes and verified correctness"
file_summary: "All execution steps verified without regressions"
started_at: "2026-10-25T11:00:00.000Z"
completed_at: "2026-10-25T11:10:00.000Z"
updated_at: "2026-10-25T11:10:00.000Z"
---
```

Setting `status: completed` instructs VibeTrace's watcher to immediately extract git diffs, execute mechanical harness checks, run the Drift Guard audit, and publish the verified trace.

---

## 🛡️ Strict Agent Guardrails

To prevent the **Drift Guard** from triggering a **High Alert (Red Card)**, agents must strictly adhere to these 5 guardrails:

### Guardrail 1: Strict Scope Containment (Zero Unrequested Touches)
- If the user requested a **frontend styling or layout fix**, do **NOT** modify server routes, database schemas, or backend configs.
- If the user requested a **backend API change**, do **NOT** restyle frontend components or modify CSS.
- *Why:* Drift Guard inspects modified file extensions against prompt keywords. Modifying `server/` during a styling task will immediately trigger a `Significant Divergence Detected` alert.

### Guardrail 2: Preserve Visual Assets, Gradients & Typography
- **Never delete or strip existing visual styling** (such as CSS `linear-gradient`, `radial-gradient`, or custom token variables) unless the user explicitly used the words `"remove gradient"` or `"delete styling"`.
- *Why:* Unsolicited design downgrades are treated as high-severity regressions.

### Guardrail 3: Respect Environment Variables & Never Hardcode Models
- When calling external APIs (such as OpenRouter), **always** read credentials and model configurations dynamically from `process.env`:
  ```javascript
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const model = (process.env.OPENROUTER_API_MODEL || '').trim();
  ```
- Never hardcode model strings (e.g. `"gpt-4o"` or `"claude-3-5"`) into application code.
- If credentials or models are missing, fall back gracefully to local heuristic engines.

### Guardrail 4: Never Start Silently
- If you start writing code *before* setting `vibetrace.md` to `status: in_progress`, VibeTrace will evaluate your code changes against the **previous task** left in `vibetrace.md`. This will cause an immediate false-positive drift alert!

### Guardrail 5: Clean Code Hygiene & Syntax Validation
- Always validate JavaScript/Node.js syntax with `node --check <file>` before signaling task completion.
- Maintain documentation integrity: Preserve existing comments and docstrings.

---

## 📋 Full `vibetrace.md` Specification Reference

```yaml
---
# REQUIRED FIELDS:
status: "in_progress" | "completed" | "working"
task: string           # Max 10 words. Clear summary of user intent.
agent: string          # Name of the AI agent executing the task.

# OPTIONAL / RECOMMENDED FIELDS:
active_file: string    # Relative path of file currently being modified.
file_action: string    # 1-sentence action summary (e.g., "Refactoring SSE broadcast loop").
file_summary: string   # 1-2 sentence mechanical change explanation.
started_at: string     # ISO 8601 string when task began.
completed_at: string   # ISO 8601 string when task completed.
updated_at: string     # ISO 8601 string of last modification.
---

# VibeTrace Agent-Harness Communication Protocol

## Current Task Intent
> User prompt intent and high-level architectural rationale.

## Execution Plan & Steps
- [x] Step 1: Completed step
- [ ] Step 2: In-progress step

## Inter-Agent & Harness Communication Notes
- Contextual information for secondary agents, human reviewers, or harness auditors.
```
