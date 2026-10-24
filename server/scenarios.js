// Pre-Packaged Demo Scenarios for VibeTrace
const express = require('express');
const router = express.Router();
const { analyze } = require('./analyzer');
const sse = require('./sse');

const SCENARIOS = {
  database_permission_drift: {
    id: 'scenario_db_drift',
    name: 'Database Table + Silent Permission Drift',
    prompt: 'Add a new users database table with schema migrations',
    diffs: [
      {
        file: 'migrations/001_create_users_table.sql',
        status: 'added',
        content: `+ CREATE TABLE users (
+   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+   email VARCHAR(255) UNIQUE NOT NULL,
+   password_hash VARCHAR(255) NOT NULL,
+   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
+ );
+ CREATE INDEX idx_users_email ON users(email);`
      },
      {
        file: 'config/permissions.json',
        status: 'modified',
        content: `  {
    "service": "database",
-   "allow_public_registration": false,
-   "require_admin_approval": true
+   "allow_public_registration": true,
+   "require_admin_approval": false,
+   "chmod_override": "0777"
  }`
      }
    ],
    gitContext: {
      branch: 'feature/user-table',
      commitHash: 'a89f31c'
    }
  },

  safe_component_update: {
    id: 'scenario_safe_component',
    name: 'Safe Component & Styles Update',
    prompt: 'Improve button hover states and responsive card layout',
    diffs: [
      {
        file: 'src/components/Card.jsx',
        status: 'modified',
        content: `  export function Card({ title, children }) {
    return (
-     <div className="card">
+     <div className="card card-interactive">
        <h3>{title}</h3>
        {children}
      </div>
    );
  }`
      },
      {
        file: 'src/styles/card.css',
        status: 'modified',
        content: `+ .card-interactive:hover {
+   transform: translateY(-2px);
+   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
+ }`
      }
    ],
    gitContext: {
      branch: 'main',
      commitHash: 'e410b98'
    }
  }
};

// Route to run a demo scenario
router.post('/run', async (req, res) => {
  const scenarioKey = req.body.scenario || 'database_permission_drift';
  const scenario = SCENARIOS[scenarioKey] || SCENARIOS.database_permission_drift;

  const analysis = await analyze({
    prompt: scenario.prompt,
    diffs: scenario.diffs,
    gitContext: scenario.gitContext
  });

  const event = {
    id: `evt_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    ...analysis
  };

  // Broadcast to all connected clients
  sse.broadcast({ type: 'change', event });

  res.json({ success: true, event });
});

// Route to list scenarios
router.get('/list', (req, res) => {
  const list = Object.keys(SCENARIOS).map(k => ({
    key: k,
    name: SCENARIOS[k].name,
    prompt: SCENARIOS[k].prompt
  }));
  res.json(list);
});

module.exports = { router, SCENARIOS };
