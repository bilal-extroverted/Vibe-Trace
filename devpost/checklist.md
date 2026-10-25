---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Scaffolding, Live Server, and Glassmorphic Dashboard UI**
  Becomes usable: The local Node.js/Express server boots up on `http://localhost:3000` with the complete monochrome glassmorphic single-page dashboard: top status bar, left timeline pane, main fishbone canvas with expandable cards, and SSE listener connection established.
  Why now: Bootstraps the project and delivers an immediate visual, working surface on `localhost:3000` side-by-side with the IDE so every subsequent backend component has a live screen to render onto.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > Components > 5. Glassmorphic Timeline & Fishbone Dashboard`
  Build: Initialize `package.json` with dependencies (`express`, `dotenv`), create `server/index.js` and `server/sse.js`, and build `public/index.html`, `public/style.css`, and `public/app.js` with responsive side-by-side layout, glassmorphic styling, and empty state.
  Verify (mechanical): Start the server, perform an HTTP GET request to `http://localhost:3000` and check for 200 OK and valid HTML payload with `#timeline-pane` and `#main-canvas`.
  Learner check: Open `http://localhost:3000` in your browser alongside your editor and confirm the monochrome glassmorphic layout loads cleanly with the "Listening for AI edits" pulse.
  Commit: `feat: scaffold server and glassmorphic dashboard UI`

- [x] **2. Causal Intelligence Engine, OpenRouter API Client & Offline Fallback**
  Becomes usable: The backend causal analysis module (`server/analyzer.js`) can take a diff + prompt/context, query OpenRouter (or use its local heuristic fallback), classify touched subsystems (Database, Logic, Config, Permissions), and detect unintended permission/security drift.
  Why now: De-risks the intelligence layer early—proving that both the OpenRouter API integration and the resilient offline rule classifier work reliably and return properly structured JSON with drift warnings.
  PRD ref: `prd.md > 3. Plain-English Summary & Causal Highlight`, `prd.md > 4. Interactive Fishbone Causal Breakdown`
  Spec ref: `spec.md > Components > 3. Causal Intelligence & OpenRouter Engine`, `spec.md > External Services and Dependencies`
  Build: Implement `server/analyzer.js` with OpenRouter REST `fetch` client and rule-based heuristic classifier. Add `server/scenarios.js` with test scenarios (including the Database table + Permission drift scenario). Expose `/api/scenarios/run` and `/api/analyze` endpoints.
  Verify (mechanical): Execute a test script analyzing a mock prompt + permission-modifying diff; assert that `driftDetected === true`, `layers.permissions.status === 'drift'`, and a valid plain-English summary is generated.
  Learner check: Click the "Run Demo Scenario" button on the dashboard and verify that the event appears with the amber drift warning and plain-English summary.
  Commit: `feat: implement causal analysis engine with OpenRouter and heuristic fallback`

- [x] **3. Real-Time Git Inspection, Debounced Watcher & Live SSE Broadcast**
  Becomes usable: VibeTrace actively watches the local repository filesystem using `chokidar` and `git`. When files are saved, the intelligent debouncer stabilizes writes, computes diff signatures to avoid redundant calls, runs causal analysis, and broadcasts the event over SSE directly to the dashboard in real time.
  Why now: Connects the live filesystem loop to the UI—delivering the core promise of side-by-side live observability during actual coding.
  PRD ref: `prd.md > 1. Live Project Watcher & Ingestion`, `prd.md > 2. Timeline Tile Feed (Side Pane)`
  Spec ref: `spec.md > Components > 1. Workspace & Git Watcher`, `spec.md > Components > 4. SSE Telemetry Stream`
  Build: Integrated `chokidar` in `server/watcher.js` and `server/gitService.js`. Implemented sliding debouncing and diff deduplication. Connected the UI `EventSource` to automatically stream traces without manual refresh.
  Verify (mechanical): Tested debounced file change batching and SSE broadcast; verified that writes stabilize and emit traces within 1.5 seconds.
  Learner check: Edit or save a file in the workspace while watching `http://localhost:3000` and confirm the new trace appears automatically.
  Commit: `feat: wire real-time debounced file watcher and SSE broadcast`

- [x] **4. Functional 3-Pane Observability Layout, Diff Viewer & AI Trace Query Engine**
  Becomes usable: Replaced all demos/hardcoded references with a functional 3-pane UI: Left pane displays real execution traces and changes with timestamps; Middle pane displays full syntax-highlighted code diffs; Right pane displays plain-English summaries, architectural impact, subsystems, AI harness context, and an interactive AI Query Engine where developers can ask questions about the observed code changes.
  Why now: Delivers the user's exact specification—a completely functional, production-ready observability workspace without demos or simulation clutter.
  PRD ref: `prd.md > 3. Plain-English Summary & Causal Highlight`, `prd.md > 5. File & Code Diff Inspector`
  Spec ref: `spec.md > Components > 2. Harness & Skills Context Reader`, `spec.md > Components > 5. Glassmorphic Timeline Dashboard`
  Build: Built `public/index.html`, `public/style.css`, `public/app.js`, `public/diffViewer.js`, `server/queryEngine.js`, and `server/harnessContext.js`. Bound real-time folder switching, rescan, and OpenRouter API query engine.
  Verify (mechanical): Triggered real Git diff inspection across workspace files, confirmed `/api/status`, `/api/rescan`, and `/api/query` return valid AI responses with exact line-by-line diffs.
  Learner check: Connect to a local folder, view the 3-pane UI, inspect code diffs in the middle pane, and ask questions in the right pane.
  Commit: `feat: implement functional 3-pane AI code observability with real-time diffs and trace query engine`

- [x] **5. vibetrace.md Agent-Harness Communication Protocol, SQLite Persistence & Skills Integration**
  Becomes usable: AI coding agents automatically discover the VibeTrace skill via `skills/vibetrace/SKILL.md` (and `.agents/skills/vibetrace/SKILL.md`), maintain `vibetrace.md` for live task tracking (`idle`, `in_progress`, `completed`), checklist steps, and inter-agent notes. When `status: completed` is set, VibeTrace automatically captures diffs, executes mechanical harness audits (syntax check via `node --check`, protected files, secret scanner, dependency guard), and persists traces permanently into SQLite (`vibetrace.db`).
  Why now: Directly solves the core developer pain—enabling transparent, observable agent execution without onboarding modals, fake demos, or manual overhead.
  PRD ref: `prd.md > 1. Live Project Watcher & Ingestion`, `prd.md > 2. Timeline Tile Feed`
  Spec ref: `spec.md > Components > 1. Workspace & Git Watcher`, `spec.md > Components > 2. Harness & Skills Context Reader`
  Build: Built `skills/vibetrace/SKILL.md`, `vibetrace.md`, `server/harness/protocol.js`, `server/db.js`, `server/harness/harnessEngine.js`, and updated `server/watcher.js` and `public/app.js`.
  Verify (mechanical): Tested `vibetrace.md` lifecycle transitions (`in_progress` -> `completed`), confirmed SSE telemetry broadcasts, SQLite trace persistence, and instant dashboard updates.
  Learner check: Update `vibetrace.md` status, observe the live status pulse and task name in the top bar and right pane, and view the captured trace in the left pane.
  Commit: `feat: implement vibetrace.md agent communication protocol, live task tracking, and skills guide`

- [x] **6. 4-State Status Gradient Cards, Independent Drift Guard & Architectural Mind Map**
  Becomes usable: Left pane execution traces visually reflect lifecycle states via 4 vibrant CSS gradients: Golden Amber for Working (`status: working`/`in_progress`), Tangerine Orange for Editing (`active_file` mutation), Sapphire Blue for Completed (verified fidelity), and Crimson Alert for Difference/Diverged (Drift Guard warning). The Independent Drift Guard audits prompt intent vs mechanical diffs using OpenRouter or local heuristics. The full-screen Mind Map visualizes subsystems and scans architectural flaws.
  Why now: Elevates VibeTrace from passive logger to an active engineering safety harness with instant visual recognition and root-cause intelligence.
  PRD ref: `prd.md > Look and Feel`, `prd.md > 4. Interactive Fishbone Causal Breakdown`
  Spec ref: `spec.md > Components > 2.3 Independent Prompt-to-Output Drift Guard`, `spec.md > 2.7 3-Pane Edge-to-Edge Workbench`
  Build: Implemented `server/driftAnalyzer.js`, `server/mindMapEngine.js`, Mermaid modal, and 4-state card gradient styles in `public/style.css`.
  Verify (mechanical): Tested divergent file mutations triggering Crimson Red drift alert and verified matching prompt triggering Sapphire Blue alignment.
  Learner check: Prompt the agent to make a targeted change and watch the card transition smoothly from amber to orange to blue upon verified completion.
  Commit: `feat: implement 4-state card gradients, independent drift guard, and architectural mind map`

- [x] **7. 6-State Footer Observability Engine, Live Observability Logs Drawer & Strict OpenRouter .env Lock**
  Becomes usable: Footer status bar reflects 6 live system states (`WORKING`, `EDITING`, `ANALYZING`, `COMPLETED`, `DIFFERENCE`, `IDLE`) with animated pulses and a real-time timestamped log ticker. Clicking the footer opens a slide-up Live Observability Logs Drawer console (`#logs-drawer`) with category pills (`[MUTATION]`, `[PROTOCOL]`, `[HARNESS]`, `[DRIFT]`, `[TRACE]`). OpenRouter queries are strictly locked to `process.env.OPENROUTER_API_MODEL` with zero unauthorized fallback cascades.
  Why now: Provides full operational transparency into background harness activity, eliminates misleading UI alarms, and ensures strict API consumption governance.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Product Decisions & Guardrails`
  Spec ref: `spec.md > Components > 2.3 Independent Prompt-to-Output Drift Guard`, `spec.md > 2.6 Real-Time SSE Telemetry Broadcaster`
  Build: Added footer status engine and logs drawer in `public/index.html`, `public/style.css`, `public/app.js`, and strictly bound `server/analyzer.js`, `server/driftAnalyzer.js`, `server/queryEngine.js`, and `server/mindMapEngine.js` to `process.env.OPENROUTER_API_MODEL`.
  Verify (mechanical): Verified `node --check` across all server files and confirmed `/api/status` reflects single `.env` model.
  Learner check: Click the bottom footer ticker to view the live terminal drawer streaming timestamped workspace events.
  Commit: `feat: synchronize footer status bar with active states and stream live activity logs`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Real-time debounced file watcher & OpenRouter causal intelligence
- [x] Final kick-the-tires exploration and feedback completed — Verified live vibetrace.md lifecycle transitions, chronological traces bar, and dual isolated summaries

## Final Review

- [x] Final review complete — 3-pane resizable workbench, 4-state gradient cards, independent Drift Guard, 6-state footer logs drawer, SQLite persistence, and strict OpenRouter environment binding verified and ready to ship.

## Code Tour and App Map

- [x] Learning activity complete — Verified end-to-end telemetry loop, agent-harness protocol, and dual AI/agent perspective isolation
- [x] devpost/app-map.html generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: End-to-end telemetry verified: Agent updates `vibetrace.md` ➔ Watcher batches mutations via sliding debouncing ➔ Drift Guard audits prompt intent vs mechanical diffs ➔ Dashboard streams real-time card transitions (Amber -> Orange -> Blue) and logs drawer updates.
Route and stops:
1. `vibetrace.md`: Shared protocol bus between agent and harness.
2. `server/watcher.js`: Sliding-window debouncer and git diff aggregator.
3. `server/driftAnalyzer.js`: Independent prompt-to-output fidelity and risk auditor.
4. `server/db.js`: Native SQLite storage for persistent trace telemetry.
5. `public/app.js`: Reactive 3-pane workbench and 6-state footer status engine.
Edit outcome: Clean separation of VibeTrace engineering harness from Devpost competition artifacts, comprehensive README with MIT License, and enterprise agent skill guardrails.
Reflection: The most critical practice when pairing AI coding agents with an observability harness is establishing an explicit, machine-readable protocol (`vibetrace.md`). When an agent declares its intent before modifying code, the harness can perform proactive drift detection rather than reactive guesswork.
Activity mode: fast
