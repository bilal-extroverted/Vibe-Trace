---
doc: scope
status: approved
---

# VibeTrace: AI Code Observability & Causal Drift Tracer

A real-time observability dashboard for AI vibe-coding that connects to your local codebase, traces prompt intent against actual code mutations, and maps cause-and-effect with fishbone/causal diagrams to catch unintended side effects (like silent permission or schema drifts).

## The Unique Kernel
Unlike generic diff viewers or prompt loggers that only record chat tokens, VibeTrace analyzes the *semantic causal bridge* between the developer's prompt and filesystem changes—actively detecting and visualizing unintended side effects and architectural drift (e.g. asking for a database table, but having permissions or auth files quietly altered) through an interactive cause-and-effect fishbone diagram.

## Who It's For
Developers and "vibe-coders" building with AI agents (Cursor, Antigravity, Copilot, etc.) who face the "black box" risk: where prompt-driven agents produce functional code but introduce subtle, unannounced mutations to permissions, environment configurations, or database structures that only surface as painful production errors later.

## The Core Loop
1. The developer prompts their AI agent in their coding IDE.
2. VibeTrace's local watcher immediately captures the resulting filesystem/git diffs in real time.
3. The causal engine maps prompt intent against touched system layers (Database, Business Logic, Config, Security/Permissions) and flags any unprompted drifts.
4. The developer glances at the side-by-side dashboard, reviews the live cause-and-effect fishbone diagram and drift risk rating, and catches unintended changes on the spot before saving or committing.

## Inspiration & Identity
- **Inspirations**: Prompt observability tools like LangGraph/LangSmith and Arize Phoenix, combined with industrial root-cause analysis (Ishikawa/fishbone diagrams) and developer-first dashboards like Jaeger and Turborepo UI.
- **Aesthetic**: Modern, sleek engineering observability theme. Dark mode with rich data-density, crisp system status pulses, interactive node graphs, and clear color-coded safety vs. drift badges (emerald green for verified intent, amber/crimson for unintended side effects).

## Why This Matters to the Learner
The learner experienced firsthand the frustration of unintended AI mutations—prompting an agent to create a database table, only to have the agent silently alter permissions without warning, causing downstream breakage. The learner wants to solve this real-world problem with an industry-grade mental model that gives the developer community true transparency and control over AI-generated code.

## What "Working" Looks Like
A live side-by-side demonstration:
- On one side: the developer's IDE where an AI prompt runs.
- On the other side: VibeTrace running on `localhost`.
- **The "Aha!" moment**: When a prompt requests a database schema change, the AI modifies both the schema and an unrelated permissions file. Instantly, VibeTrace logs the event, updates the interactive cause-and-effect tree, highlights the "Security/Permissions" branch in warning amber, and flags: *"Unintended Side Effect: File permissions modified outside prompt scope"*.

## The POC Boundary
- **In Scope (Now)**:
  - Local-first web app running on `localhost` with real-time UI updates (via SSE/WebSocket).
  - Local workspace watcher detecting file changes and git diffs as they happen.
  - Causal analysis engine comparing prompt intent with actual diff changes and classifying impacted layers (Schema, Logic, Config, Permissions).
  - Interactive Cause-and-Effect / Fishbone diagram rendering the prompt ➔ affected subsystems ➔ detected side-effects.
  - Drift risk scoring (Safe vs. Unintended Drift Warning).
  - Pre-loaded interactive scenarios (including the database table + silent permission drift case) for instantaneous testing and demonstration.

## Later
- Direct IDE extension packaging (VS Code / JetBrains / Cursor marketplace extension).
- Team-wide audit logs and centralized telemetry for engineering organizations.
- One-click rollback button to immediately undo flagged side-effect diffs from the UI.
- Automated test generation specifically targeting detected drift points.

## Explicitly Cut
- **Compiler/Bytecode AST runtime hooks**: Git and filesystem diffs provide 100% of the required visibility across all programming languages without adding fragile language-specific compiler dependencies.
- **Cloud multi-tenant user authentication & billing**: Keeps the focus 100% on the core engineering value: zero-latency, local-first developer observability.
