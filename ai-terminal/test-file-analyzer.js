#!/usr/bin/env node

// Test file for the file analyzer feature
const fs = require('fs').promises;
const path = require('path');

// Simple color functions
const colors = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

// Mock FileAnalyzer functionality for testing
class MockFileAnalyzer {
    constructor() {
        this.supportedExtensions = [
            '.js', '.ts', '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h',
            '.json', '.yaml', '.yml', '.toml', '.md', '.txt', '.sh', '.zsh',
            '.css', '.html', '.xml', '.svg', '.dockerfile', '.gitignore',
            '.env', '.conf', '.config', '.ini', '.sql'
        ];
    }

    async analyzeFile(filePath) {
        try {
            const absolutePath = path.resolve(filePath);
            const stats = await fs.stat(absolutePath);
            
            if (!stats.isFile()) {
                return colors.red(`❌ ${filePath} is not a file`);
            }

            const ext = path.extname(filePath).toLowerCase();
            if (!this.supportedExtensions.includes(ext)) {
                return colors.yellow(`⚠️ File type ${ext} is not supported for analysis`);
            }

            const content = await fs.readFile(absolutePath, 'utf-8');
            const lines = content.split('\n').length;
            const size = Math.round(stats.size / 1024);
            
            return colors.green(`📄 Analysis of ${colors.cyan(filePath)}:
            
Type: ${ext.substring(1).toUpperCase()} file
Size: ${size}KB
Lines: ${lines}
Purpose: ${this.guessPurpose(filePath, content)}
${this.getFileIcon(ext)} Ready for AI analysis!`);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return colors.red(`❌ File not found: ${filePath}`);
            } else if (error.code === 'EACCES') {
                return colors.red(`❌ Permission denied: ${filePath}`);
            } else {
                return colors.red(`❌ Error reading file: ${error.message}`);
            }
        }
    }

    async listFiles() {
        try {
            const files = await fs.readdir('.', { withFileTypes: true });
            
            const fileList = files
                .filter(file => file.isFile())
                .map(file => {
                    const ext = path.extname(file.name).toLowerCase();
                    const isSupported = this.supportedExtensions.includes(ext);
                    const icon = this.getFileIcon(ext);
                    const status = isSupported ? colors.green('✓') : colors.red('○');
                    return `${status} ${icon} ${file.name}`;
                })
                .join('\n');

            return `📂 Files in current directory:\n${fileList}`;
            
        } catch (error) {
            return colors.red(`❌ Error listing files: ${error.message}`);
        }
    }

    guessPurpose(filePath, content) {
        const filename = path.basename(filePath).toLowerCase();
        const firstLines = content.split('\n').slice(0, 5).join(' ').toLowerCase();
        
        if (filename.includes('test')) return 'Test file';
        if (filename.includes('config')) return 'Configuration file';
        if (filename === 'package.json') return 'Node.js package manifest';
        if (filename === 'readme.md') return 'Project documentation';
        if (firstLines.includes('#!/usr/bin/env')) return 'Executable script';
        if (firstLines.includes('import') || firstLines.includes('require')) return 'Source code module';
        
        return 'Source file';
    }

    getFileIcon(extension) {
        const icons = {
            '.js': '🟨',
            '.ts': '🔷',
            '.py': '🐍',
            '.rs': '🦀',
            '.go': '🐹',
            '.java': '☕',
            '.cpp': '⚙️',
            '.c': '⚙️',
            '.json': '📋',
            '.yaml': '📄',
            '.yml': '📄',
            '.md': '📝',
            '.txt': '📄',
            '.sh': '🐚',
            '.env': '🔧',
            '.css': '🎨',
            '.html': '🌐',
        };
        
        return icons[extension] || '📄';
    }

    static isFilePath(input) {
        return /^[./]/.test(input) || 
               /\.[a-zA-Z0-9]+$/.test(input) ||
               input.includes('/') ||
               input.includes('\\');
    }
}

// Test the file analyzer
async function runTests() {
    console.log(colors.blue('Testing File Analyzer functionality...\n'));

    const analyzer = new MockFileAnalyzer();

    // Test 1: List files
    console.log(colors.yellow('Test 1: List files in directory'));
    const fileList = await analyzer.listFiles();
    console.log(fileList);

    console.log(colors.yellow('\nTest 2: Analyze package.json'));
    const packageAnalysis = await analyzer.analyzeFile('package.json');
    console.log(packageAnalysis);

    console.log(colors.yellow('\nTest 3: Analyze this test file'));
    const selfAnalysis = await analyzer.analyzeFile('test-file-analyzer.js');
    console.log(selfAnalysis);

    console.log(colors.yellow('\nTest 4: Try to analyze non-existent file'));
    const nonExistent = await analyzer.analyzeFile('non-existent.txt');
    console.log(nonExistent);

    console.log(colors.yellow('\nTest 5: Test file path detection'));
    const testPaths = ['package.json', './src/index.ts', '../README.md', 'test-file.py', 'normaltext'];
    testPaths.forEach(testPath => {
        const isFile = MockFileAnalyzer.isFilePath(testPath);
        const status = isFile ? colors.green('✓') : colors.red('✗');
        console.log(`${status} "${testPath}" -> ${isFile ? 'File path' : 'Not a file path'}`);
    });

    console.log(colors.green('\n✅ File analyzer tests completed!'));
}

runTests().catch(console.error);