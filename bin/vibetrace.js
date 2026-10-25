#!/usr/bin/env node
const path = require('path');

// Ensure WATCH_DIR points to the current working directory where the CLI was invoked
if (!process.env.WATCH_DIR) {
  process.env.WATCH_DIR = process.cwd();
}

console.log('⚡ VibeTrace — AI Code Observability Harness');
console.log('Watching workspace:', process.env.WATCH_DIR);

require('../server/index.js');
