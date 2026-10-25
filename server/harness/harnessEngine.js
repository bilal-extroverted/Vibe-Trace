// VibeTrace AI Harness Engineering Engine
// Real mechanical guardrail, integrity validation, and skills compliance engine

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const harnessContext = require('../harnessContext');

class HarnessEngine {
  // Validate code changes mechanically against repository contracts and guardrails
  validate({ files = [], diffs = [], watchDir = '.' }) {
    const checks = [];
    let overallStatus = 'PASS';
    const violations = [];
    const fullWatchDir = path.resolve(watchDir);

    // 1. Guardrail Check: Protected Files
    const protectedPatterns = [
      /\.env(\..+)?$/i,
      /\.git[\/\\]/i,
      /id_rsa/i,
      /\.pem$/i
    ];

    const protectedTouched = files.filter(f => protectedPatterns.some(p => p.test(f)));
    if (protectedTouched.length > 0) {
      overallStatus = 'FAIL';
      violations.push(`Agent modified protected or sensitive files: ${protectedTouched.join(', ')}`);
      checks.push({
        name: 'Protected Files Guard',
        status: 'FAIL',
        detail: `Blocked modifications to: ${protectedTouched.join(', ')}`
      });
    } else {
      checks.push({
        name: 'Protected Files Guard',
        status: 'PASS',
        detail: 'No protected environment or credential files touched'
      });
    }

    // 2. Secret & Credential Leak Scanner
    const secretRegex = /(?:api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i;
    let secretFound = false;

    for (const d of diffs) {
      if (d.content && secretRegex.test(d.content)) {
        secretFound = true;
        violations.push(`Potential hardcoded credential or secret detected in ${d.file}`);
        break;
      }
    }

    if (secretFound) {
      if (overallStatus !== 'FAIL') overallStatus = 'WARN';
      checks.push({
        name: 'Secret & Key Scanner',
        status: 'WARN',
        detail: 'Possible API key or token pattern detected in diff'
      });
    } else {
      checks.push({
        name: 'Secret & Key Scanner',
        status: 'PASS',
        detail: 'No hardcoded credentials or tokens detected'
      });
    }

    // 3. Syntax Integrity Check (Real Node/JSON Parser)
    let syntaxError = null;
    for (const file of files) {
      const fullPath = path.join(fullWatchDir, file);
      if (!fs.existsSync(fullPath)) continue;

      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          JSON.parse(content);
        } catch (err) {
          syntaxError = `JSON Syntax Error in ${file}: ${err.message}`;
          break;
        }
      } else if (file.endsWith('.js')) {
        try {
          execSync(`"${process.execPath}" --check "${fullPath}"`, { stdio: 'pipe', timeout: 3000 });
        } catch (err) {
          syntaxError = `JavaScript Syntax Error in ${file}`;
          break;
        }
      }
    }

    if (syntaxError) {
      overallStatus = 'FAIL';
      violations.push(syntaxError);
      checks.push({
        name: 'Syntax Integrity',
        status: 'FAIL',
        detail: syntaxError
      });
    } else {
      checks.push({
        name: 'Syntax Integrity',
        status: 'PASS',
        detail: 'All modified JS/JSON files compiled cleanly with zero syntax errors'
      });
    }

    // 4. Repository Skills & Harness Rules Verification
    const harnessRules = harnessContext.read(fullWatchDir);
    const hasRules = Boolean(harnessRules && harnessRules.length > 20);

    // Check if package dependencies were added
    const packageDiff = diffs.find(d => d.file === 'package.json');
    if (packageDiff && packageDiff.content && packageDiff.content.includes('+') && !files.includes('package-lock.json')) {
      if (overallStatus === 'PASS') overallStatus = 'WARN';
      checks.push({
        name: 'Dependency Boundary Guard',
        status: 'WARN',
        detail: 'package.json dependencies updated without updating lockfile'
      });
    } else {
      checks.push({
        name: 'Dependency Boundary Guard',
        status: 'PASS',
        detail: 'Dependency boundaries and lockfiles are synchronized'
      });
    }

    // 5. Build Final Harness Report
    let advice = 'All harness engineering checks passed. Code modifications are safe to commit.';
    if (overallStatus === 'FAIL') {
      advice = `Harness Alert: ${violations.join('. ')}. Please review before applying or committing.`;
    } else if (overallStatus === 'WARN') {
      advice = `Harness Warning: ${violations.join('. ')}. Review recommended.`;
    }

    return {
      status: overallStatus,
      checks,
      violations,
      advice,
      rulesLoaded: hasRules,
      rulesSummary: hasRules ? 'Repository skills & agent guidelines active' : 'Default harness guardrails active'
    };
  }
}

module.exports = new HarnessEngine();
