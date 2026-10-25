---
doc: prd
status: approved
---

# VibeTrace — Product Requirements Document (PRD)

A local-first, side-by-side observability dashboard that translates black-box AI code generation into verified execution traces, real-time telemetry, and independent prompt-to-output drift auditing, so developers can immediately spot unintended code, configuration, design, or permission drifts.

Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > Look and Feel`.

## The Core Journey
1. **Connection & Idle State:** The developer opens VibeTrace at `http://localhost:3000`. The top header displays the workspace name, and the bottom status bar pulses green (`• HARNESS ACTIVE: Watching repository mutations with intelligent sliding debouncing...`).
2. **Side-by-Side Prompting:** The developer works in their IDE (Antigravity, Cursor, Claude Code, VS Code) and prompts their agent.
3. **Task Initialization (Working State):** The agent updates `vibetrace.md` with `status: in_progress` and its declared task. Instantly, an execution trace card appears in the left feed pulsing Golden Amber (`WORKING`), and the footer transitions to Amber.
4. **Live File Mutations (Editing State):** As the agent edits code, the card transitions to Tangerine Orange (`EDITING`), streaming the active file name and live line delta. The center pane diff inspector updates in real time.
5. **Debounce & Verification (Analyzing State):** When file writes pause, the watcher extracts git diffs, and the footer transitions to Violet (`AI SYNTHESIZING`).
6. **Fidelity Audit & Drift Guard:** The system independently evaluates prompt intent vs. actual code diffs using OpenRouter (strictly bound to `.env`) or offline heuristics.
   - **Aligned Case:** The card turns Sapphire Blue (`COMPLETED`), showing `100% ALIGNED` with verified badges.
   - **Diverged Case:** If unrequested changes or design downgrades occurred, the card turns Crimson Red (`CRITICAL DRIFT`), displaying an urgent alert banner with exact discrepancies and suggested remedies.
7. **Inspection & Telemetry:** The developer reviews the 3-pane workbench:
   - Left: Chronological traces with filter search and project path copy button.
   - Center: Active file inspector with unified diffs, line counts, and mechanical change analysis.
   - Right: Prompt card, Drift Guard audit, AI model synthesis, agent checklist steps, mechanical harness checks, and execution telemetry.
8. **Live Observability Drawer:** Clicking the footer ticker opens a slide-up terminal console displaying timestamped category logs (`[MUTATION]`, `[PROTOCOL]`, `[HARNESS]`, `[DRIFT]`, `[TRACE]`).
9. **Architectural Mind Map:** Clicking **Mind Map** opens a full-screen modal with an interactive Mermaid subsystem graph, flaw scanner, and systemic recommendations.

---

## Screens and Layout

A unified, 3-pane edge-to-edge resizable workbench optimized for side-by-side tiling with an IDE:

- **Top Navigation Bar:**
  - VibeTrace brand logo with live pulse indicator.
  - Action buttons: **Mind Map** modal trigger, **Rescan Diffs**, and Dark/Light Theme toggle.
- **Left Pane (Chronological Execution Traces Feed):**
  - Repository header with project name, branch tag (`main`), and click-to-copy path bar.
  - Live search/filter bar to filter traces by task, file, or keyword.
  - Trace counter and chronological sort tag.
  - Borderless trace cards with 4 distinct CSS status gradients:
    - 🟡 Working (Golden Amber)
    - 🟠 Editing (Tangerine Orange)
    - 🔵 Completed (Sapphire Blue)
    - 🔴 Difference / Diverged (Crimson Red)
- **Center Pane (Active File & Diff Inspector):**
  - Trace title and status badges.
  - File pills for quick file jumping.
  - "Trace Change & Impact Intelligence" summary box (What Changed, What Was Affected, Systemic Ripple Effect).
  - File Mutation Card showing active file status, line deltas, symbols, affected functions, and downstream impact.
  - Inline unified diff viewer with line additions/deletions and syntax highlighting.
- **Right Pane (Dual-Perspective AI & Harness Intelligence):**
  - **Section 0: Declared Prompt & Task Intent:** Shows prompt text, intent synthesis, agent name, and copy button.
  - **Section 1: Independent Prompt vs Output Drift Guard:** Alignment score badge (0–100%), risk pill (LOW/MEDIUM/HIGH/CRITICAL), divergence alert box, What Prompt Gave vs. What Output Did comparison, discrepancy tags, risk assessment, and suggested remedy.
  - **Section 2: AI Model Synthesis:** Plain-English overview, mechanical changes bullet list, affected feature chips, downstream impact, and model badge.
  - **Section 3: Agent Execution Plan & Harness Checklist:** Interactive step checkboxes read from `vibetrace.md` (`- [x]` completed / `- [ ]` pending), notes, and mechanical checks (Syntax Check, AST Integrity, Sensitive Files, File Count, Line Delta).
  - **Section 4: Performance Telemetry:** Latency meter, model used, timestamp, git branch, and commit hash.
- **Bottom Status Bar & Live Observability Drawer:**
  - 6-state pulsing status dot and label (`WORKING`, `EDITING`, `ANALYZING`, `COMPLETED`, `DIFFERENCE`, `IDLE`).
  - Active log ticker streaming timestamped events.
  - Live Logs Drawer button with unread counter badge.
  - Slide-up terminal console (`#logs-drawer`) with live stream indicator, clear controls, and auto-scrolling log stream.
- **Mind Map Modal:**
  - Full-screen glassmorphic overlay with dynamic Mermaid architecture diagram, flaw & risk cards, and recommendations.

---

## Product Decisions & Guardrails

1. **Strict OpenRouter `.env` Binding:** OpenRouter is strictly locked to `process.env.OPENROUTER_API_MODEL`. Zero unauthorized fallback models or surprise token consumption.
2. **Resilient Local Heuristics:** If OpenRouter API key is missing or upstream limits return HTTP 429, VibeTrace seamlessly switches to local AST heuristics with 0 downtime.
3. **No False-Positive Red Alarms:** Red styling is strictly reserved for genuine divergence or critical drift. Aligned and verified code displays clean Sapphire Blue or Emerald Green.
4. **Persistent SQLite Telemetry:** Using Node.js native `node:sqlite`, all historical events are saved to `vibetrace.db` without heavy third-party ORM dependencies.
5. **Clean Interface Separation:** The dashboard focuses purely on passive observability, drift auditing, and telemetry—it is not an agent chat prompt runner.
