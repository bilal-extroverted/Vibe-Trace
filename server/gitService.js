const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitService {
  constructor(cwd = '.') {
    this.cwd = path.resolve(cwd);
  }

  setCwd(newCwd) {
    this.cwd = path.resolve(newCwd);
  }

  // Run shell git command safely
  execGit(cmd) {
    return new Promise((resolve) => {
      exec(`git ${cmd}`, { cwd: this.cwd, maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
        if (err) {
          resolve('');
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  // Ensure workspace is initialized as a Git repo and default .gitignore protects workspace
  async ensureRepoAndGitignore(targetDir = this.cwd) {
    const dir = path.resolve(targetDir);

    // 1. Ensure Git repository is initialized
    try {
      const isRepo = await this.execGit('rev-parse --is-inside-work-tree');
      if (isRepo !== 'true') {
        await this.execGit('init');
        console.log('[GitService] Initialized new Git repository in', dir);
      }
    } catch (e) {
      console.warn('[GitService] Git init check warning:', e.message);
    }

    // 2. Ensure default .gitignore exists with necessary isolation rules
    try {
      const gitignorePath = path.join(dir, '.gitignore');
      const defaultRules = [
        '# VibeTrace & Agent Isolation',
        '.agents/',
        '.env',
        '.env.*',
        '!.env.example',
        'node_modules/',
        'vibetrace.db*',
        'vibetrace.md'
      ];

      if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, defaultRules.join('\n') + '\n', 'utf8');
        console.log('[GitService] Created default .gitignore in', dir);
      } else {
        const existing = fs.readFileSync(gitignorePath, 'utf8');
        const missingRules = defaultRules.filter(r => !r.startsWith('#') && !existing.includes(r.replace('!', '')));
        if (missingRules.length > 0) {
          const appendContent = '\n# VibeTrace & Agent Isolation\n' + missingRules.join('\n') + '\n';
          fs.appendFileSync(gitignorePath, appendContent, 'utf8');
          console.log('[GitService] Appended isolation rules to .gitignore in', dir);
        }
      }
    } catch (e) {
      console.warn('[GitService] .gitignore isolation check warning:', e.message);
    }
  }

  // Get current active branch
  async getCurrentBranch() {
    const branch = await this.execGit('branch --show-current');
    return branch || 'main';
  }

  // Get recent commit logs
  async getRecentCommits(count = 5) {
    const log = await this.execGit(`log -n ${count} --pretty=format:"%h|%an|%ar|%s"`);
    if (!log) return [];
    return log.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });
  }

  // Get current unstaged and staged diffs
  async getDiffs() {
    // Check if git repo
    const isRepo = await this.execGit('rev-parse --is-inside-work-tree');
    if (isRepo !== 'true') {
      return [];
    }

    // Unstaged + staged diff
    const diffOutput = await this.execGit('diff HEAD');
    const fallbackDiff = diffOutput || await this.execGit('diff');
    
    // Parse git diff output into per-file chunks
    if (fallbackDiff) {
      return this.parseDiffChunks(fallbackDiff);
    }

    // Check untracked or modified files from status
    const status = await this.execGit('status --porcelain');
    if (status) {
      const files = status.split('\n').map(l => l.trim().split(/\s+/)[1]).filter(Boolean);
      if (files.length > 0) {
        return files.slice(0, 10).map(file => {
          try {
            const fullPath = path.join(this.cwd, file);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              const content = fs.readFileSync(fullPath, 'utf8').slice(0, 500);
              return {
                file,
                status: 'modified',
                content: content.split('\n').map(l => `+ ${l}`).join('\n')
              };
            }
          } catch (e) {}
          return { file, status: 'untracked', content: `+ [File created or modified]: ${file}` };
        });
      }
    }

    // Fallback: Check diff from most recent commit HEAD~1 HEAD if working directory is clean
    const recentCommitDiff = await this.execGit('diff HEAD~1 HEAD');
    if (recentCommitDiff) {
      return this.parseDiffChunks(recentCommitDiff);
    }

    return [];
  }

  parseDiffChunks(rawDiff) {
    const fileDiffs = [];
    // Only split at the start of lines to avoid matching code strings
    const chunks = rawDiff.split(/^diff --git /m);
    
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const lines = chunk.split('\n');
      const header = (lines[0] || '').replace(/\r$/, '').trim();
      const match = header.match(/^a\/(.+?)\s+b\/(.+)$/);
      let filename = match ? match[2].trim() : (header.split(' ')[0] || '').trim();
      filename = filename.replace(/^"|"$/g, ''); // strip quotes if any

      if (!filename || filename.length < 2 || filename.includes(');')) continue;

      const diffBody = lines.filter(l => l.startsWith('+') || l.startsWith('-') || l.startsWith('@')).join('\n');
      fileDiffs.push({
        file: filename,
        status: lines.some(l => l.includes('new file')) ? 'added' : 'modified',
        content: diffBody || chunk.slice(0, 1000)
      });
    }

    return fileDiffs;
  }
}

module.exports = new GitService();
