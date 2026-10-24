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
    
    if (!fallbackDiff) {
      // Check untracked or modified files from status
      const status = await this.execGit('status --porcelain');
      if (!status) return [];
      
      const files = status.split('\n').map(l => l.trim().split(/\s+/)[1]).filter(Boolean);
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

    // Parse git diff output into per-file chunks
    const fileDiffs = [];
    const chunks = fallbackDiff.split('diff --git ');
    
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const lines = chunk.split('\n');
      const header = lines[0] || '';
      const match = header.match(/a\/(.+?)\s+b\/(.+)/);
      const filename = match ? match[2] : header.split(' ')[0];

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
