---
doc: spec
status: approved
---

# VibeTrace — Technical Blueprint

A local-first, side-by-side observability dashboard that connects to a local Git repository and harness context, watches AI coding mutations in real-time with debounced telemetry, and queries the OpenRouter API to produce plain-language causal summaries and interactive fishbone diagrams that flag unintended permission and architectural drift.

## How This Works, In Plain Language
VibeTrace consists of five simple, robust pieces working together:
1. **The Git & Harness Context Reader**: When connected to a repository, it reads recent `git log` commits, unstaged diffs, and inspects local agent skills / harness instructions (e.g., `skills/` or prompt rules). This provides deep context on what the agent was instructed to do versus what actually changed.
2. **The Debounced Workspace Watcher**: Watches the local folder for file modifications using `chokidar`. When an AI agent modifies multiple files in rapid succession, a 500ms debounce window groups them into a single, unified change event instead of spamming partial alerts.
3. **The Causal Intelligence Engine**: Takes the git diff and recent context, and sends a structured prompt to the **OpenRouter API** (`https://openrouter.ai/api/v1/chat/completions`). It extracts a plain-English highlight, maps touched subsystems into fishbone layers (Database, Logic, Config, Permissions), and flags any unintended drift. If an API key is absent or offline, an embedded local heuristic engine provides instant fallback results.
4. **The SSE Event Stream**: Uses standard **Server-Sent Events (SSE)** over HTTP to stream the enriched causal event to the browser instantly, eliminating the need for client-side polling or heavy WebSocket frameworks.
5. **The Glassmorphic Frontend Dashboard**: A single-page web app built with modern Vanilla CSS and JavaScript. It renders the timeline of change tiles on the left and the interactive, expandable fishbone breakdown on the right, styled in a minimalist monochrome dark glass aesthetic.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`
1. Developer runs `npm start` in the terminal ➔ Local Node.js server starts on `http://localhost:3000`.
2. Developer opens `http://localhost:3000` alongside their IDE (Cursor, Antigravity, VS Code) ➔ Browser establishes an SSE connection to `/api/events`.
3. Developer prompts their AI agent in the IDE ➔ Agent writes code to `database.sql` and alters permissions on `auth.key`.
4. File watcher detects the file writes ➔ 500ms debounce window batches the changes ➔ Server extracts `git diff` and touches files.
5. Server sends payload to OpenRouter API (or local fallback) ➔ Analyzes intent vs. diff ➔ Labels `Database` (intended) and `Permissions` (unintended drift warning).
6. Server pushes JSON event over SSE ➔ Dashboard plays a subtle status pulse ➔ A new tile appears in the left timeline pane.
7. Developer clicks the tile ➔ Main canvas displays the plain-English summary, highlights the permission alert in amber, and provides expandable fishbone bars to inspect the exact lines changed.

## Stack
- **Runtime**: Node.js (v18+)
  - *Rationale*: Zero-hassle native runtime available on developer machines; powers both local file monitoring and web serving.
- **Server Framework**: Express.js (v4.19+)
  - [Express Documentation](https://expressjs.com/)
  - *Rationale*: Minimalist, battle-tested HTTP server providing simple static file hosting and SSE streaming endpoints.
- **File Watcher**: `chokidar` (v3.6+)
  - [Chokidar Documentation](https://github.com/paulmillr/chokidar)
  - *Rationale*: Cross-platform filesystem watcher that avoids Node’s native `fs.watch` OS-specific quirks and handles debouncing gracefully.
- **Git Context Integration**: `simple-git` (v3.25+)
  - [Simple Git Documentation](https://github.com/steveukx/simple-git)
  - *Rationale*: Clean programmatic wrapper to inspect `git diff`, `git status`, and `git log` with zero external binary installation beyond standard Git.
- **AI Intelligence**: OpenRouter API
  - [OpenRouter API Reference](https://openrouter.ai/docs)
  - *Rationale*: OpenAI-compatible API endpoint allowing flexibility to route prompts to top models (Gemini, Claude 3.5 Sonnet, GPT-4o) using `OPENROUTER_API_KEY` from `.env`.
- **Frontend**: Vanilla HTML5, Modern CSS3, ES6 JavaScript
  - *Rationale*: Direct control over glassmorphism, zero build steps, instant browser refresh, and guaranteed reliability during hackathon demo recording.

## Where It Runs and How Someone Tries It
- **Runtime**: Local Node.js process running on `http://localhost:3000`.
- **Environment**: Node.js 18+ and Git installed. Optional `OPENROUTER_API_KEY` in `.env`.
- **Start Command**:
  ```bash
  npm install
  npm start
  ```
- **Demo Recording Verification**:
  Open `http://localhost:3000` side-by-side with your IDE. Use the dashboard's "Run Demo Scenario" button or perform a live edit in the watched repository to see the instant live logging, fishbone breakdown, and drift alert.

## Look and Feel
Carried forward from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`:
- **Color Palette**: Minimalist monochrome.
  - Background: Deep obsidian black (`#090a0f`) with subtle charcoal glass panels (`rgba(255, 255, 255, 0.04)`).
  - Borders: Sleek 1px frosted boundaries (`rgba(255, 255, 255, 0.08)`).
  - Text: High-contrast crisp white (`#f8fafc`) and muted slate grey (`#94a3b8`).
- **Semantic Accents**:
  - Safe / Verified: Emerald green (`#10b981`).
  - Unintended Drift Warning: Amber warning (`#f59e0b`) and Alert crimson (`#ef4444`).
- **Typography**: Inter / System sans-serif with clean tabular numbers for timestamps and diff counts.
- **Density**: High information density without clutter, using collapsible accordions and expandable fishbone cards.

## Components

### 1. Workspace & Git Watcher (`server/watcher.js`)
Implements `prd.md > 1. Live Project Watcher & Ingestion`
- Initializes `chokidar` on the target workspace directory, ignoring `.git`, `node_modules`, and lock files.
- Uses a 500ms debounce timer to batch multi-file modifications resulting from a single AI prompt.
- Executes `git diff` and `git status` via `simple-git` to extract modified file paths and line-by-line diffs.

### 2. Harness & Skills Context Reader (`server/harnessContext.js`)
Implements `prd.md > 1. Live Project Watcher & Ingestion`
- Scans the repository for agent instruction files (e.g. `skills/*/SKILL.md`, `README.md`, or agent rules).
- Extracts rule context so the causal engine can compare what the agent was instructed to touch vs. what it mutated.

### 3. Causal Intelligence & OpenRouter Engine (`server/analyzer.js`)
Implements `prd.md > 3. Plain-English Summary & Causal Highlight` and `prd.md > 4. Interactive Fishbone Causal Breakdown`
- Formats prompt intent, touched files, diffs, and harness context into a structured prompt.
- Calls OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) using model `google/gemini-2.5-flash` or `openai/gpt-4o-mini` with JSON output formatting.
- **Fallback Engine**: If `OPENROUTER_API_KEY` is missing or offline, a local rule-based heuristic immediately parses the diff:
  - Detects schema files (`.sql`, `prisma`, `migrations`) ➔ categorized as *Database*.
  - Detects app code (`.js`, `.ts`, `.py`) ➔ categorized as *Application Logic*.
  - Detects environment/configs (`.env*`, `.yaml`, `config.json`) ➔ categorized as *Configuration*.
  - Detects permission changes (`chmod`, security flags, key files) ➔ triggers *Unintended Drift Warning*.

### 4. SSE Telemetry Stream (`server/sse.js`)
Implements `prd.md > 1. Live Project Watcher & Ingestion`
- Maintains an open `/api/events` SSE channel with connected browser clients.
- Broadcasts new `ChangeEvent` JSON payloads as soon as the analyzer completes.

### 5. Glassmorphic Timeline & Fishbone Dashboard (`public/`)
- `public/index.html`: Core structure containing Top Bar, Left Timeline Pane, and Main Fishbone Canvas.
- `public/style.css`: Minimalist monochrome glassmorphism styling, backdrop filters, animations, and typography tokens.
- `public/app.js`: Connects to `EventSource('/api/events')`, manages active event state, renders chronological tiles, and drives interactive expandable fishbone bars.
- `public/diffViewer.js`: Renders inline file diffs with colored line markers (`+` additions, `-` deletions).

### 6. Interactive Demo Scenario Runner (`server/scenarios.js`)
Implements `prd.md > States and Boundaries > Empty / Initial State`
- Provides pre-packaged scenarios (including the *Database Migration + Silent Permission Drift* scenario) accessible via a quick-action button in the UI for instant testing and video recording.

## Data Model
The canonical event schema pushed to the client and stored in session memory:
```javascript
{
  id: "evt_1729788000_1",
  timestamp: "17:20:00",
  title: "Added Users Database Table",
  summary: "Created the users SQL schema with ID, email, and password hash fields.",
  git: {
    branch: "main",
    filesChanged: ["db/schema.sql", "config/permissions.json"],
    additions: 24,
    deletions: 2
  },
  fishbone: {
    cause: "User Prompt: Add a new users table",
    layers: [
      {
        name: "Database Layer",
        status: "intended",
        description: "Created users table with required indices.",
        files: ["db/schema.sql"]
      },
      {
        name: "Application Logic",
        status: "neutral",
        description: "No application route logic modified in this step.",
        files: []
      },
      {
        name: "Configuration & Permissions",
        status: "drift",
        description: "File permissions altered on permissions.json without prompt instruction.",
        files: ["config/permissions.json"]
      }
    ]
  },
  driftDetected: true,
  driftMessage: "Unintended Drift Warning: Permission rules modified outside prompt scope.",
  diffs: [
    {
      file: "db/schema.sql",
      status: "added",
      content: "+ CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT, password_hash TEXT);"
    },
    {
      file: "config/permissions.json",
      status: "modified",
      content: "- \"public_access\": false\n+ \"public_access\": true"
    }
  ]
}
```

## File Structure
```
learn-ai-basics/
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
├── server/
│   ├── index.js              # Express app, static server, and API router
│   ├── watcher.js            # Chokidar workspace watcher with debouncing
│   ├── gitService.js         # Simple-git wrapper for diffs and logs
│   ├── harnessContext.js     # Reads local agent skills & rules
│   ├── analyzer.js           # OpenRouter API client with local heuristic fallback
│   ├── sse.js                # Server-Sent Events broadcaster
│   └── scenarios.js          # Pre-packaged test scenarios for demo recording
├── public/
│   ├── index.html            # Single-page dashboard markup
│   ├── style.css             # Monochrome glassmorphism styles
│   ├── app.js                # SSE client, event dispatcher, state manager
│   ├── fishbone.js           # Interactive expandable fishbone renderer
│   └── diffViewer.js         # Lightweight syntax-colored diff component
├── .env.example              # Template with OPENROUTER_API_KEY
├── package.json              # Express, Chokidar, simple-git, dotenv
└── README.md
```

## External Services and Dependencies
- **OpenRouter API**:
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Auth: `Authorization: Bearer OPENROUTER_API_KEY`
  - Docs: [https://openrouter.ai/docs](https://openrouter.ai/docs)
  - Rate limits: Generous per-model limits; handled by non-blocking async calls.
  - Fallback: Local semantic heuristic engine triggers automatically if API key is missing or request times out after 4 seconds.

## Important Failure Modes
- **Missing or Invalid OpenRouter API Key**: The dashboard seamlessly switches to the built-in local heuristic analyzer. The UI continues to display full plain-English summaries and fishbone breakdowns without error popups.
- **Watched Directory Not a Git Repo**: The server falls back to direct filesystem diffing using file read buffers, noting `Git context: non-git repository`.
- **Rapid Burst of AI File Saves**: The 500ms debouncing window swallows intermediary file states, preventing duplicated or partial event tiles.

## What Was Simplified and Why
- **Server-Sent Events (SSE) instead of WebSockets**: SSE uses standard HTTP and automatic native browser reconnects, eliminating WebSocket handshake failures and reconnect state bugs.
- **Direct Fetch to OpenRouter instead of Heavy SDKs**: Avoids bulky SDK dependencies and provides zero-overhead OpenAI-compatible REST calls.
- **Pure Vanilla CSS Glassmorphism instead of Tailwind/React**: Eliminates build steps, bundler configuration, and npm compile errors, ensuring instant load time and 100% predictable styling.

## Decisions and Open Issues
- **Decisions Made**:
  - Selected OpenRouter API as primary LLM intelligence with an embedded offline heuristic fallback.
  - Integrated Git status/diff and local agent skills/harness context for rich causal analysis.
  - Sized for a clean, local-first web dashboard running on `localhost:3000`.
- **One Useful Unknown Clarified**:
  - *Debouncing and Batching*: Clarified how rapid multi-file AI edits are batched cleanly within a 500ms quiet window to ensure complete, unified prompt events.
