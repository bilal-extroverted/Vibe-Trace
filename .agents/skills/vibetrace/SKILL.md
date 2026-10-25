---
name: vibetrace
description: Connects AI coding agents to VibeTrace observability harness. Ensures VibeTrace server is running, maintains vibetrace.md communication protocol, and tracks task lifecycle (started, in_progress, completed).
---

# VibeTrace Agent Observability & Harness Skill

Use this skill whenever working on this repository or any codebase with VibeTrace. It establishes a real-time communication channel between you (the coding agent) and the VibeTrace observability server.

## Workflow

### 1. Ensure VibeTrace Server is Running
Before making code changes, check if the VibeTrace server is active on `http://localhost:3000`.
If it is not running, start it in the background:
```bash
node server/index.js
```
The dashboard will be live at `http://localhost:3000`.

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
