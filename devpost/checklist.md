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
  Spec ref: `spec.md > Stack`, `spec.md > Components > 5. Glassmorphic Timeline & Fishbone Dashboard`, `spec.md > File Structure`
  Build: Initialize `package.json` with dependencies (`express`, `dotenv`), create `server/index.js` and `server/sse.js`, and build `public/index.html`, `public/style.css`, and `public/app.js` with responsive side-by-side layout, glassmorphic styling, and empty state.
  Verify (mechanical): Start the server, perform an HTTP GET request to `http://localhost:3000` and check for 200 OK and valid HTML payload with `#timeline-pane` and `#main-canvas`.
  Learner check: Open `http://localhost:3000` in your browser alongside your editor and confirm the monochrome glassmorphic layout loads cleanly with the "Listening for AI edits" pulse.
  Commit: `feat: scaffold server and glassmorphic dashboard UI`

- [ ] **2. Causal Intelligence Engine, OpenRouter API Client & Offline Fallback**
  Becomes usable: The backend causal analysis module (`server/analyzer.js`) can take a diff + prompt/context, query OpenRouter (or use its local heuristic fallback), classify touched subsystems (Database, Logic, Config, Permissions), and detect unintended permission/security drift.
  Why now: De-risks the intelligence layer early—proving that both the OpenRouter API integration and the resilient offline rule classifier work reliably and return properly structured JSON with drift warnings.
  PRD ref: `prd.md > 3. Plain-English Summary & Causal Highlight`, `prd.md > 4. Interactive Fishbone Causal Breakdown`
  Spec ref: `spec.md > Components > 3. Causal Intelligence & OpenRouter Engine`, `spec.md > External Services and Dependencies`
  Build: Implement `server/analyzer.js` with OpenRouter REST `fetch` client and rule-based heuristic classifier. Add `server/scenarios.js` with test scenarios (including the Database table + Permission drift scenario). Expose `/api/scenarios/run` and `/api/analyze` endpoints.
  Verify (mechanical): Execute a test script analyzing a mock prompt + permission-modifying diff; assert that `driftDetected === true`, `layers.permissions.status === 'drift'`, and a valid plain-English summary is generated.
  Learner check: Click the "Run Demo Scenario" button on the dashboard and verify that the event appears with the amber drift warning and plain-English summary.
  Commit: `feat: implement causal analysis engine with OpenRouter and heuristic fallback`

- [ ] **3. Real-Time Git Inspection, Debounced Watcher & Live SSE Broadcast**
  Becomes usable: VibeTrace actively watches the local repository filesystem using `chokidar` and `simple-git`. When files are saved, the 500ms debouncer gathers the git diff, runs it through the causal analyzer, and broadcasts the event over SSE directly to the dashboard in real time.
  Why now: Connects the live filesystem loop to the UI—delivering the core promise of side-by-side live observability during actual coding.
  PRD ref: `prd.md > 1. Live Project Watcher & Ingestion`, `prd.md > 2. Timeline Tile Feed (Side Pane)`
  Spec ref: `spec.md > Components > 1. Workspace & Git Watcher`, `spec.md > Components > 4. SSE Telemetry Stream`
  Build: Install and integrate `chokidar` and `simple-git` into `server/watcher.js` and `server/gitService.js`. Implement debouncing and wire up the file change listener to `analyzer.js` and `sse.js`. Connect the UI `EventSource` to automatically prepend new tiles and play the notification pulse.
  Verify (mechanical): Programmatically create a temporary test file in the watched directory; confirm via server logs and an SSE client test that the change event is batched and emitted within 1.5 seconds.
  Learner check: Edit or save a test file in the workspace while watching `http://localhost:3000` and watch a new tile appear automatically without refreshing.
  Commit: `feat: wire real-time debounced file watcher and SSE broadcast`

- [ ] **4. Interactive Fishbone Visualization, Diff Drawer & Harness Context**
  Becomes usable: The main canvas features interactive, expandable fishbone bars (Cause ➔ System Layers ➔ Downstream Effects) and an expandable file diff drawer with syntax coloring. Also reads harness instructions (`skills/` or agent rules) via `server/harnessContext.js` to cross-reference agent instructions against modifications.
  Why now: Closes the full user journey and polishes the end-to-end user experience for the hackathon video demo and code review.
  PRD ref: `prd.md > 4. Interactive Fishbone Causal Breakdown`, `prd.md > 5. File & Code Diff Inspector`
  Spec ref: `spec.md > Components > 2. Harness & Skills Context Reader`, `spec.md > Components > 5. Glassmorphic Timeline & Fishbone Dashboard`
  Build: Implement `server/harnessContext.js` to parse local skills/rules. Enhance `public/fishbone.js` and `public/diffViewer.js` with interactive accordion cards, drift warning highlights, and inline diff views. Add sample scenarios toggle and status controls.
  Verify (mechanical): Trigger the database + permission drift scenario; check DOM elements for the expandable fishbone layers, diff view lines, and amber drift alert banner.
  Learner check: Click through each fishbone branch and expand the file diff drawer to verify that the unintended permission change is clearly highlighted and explained.
  Commit: `feat: complete interactive fishbone diagrams, diff viewer, and harness context`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 2 (Demo Scenario execution with plain-English summary & drift alert)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded upon completion]
Route and stops: [to be recorded upon completion]
Edit outcome: [to be recorded upon completion]
Reflection: [to be recorded upon completion]
Activity mode: [to be recorded upon completion]

## Revisions

