const fs = require('fs');
const path = require('path');

class HarnessContextReader {
  read(targetDir = '.') {
    const rules = [];
    const dir = path.resolve(targetDir);

    // 1. Check for skills directory
    const skillsDir = path.join(dir, 'skills');
    if (fs.existsSync(skillsDir) && fs.statSync(skillsDir).isDirectory()) {
      try {
        const subdirs = fs.readdirSync(skillsDir);
        for (const sub of subdirs) {
          const skillFile = path.join(skillsDir, sub, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            const content = fs.readFileSync(skillFile, 'utf8').slice(0, 500);
            rules.push(`[Skill: ${sub}] ${content.replace(/\n+/g, ' ')}`);
          }
        }
      } catch (e) {}
    }

    // 2. Check for devpost planning docs
    const devpostDir = path.join(dir, 'devpost');
    if (fs.existsSync(devpostDir) && fs.statSync(devpostDir).isDirectory()) {
      const prdFile = path.join(devpostDir, 'prd.md');
      if (fs.existsSync(prdFile)) {
        rules.push(`[PRD Boundary] Checked against devpost/prd.md specifications`);
      }
    }

    // 3. Check for .gemini, .cursor, .claude or AGENTS.md
    ['AGENTS.md', 'GEMINI.md', '.cursorrules'].forEach(ruleFile => {
      const p = path.join(dir, ruleFile);
      if (fs.existsSync(p)) {
        const snippet = fs.readFileSync(p, 'utf8').slice(0, 300);
        rules.push(`[Rule: ${ruleFile}] ${snippet.replace(/\n+/g, ' ')}`);
      }
    });

    return rules.join(' | ') || 'Default clean engineering rules';
  }
}

module.exports = new HarnessContextReader();
