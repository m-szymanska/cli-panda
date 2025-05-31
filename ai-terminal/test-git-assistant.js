#!/usr/bin/env node

// Test file for the git assistant feature
const { spawn } = require('child_process');

// Simple color functions
const colors = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

// Mock GitAssistant functionality
class MockGitAssistant {
    constructor() {
        this.workingDirectory = process.cwd();
    }

    async isGitRepository() {
        return new Promise((resolve) => {
            const process = spawn('git', ['rev-parse', '--git-dir'], {
                cwd: this.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            process.on('close', (code) => {
                resolve(code === 0);
            });

            process.on('error', () => {
                resolve(false);
            });
        });
    }

    async getGitStatus() {
        return new Promise((resolve) => {
            const process = spawn('git', ['status', '--porcelain'], {
                cwd: this.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    const lines = output.split('\n').filter(line => line.trim());
                    const status = {
                        staged: [],
                        unstaged: [],
                        untracked: []
                    };

                    lines.forEach(line => {
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

                    resolve(status);
                } else {
                    resolve(null);
                }
            });

            process.on('error', () => {
                resolve(null);
            });
        });
    }

    async getCurrentBranch() {
        return new Promise((resolve) => {
            const process = spawn('git', ['branch', '--show-current'], {
                cwd: this.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                resolve(code === 0 ? output.trim() : 'unknown');
            });

            process.on('error', () => {
                resolve('unknown');
            });
        });
    }

    async analyzeChanges() {
        const isRepo = await this.isGitRepository();
        
        if (!isRepo) {
            return colors.red('❌ Not in a git repository');
        }

        const status = await this.getGitStatus();
        const branch = await this.getCurrentBranch();
        
        if (!status) {
            return colors.red('❌ Error getting git status');
        }

        let analysis = `\n🔍 Git Repository Analysis:\n\n`;
        
        // Repository status
        analysis += `📍 Branch: ${colors.cyan(branch)}\n`;

        // File counts
        analysis += `\n📊 Changes Summary:\n`;
        analysis += `  ${colors.green('✓')} Staged: ${status.staged.length} files\n`;
        analysis += `  ${colors.yellow('○')} Unstaged: ${status.unstaged.length} files\n`;
        analysis += `  ${colors.blue('?')} Untracked: ${status.untracked.length} files\n`;

        // Detailed file lists
        if (status.staged.length > 0) {
            analysis += `\n${colors.green('Staged for commit:')}\n`;
            status.staged.forEach(file => {
                analysis += `  ${colors.green('✓')} ${file}\n`;
            });
        }

        if (status.unstaged.length > 0) {
            analysis += `\n${colors.yellow('Modified (unstaged):')}\n`;
            status.unstaged.forEach(file => {
                analysis += `  ${colors.yellow('○')} ${file}\n`;
            });
        }

        if (status.untracked.length > 0) {
            analysis += `\n${colors.blue('Untracked files:')}\n`;
            status.untracked.slice(0, 5).forEach(file => {
                analysis += `  ${colors.blue('?')} ${file}\n`;
            });
            if (status.untracked.length > 5) {
                analysis += `  ... and ${status.untracked.length - 5} more\n`;
            }
        }

        analysis += `\n🤖 AI Analysis: Ready for git operations!\n`;

        return analysis;
    }

    async getRecommendations() {
        const isRepo = await this.isGitRepository();
        
        if (!isRepo) {
            return colors.red('❌ Not in a git repository');
        }

        const status = await this.getGitStatus();
        
        if (!status) {
            return colors.red('❌ Error getting git status');
        }

        let recommendations = `\n💡 Git Recommendations:\n\n`;

        if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
            recommendations += `${colors.green('✅ Working directory clean - no changes to commit')}\n`;
            return recommendations;
        }

        // Staging recommendations
        if (status.unstaged.length > 0) {
            recommendations += `📝 Stage changes for commit:\n`;
            recommendations += `   ${colors.cyan('!git add .')} - stage all changes\n`;
            recommendations += `   ${colors.cyan('!git add <file>')} - stage specific files\n\n`;
        }

        if (status.untracked.length > 0) {
            recommendations += `📁 Untracked files detected:\n`;
            recommendations += `   ${colors.cyan('!git add <file>')} - track important files\n`;
            recommendations += `   Add to .gitignore if not needed\n\n`;
        }

        // Commit recommendations
        if (status.staged.length > 0) {
            recommendations += `💾 Ready to commit ${status.staged.length} staged file(s):\n`;
            recommendations += `   ${colors.cyan('!git commit -m "message"')} - commit with message\n`;
            recommendations += `   Or ask: ${colors.cyan('?? generate commit message')}\n\n`;
        }

        // Workflow suggestions
        recommendations += `🔄 Common next steps:\n`;
        if (status.unstaged.length > 0 || status.untracked.length > 0) {
            recommendations += `   1. Review changes: ${colors.cyan('?? git status')}\n`;
            recommendations += `   2. Stage files: ${colors.cyan('!git add <files>')}\n`;
            recommendations += `   3. Commit: ${colors.cyan('!git commit -m "message"')}\n`;
        }
        if (status.staged.length > 0) {
            recommendations += `   1. Commit staged changes\n`;
            recommendations += `   2. Push to remote: ${colors.cyan('!git push')}\n`;
        }

        return recommendations;
    }

    generateCommitMessage() {
        return colors.green('💡 Suggested commit message:\n' + 
            colors.cyan('feat: implement git assistant for AI terminal\n\n' +
            '- Add GitAssistant class with status analysis\n' +
            '- Integrate git operations into InlineAI\n' +
            '- Support commit message generation and recommendations'));
    }
}

// Test the git assistant
async function runTests() {
    console.log(colors.blue('Testing Git Assistant functionality...\n'));

    const gitAssistant = new MockGitAssistant();

    // Test 1: Check if in git repo
    console.log(colors.yellow('Test 1: Check if in git repository'));
    const isRepo = await gitAssistant.isGitRepository();
    console.log(isRepo ? colors.green('✓ In git repository') : colors.red('✗ Not in git repository'));

    if (!isRepo) {
        console.log(colors.yellow('\nSkipping git tests - not in a git repository'));
        return;
    }

    // Test 2: Analyze changes
    console.log(colors.yellow('\nTest 2: Analyze git changes'));
    const analysis = await gitAssistant.analyzeChanges();
    console.log(analysis);

    // Test 3: Get recommendations
    console.log(colors.yellow('\nTest 3: Get git recommendations'));
    const recommendations = await gitAssistant.getRecommendations();
    console.log(recommendations);

    // Test 4: Generate commit message
    console.log(colors.yellow('\nTest 4: Generate commit message'));
    const commitMessage = gitAssistant.generateCommitMessage();
    console.log(commitMessage);

    console.log(colors.green('\n✅ Git assistant tests completed!'));
}

runTests().catch(console.error);