import { spawn } from 'child_process';
import { LMStudioService } from '../core/lmstudio';
import chalk from 'chalk';

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  branch: string;
  ahead: number;
  behind: number;
}

export class GitAssistant {
  private lmStudio: LMStudioService;
  private workingDirectory: string;

  constructor(lmStudio: LMStudioService, workingDirectory: string = process.cwd()) {
    this.lmStudio = lmStudio;
    this.workingDirectory = workingDirectory;
  }

  async isGitRepository(): Promise<boolean> {
    try {
      const result = await this.runGitCommand(['rev-parse', '--git-dir']);
      return result.success;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<GitStatus | null> {
    if (!(await this.isGitRepository())) {
      return null;
    }

    try {
      const [statusResult, branchResult] = await Promise.all([
        this.runGitCommand(['status', '--porcelain']),
        this.runGitCommand(['status', '--branch', '--porcelain'])
      ]);

      if (!statusResult.success || !branchResult.success) {
        return null;
      }

      const status: GitStatus = {
        staged: [],
        unstaged: [],
        untracked: [],
        branch: 'unknown',
        ahead: 0,
        behind: 0
      };

      // Parse status output
      const statusLines = statusResult.output.split('\n').filter(line => line.trim());
      statusLines.forEach(line => {
        const statusCode = line.substring(0, 2);
        const fileName = line.substring(3);

        if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
          status.staged.push(fileName);
        }
        if (statusCode[1] !== ' ' && statusCode[1] !== '?') {
          status.unstaged.push(fileName);
        }
        if (statusCode === '??') {
          status.untracked.push(fileName);
        }
      });

      // Parse branch info
      const branchLine = branchResult.output.split('\n')[0];
      const branchMatch = branchLine.match(/## ([^.\s]+)/);
      if (branchMatch) {
        status.branch = branchMatch[1];
      }

      // Parse ahead/behind info
      const aheadBehindMatch = branchLine.match(/\[ahead (\d+)(?:, behind (\d+))?\]|\[behind (\d+)\]/);
      if (aheadBehindMatch) {
        status.ahead = parseInt(aheadBehindMatch[1] || '0', 10);
        status.behind = parseInt(aheadBehindMatch[2] || aheadBehindMatch[3] || '0', 10);
      }

      return status;
    } catch (error) {
      return null;
    }
  }

  async getDiff(staged: boolean = false): Promise<string | null> {
    if (!(await this.isGitRepository())) {
      return null;
    }

    try {
      const args = staged ? ['diff', '--cached'] : ['diff'];
      const result = await this.runGitCommand(args);
      return result.success ? result.output : null;
    } catch {
      return null;
    }
  }

  async generateCommitMessage(): Promise<string> {
    const status = await this.getStatus();
    const diff = await this.getDiff(true); // staged changes

    if (!status || status.staged.length === 0) {
      return chalk.yellow('⚠️ No staged changes to commit');
    }

    const prompt = `
Generate a concise, conventional commit message for these changes:

Staged files: ${status.staged.join(', ')}

Diff (first 2000 chars):
\`\`\`
${diff ? diff.substring(0, 2000) : 'No diff available'}
\`\`\`

Follow conventional commit format:
- feat: new feature
- fix: bug fix  
- docs: documentation
- style: formatting/style
- refactor: code restructuring
- test: adding tests
- chore: maintenance

Provide only the commit message, no explanation.`;

    try {
      const message = await this.lmStudio.getCompletion(prompt);
      return chalk.green(`💡 Suggested commit message:\n${chalk.cyan(message.trim())}`);
    } catch (error) {
      return chalk.red(`❌ Error generating commit message: ${error.message}`);
    }
  }

  async analyzeChanges(): Promise<string> {
    const status = await this.getStatus();
    
    if (!status) {
      return chalk.red('❌ Not in a git repository');
    }

    const diff = await this.getDiff(false); // unstaged changes
    const stagedDiff = await this.getDiff(true); // staged changes

    let analysis = `\n🔍 Git Repository Analysis:\n\n`;
    
    // Repository status
    analysis += `📍 Branch: ${chalk.cyan(status.branch)}\n`;
    if (status.ahead > 0) {
      analysis += `⬆️  Ahead: ${chalk.green(status.ahead)} commits\n`;
    }
    if (status.behind > 0) {
      analysis += `⬇️  Behind: ${chalk.red(status.behind)} commits\n`;
    }

    // File counts
    analysis += `\n📊 Changes Summary:\n`;
    analysis += `  ${chalk.green('✓')} Staged: ${status.staged.length} files\n`;
    analysis += `  ${chalk.yellow('○')} Unstaged: ${status.unstaged.length} files\n`;
    analysis += `  ${chalk.blue('?')} Untracked: ${status.untracked.length} files\n`;

    // Detailed file lists
    if (status.staged.length > 0) {
      analysis += `\n${chalk.green('Staged for commit:')}\n`;
      status.staged.forEach(file => {
        analysis += `  ${chalk.green('✓')} ${file}\n`;
      });
    }

    if (status.unstaged.length > 0) {
      analysis += `\n${chalk.yellow('Modified (unstaged):')}\n`;
      status.unstaged.forEach(file => {
        analysis += `  ${chalk.yellow('○')} ${file}\n`;
      });
    }

    if (status.untracked.length > 0) {
      analysis += `\n${chalk.blue('Untracked files:')}\n`;
      status.untracked.slice(0, 5).forEach(file => {
        analysis += `  ${chalk.blue('?')} ${file}\n`;
      });
      if (status.untracked.length > 5) {
        analysis += `  ... and ${status.untracked.length - 5} more\n`;
      }
    }

    // AI analysis of changes
    if (diff || stagedDiff) {
      const prompt = `
Analyze these git changes and provide insights:

${stagedDiff ? `Staged changes:\n${stagedDiff.substring(0, 1000)}` : ''}
${diff ? `\nUnstaged changes:\n${diff.substring(0, 1000)}` : ''}

Provide:
1. Summary of what's being changed
2. Type of changes (features, fixes, refactoring, etc.)
3. Any concerns or suggestions

Keep the response concise (2-3 sentences).`;

      try {
        const aiAnalysis = await this.lmStudio.getCompletion(prompt);
        analysis += `\n🤖 AI Analysis:\n${aiAnalysis}\n`;
      } catch (error) {
        analysis += `\n⚠️ Could not generate AI analysis: ${error.message}\n`;
      }
    }

    return analysis;
  }

  async getRecommendations(): Promise<string> {
    const status = await this.getStatus();
    
    if (!status) {
      return chalk.red('❌ Not in a git repository');
    }

    let recommendations = `\n💡 Git Recommendations:\n\n`;

    if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
      recommendations += `${chalk.green('✅ Working directory clean - no changes to commit')}\n`;
      
      if (status.ahead > 0) {
        recommendations += `💾 Consider pushing your ${status.ahead} commit(s): ${chalk.cyan('!git push')}\n`;
      }
      if (status.behind > 0) {
        recommendations += `⬇️  Pull ${status.behind} new commit(s): ${chalk.cyan('!git pull')}\n`;
      }
      
      return recommendations;
    }

    // Staging recommendations
    if (status.unstaged.length > 0) {
      recommendations += `📝 Stage changes for commit:\n`;
      recommendations += `   ${chalk.cyan('!git add .')} - stage all changes\n`;
      recommendations += `   ${chalk.cyan('!git add <file>')} - stage specific files\n\n`;
    }

    if (status.untracked.length > 0) {
      recommendations += `📁 Untracked files detected:\n`;
      recommendations += `   ${chalk.cyan('!git add <file>')} - track important files\n`;
      recommendations += `   Add to .gitignore if not needed\n\n`;
    }

    // Commit recommendations
    if (status.staged.length > 0) {
      recommendations += `💾 Ready to commit ${status.staged.length} staged file(s):\n`;
      recommendations += `   ${chalk.cyan('!git commit -m "message"')} - commit with message\n`;
      recommendations += `   Or ask: ${chalk.cyan('?? generate commit message')}\n\n`;
    }

    // Workflow suggestions
    recommendations += `🔄 Common next steps:\n`;
    if (status.unstaged.length > 0 || status.untracked.length > 0) {
      recommendations += `   1. Review changes: ${chalk.cyan('?? git status')}\n`;
      recommendations += `   2. Stage files: ${chalk.cyan('!git add <files>')}\n`;
      recommendations += `   3. Commit: ${chalk.cyan('!git commit -m "message"')}\n`;
    }
    if (status.staged.length > 0) {
      recommendations += `   1. Commit staged changes\n`;
      recommendations += `   2. Push to remote: ${chalk.cyan('!git push')}\n`;
    }

    return recommendations;
  }

  private async runGitCommand(args: string[]): Promise<{success: boolean, output: string}> {
    return new Promise((resolve) => {
      const process = spawn('git', args, {
        cwd: this.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout || stderr
        });
      });

      process.on('error', () => {
        resolve({
          success: false,
          output: 'Git command failed to execute'
        });
      });
    });
  }
}