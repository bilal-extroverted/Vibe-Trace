---
doc: prd
status: approved
---

# VibeTrace — Product Requirements

A local-first, side-by-side observability dashboard that translates black-box AI code generation into plain-language causal summaries and interactive fishbone diagrams, so developers of any experience level can immediately spot unintended code, configuration, or permission drifts.

Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > Look and Feel`.

## The Core Journey
1. **Connection**: The developer opens VibeTrace in their browser on `localhost` and connects it to their local project directory. The dashboard confirms live watching status.
2. **Side-by-Side Prompting**: The developer works in their preferred IDE (Cursor, Antigravity, VS Code, etc.) and prompts their AI agent.
3. **Automatic Ingestion**: As the AI writes or modifies files, VibeTrace detects the change automatically under the hood without manual refresh.
4. **Timeline Logging**: A new chronological tile appears in the side pane showing the timestamp, primary action highlight (e.g., *"Added Users Table"*), and risk rating.
5. **Plain-English Causal Inspection**: Clicking or viewing the active tile updates the main canvas:
   - A non-technical summary explaining what the AI did in plain English.
   - An interactive, expandable fishbone breakdown displaying the trigger, touched systems (Database, Logic, Config, Permissions), and downstream effects.
   - An explicit drift/warning banner if unrequested side effects occurred (e.g., *"Warning: Permissions were modified on auth keys without an explicit prompt"*).
6. **Detailed Verification**: The developer clicks expandable bars to inspect the exact files and code diffs before continuing to their next prompt.

## Screens and Layout
A unified, single-screen dashboard optimized for side-by-side tiling with an IDE:

- **Top Status Bar**: Shows project connection path, active watcher pulse (`Listening for AI edits...`), and an overall project health/drift indicator.
- **Left Side Pane (Chronological Timeline)**:
  - Vertical list of change tiles sorted by timestamp (newest first).
  - Each tile displays: timestamp, one-line plain English highlight, files touched badge, and risk tag (`Safe` vs. `Drift Alert`).
  - Clicking any tile selects it and focuses the main canvas on that event.
- **Main Canvas (Causal Inspector & Fishbone Breakdown)**:
  - **Header Card**: Primary action highlight in plain language, followed by a clear, accessible summary of the AI's actions.
  - **Interactive Fishbone Breakdown**: A structured visual breakdown using expandable horizontal bars/cards:
    - *Cause / Prompt Trigger*: The user's intended prompt or action.
    - *System Layers Touched*: Grouped into Database, Application Logic, Configuration, and Permissions/Security.
    - *Downstream Effects*: What this change enables, plus any detected unintended consequences.
  - **Code & File Diff Drawer**: Expandable accordion listing each modified file with inline visual diffs showing exactly what lines were added, removed, or changed.

## Look and Feel
- **Palette**: Strictly minimalist monochrome—rich deep blacks, charcoal greys, and crisp whites.
- **Glassmorphism**: Translucent panels with subtle backdrop blur, light 1px border outlines, and sleek hover elevations.
- **Typography**: Clean, highly legible modern sans-serif font (e.g., Inter or Outfit) with strict typographic hierarchy.
- **Tone & Copy**: Direct, clear, and informative. Zero marketing buzzwords or AI hype; focus on plain-language engineering clarity that a non-technical stakeholder can immediately understand.
- **Accents**: Subtle semantic indicators only (emerald green for clean changes, warning amber for unexpected drifts/permission shifts).

## Features and Behavior

### 1. Live Project Watcher & Ingestion
Source: `scope.md > The Core Loop`
- The system connects to the local workspace and listens for filesystem/git changes in real time.
- Changes trigger automatic logging without page reloads.
- **Acceptance Criteria**:
  - [ ] Touching/saving a file in the watched directory produces a new event tile in under 1 second.
  - [ ] If the watched folder is empty or not found, an informative connection card prompts for a valid path.

### 2. Timeline Tile Feed (Side Pane)
Source: `scope.md > The Core Loop`
- Lists each detected AI interaction chronologically.
- **Acceptance Criteria**:
  - [ ] Tiles are ordered by time, with the latest change auto-selected.
  - [ ] Clicking any historical tile switches the main view to display that past event.
  - [ ] Drift warnings display a visible alert badge on the tile.

### 3. Plain-English Summary & Causal Highlight
Source: `scope.md > What "Working" Looks Like`
- Translates code diffs into clear, human-understandable summaries so non-technical users understand what happened in the black box.
- **Acceptance Criteria**:
  - [ ] Displays a top-level highlight of the primary action (e.g. *"Created Database Table: orders"*).
  - [ ] Provides a 2–3 sentence plain-language explanation of what changed and why.

### 4. Interactive Fishbone Causal Breakdown
Source: `scope.md > The Unique Kernel`
- A visual breakdown connecting Cause ➔ System Touched ➔ Resulting Effects.
- Expandable dropdowns/bars for each system layer.
- **Acceptance Criteria**:
  - [ ] Visual bars group changes by subsystem (Database, Logic, Config, Security).
  - [ ] Clicking any bar expands/collapses detailed breakdown and rationale.
  - [ ] Unintended side-effects (e.g. permission mutations or config tampering) are flagged with an explicit warning banner and risk explanation.

### 5. File & Code Diff Inspector
Source: `scope.md > What "Working" Looks Like`
- Detailed view of affected files and code changes.
- **Acceptance Criteria**:
  - [ ] Lists all touched files with indicators for additions/deletions.
  - [ ] Expandable code blocks show the exact lines modified.

## States and Boundaries

- **Empty / Initial State**: Displays a clean glassmorphic banner: *"Connected to [Workspace Path]. Watching for AI changes..."* along with an option to load an interactive demo scenario (e.g., the *Database Table + Silent Permission Drift* scenario) for instant verification.
- **Active Change State**: A tile appears with an animated subtle pulse, populating the plain summary and expanding the fishbone tree.
- **Drift Warning State**: When an out-of-scope or sensitive change occurs (permissions, credentials, environment keys), the event card prominently highlights an alert banner with recommended developer action.
- **Disconnected / Error State**: Clear, non-technical notification indicating if the watcher loses connection or the project directory is inaccessible.

## Product Decisions
- **Monochrome & Minimalist Glassmorphism**: Chosen to keep developer attention on code clarity and avoid sensory fatigue during extended side-by-side coding sessions.
- **Plain-Language Summaries alongside Diffs**: Decided specifically so developers and non-technical stakeholders alike can demystify black-box AI behavior without needing to parse complex ASTs.
- **Pre-Loaded Interactive Demo Scenario**: Included directly in the PoC so the user can demonstrate the silent permission drift edge case reliably in a 60-second video demo.

## What We're Building
- A local-first web dashboard running on `localhost`.
- Real-time watcher tracking local file/git mutations.
- Side pane with chronological event tiles.
- Main canvas with plain-language summary card and interactive expandable fishbone bars.
- Drift warning detection specifically highlighting unauthorized permission/security alterations.
- Interactive scenario loader for instant testing.

## Deferred From the POC
- Cloud database syncing and multi-seat team access.
- Direct bidirectional rollback buttons that execute git commands from the web UI.
- Native VS Code / Cursor extension marketplace integration.

## Non-Goals
- Building an entire IDE or code editor replacement.
- Building a full CI/CD pipeline or deployment manager.

## Open Questions
- Specific method of AI summary generation in `4-spec` (lightweight local heuristic engine vs. direct Google Gemini API call with fallback).
