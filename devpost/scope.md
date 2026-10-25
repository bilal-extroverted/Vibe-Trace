---
doc: scope
status: approved
---

# VibeTrace: AI Code Observability Harness & Prompt-to-Execution Drift Guard

A real-time observability dashboard and protocol harness for AI vibe-coding that connects to your local codebase, traces prompt intent against actual code mutations, evaluates drift risk with OpenRouter AI models, and maps cause-and-effect with visual diffs, interactive deep-dive Q&A analysis, and chronological Features Over Time evolution graphs to catch unintended side effects (such as silent permission changes, design downgrades, or scope creep).

## The Unique Kernel
Unlike generic diff viewers or prompt loggers that only record chat tokens, VibeTrace acts as an **autonomous observability harness**. It combines:
1. **Passive Telemetry:** Real-time sliding debouncing and Git diff extraction.
2. **Active Protocol (`vibetrace.md`):** Inter-agent communication tracking active files, task intent, and checklist steps.
3. **Independent Drift Guard:** Automated prompt-to-output fidelity auditing using OpenRouter AI models and local heuristics to flag unauthorized modifications, unrequested scope creep, and regressions.
4. **4-State Dynamic Gradient Cards & 6-State Footer Engine:** Instant visual feedback (Working, Editing, Completed, Diverged) with an expandable live terminal logs drawer.
5. **Features Over Time & Interactive Analysis Engine:** Chronological milestone evolution graphs and deep local AST semantic Q&A over codebase mutations.

## Who It's For
Developers, engineers, and vibe-coders building with AI coding agents (Antigravity, Cursor, Claude Code, GitHub Copilot) who face the "black box" risk: where prompt-driven agents produce code quickly but introduce subtle, unannounced mutations to permissions, environment configurations, visual design systems, or database structures that only surface as painful production bugs later.

## The Core Loop
1. The developer prompts their AI agent in their coding IDE.
2. The agent initializes `vibetrace.md` with task intent and active file targets.
3. VibeTrace's local watcher immediately captures filesystem mutations and git diffs with sliding debouncing.
4. The Independent Drift Guard evaluates prompt intent vs. actual mechanical diffs, scoring alignment (0–100%) and flagging any unprompted drifts or regressions.
5. The developer glances at the side-by-side dashboard, reviews the live execution trace (with color-coded gradient cards), inspects the diff with per-file impact intelligence, and catches unintended changes on the spot before saving or committing.

## Inspiration & Identity
- **Inspirations:** Modern engineering observability platforms (LangSmith, Datadog, Turborepo UI, Jaeger), combined with industrial root-cause analysis and modern SaaS high-density micro-design.
- **Aesthetic:** Modern, sleek engineering observability theme. Curated dark mode with rich data-density, crisp system status pulses, interactive milestone graphs, and clear color-coded safety vs. drift badges (sapphire blue for verified intent, amber for working, orange for active editing, crimson for unintended drift).

## What "Working" Looks Like
A live side-by-side demonstration:
- On one side: the developer's IDE where an AI prompt runs.
- On the other side: VibeTrace running on `http://localhost:3000`.
- **The "Aha!" moment:** When a prompt requests a frontend styling fix, but the agent silently alters backend server files or deletes gradient background rules. Instantly, VibeTrace logs the event, turns the trace card Crimson Red (`CRITICAL DRIFT`), sounds a high alert, and explains: *"Agent modified server backend files during a frontend styling/theme task"*, providing concrete step-by-step remediation.

## The POC Boundary
- **In Scope (Now):**
  - Local-first web app running on `localhost:3000` with real-time SSE updates.
  - Local workspace watcher with sliding window debouncing detecting file changes and git diffs as they happen.
  - Active inter-agent communication protocol (`vibetrace.md`) with active file tracking and step checklists.
  - Independent prompt-to-output drift analyzer & risk alert guard powered by OpenRouter (strictly bound to `.env`) with resilient offline heuristic fallbacks.
  - 4-State dynamic gradient trace cards: Working (Amber), Editing (Orange), Completed (Blue), Diverged (Red).
  - 6-State footer status engine with active pulse animations and real-time timestamped log ticker.
  - Slide-up Live Observability Logs Drawer console (`#logs-drawer`) with category pills and clear controls.
  - 3-Pane edge-to-edge resizable workbench (Chronological Feed | Active File & Diff Inspector | Dual-Perspective AI & Agent Synthesis).
  - Features Over Time: Chronological Evolution Graph & Milestone Progression (`/api/features-over-time`) mapping files mutated, additions/deletions, and structural features over agent sessions.
  - Interactive Deep-Dive Analysis Q&A Engine (`server/queryEngine.js`) supporting natural language codebase questions with zero-downtime offline semantic AST & diff analysis.
  - Persistent SQLite storage (`vibetrace.db` via `node:sqlite`) recording all historical traces, diffs, audits, and queries.

## Later
- Direct IDE extension packaging (VS Code / JetBrains / Cursor marketplace extension).
- Team-wide audit logs and centralized telemetry for engineering organizations.
- One-click rollback button to immediately revert flagged side-effect diffs from the UI.
- Automated test generation specifically targeting detected drift points.

## Explicitly Cut
- **Compiler/Bytecode AST runtime hooks:** Git and filesystem diffs provide 100% of the required visibility across all programming languages without adding fragile language-specific compiler dependencies.
- **Cloud multi-tenant user authentication & billing:** Keeps the focus 100% on the core engineering value: zero-latency, local-first developer observability.
