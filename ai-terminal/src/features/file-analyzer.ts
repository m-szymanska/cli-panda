import * as fs from 'fs/promises';
import * as path from 'path';
import { LMStudioService } from '../core/lmstudio';
import chalk from 'chalk';

export interface FileAnalysisContext {
  workingDirectory: string;
  maxFileSize: number;
  supportedExtensions: string[];
}

export class FileAnalyzer {
  private lmStudio: LMStudioService;
  private context: FileAnalysisContext;

  constructor(lmStudio: LMStudioService, context?: Partial<FileAnalysisContext>) {
    this.lmStudio = lmStudio;
    this.context = {
      workingDirectory: process.cwd(),
      maxFileSize: 100 * 1024, // 100KB max
      supportedExtensions: [
        '.js', '.ts', '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h',
        '.json', '.yaml', '.yml', '.toml', '.md', '.txt', '.sh', '.zsh',
        '.css', '.html', '.xml', '.svg', '.dockerfile', '.gitignore',
        '.env', '.conf', '.config', '.ini', '.sql'
      ],
      ...context
    };
  }

  async analyzeFile(filePath: string, query?: string): Promise<string> {
    try {
      // Resolve absolute path
      const absolutePath = path.resolve(this.context.workingDirectory, filePath);
      
      // Check if file exists
      const stats = await fs.stat(absolutePath);
      
      if (!stats.isFile()) {
        return chalk.red(`❌ ${filePath} is not a file`);
      }

      // Check file size
      if (stats.size > this.context.maxFileSize) {
        return chalk.yellow(`⚠️ File ${filePath} is too large (${Math.round(stats.size / 1024)}KB > ${Math.round(this.context.maxFileSize / 1024)}KB)`);
      }

      // Check if extension is supported
      const ext = path.extname(filePath).toLowerCase();
      if (!this.context.supportedExtensions.includes(ext)) {
        return chalk.yellow(`⚠️ File type ${ext} is not supported for analysis`);
      }

      // Read file content
      const content = await fs.readFile(absolutePath, 'utf-8');
      
      // Generate analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(filePath, content, query);
      
      // Get AI analysis
      const analysis = await this.lmStudio.getCompletion(analysisPrompt);
      
      return this.formatAnalysis(filePath, analysis);
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return chalk.red(`❌ File not found: ${filePath}`);
      } else if (error.code === 'EACCES') {
        return chalk.red(`❌ Permission denied: ${filePath}`);
      } else {
        return chalk.red(`❌ Error reading file: ${error.message}`);
      }
    }
  }

  async listFiles(directory?: string): Promise<string> {
    try {
      const targetDir = directory ? path.resolve(this.context.workingDirectory, directory) : this.context.workingDirectory;
      const files = await fs.readdir(targetDir, { withFileTypes: true });
      
      const fileList = files
        .filter(file => file.isFile())
        .map(file => {
          const ext = path.extname(file.name).toLowerCase();
          const isSupported = this.context.supportedExtensions.includes(ext);
          const icon = this.getFileIcon(ext);
          const status = isSupported ? chalk.green('✓') : chalk.gray('○');
          return `${status} ${icon} ${file.name}`;
        })
        .join('\n');

      return `📂 Files in ${path.basename(targetDir)}:\n${fileList}`;
      
    } catch (error) {
      return chalk.red(`❌ Error listing files: ${error.message}`);
    }
  }

  async suggestFiles(intent: string): Promise<string> {
    try {
      const files = await fs.readdir(this.context.workingDirectory, { withFileTypes: true });
      const relevantFiles = files
        .filter(file => file.isFile())
        .map(file => file.name)
        .filter(name => {
          const ext = path.extname(name).toLowerCase();
          return this.context.supportedExtensions.includes(ext);
        });

      if (relevantFiles.length === 0) {
        return chalk.yellow('⚠️ No analyzable files found in current directory');
      }

      const suggestionPrompt = `
Based on the user's intent: "${intent}"
Available files: ${relevantFiles.join(', ')}

Suggest the 3 most relevant files for analysis. Respond in this format:
1. filename.ext - Brief reason why it's relevant
2. filename.ext - Brief reason why it's relevant  
3. filename.ext - Brief reason why it's relevant

Keep explanations concise and focus on why each file would help with the user's intent.`;

      const suggestions = await this.lmStudio.getCompletion(suggestionPrompt);
      
      return `💡 Suggested files for "${intent}":\n${suggestions}`;
      
    } catch (error) {
      return chalk.red(`❌ Error suggesting files: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(filePath: string, content: string, query?: string): string {
    const basePrompt = `
Analyze this file: ${filePath}

File content:
\`\`\`
${content}
\`\`\`

Please provide a concise analysis covering:
1. File type and purpose
2. Key components/functions/structures
3. Notable patterns or issues
4. Dependencies or imports`;

    if (query) {
      return `${basePrompt}

User's specific question: "${query}"

Focus your analysis on answering this question while providing relevant context.`;
    }

    return basePrompt;
  }

  private formatAnalysis(filePath: string, analysis: string): string {
    return `\n📄 Analysis of ${chalk.cyan(filePath)}:\n\n${analysis}\n`;
  }

  private getFileIcon(extension: string): string {
    const icons: Record<string, string> = {
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

  // Check if a string looks like a file path
  static isFilePath(input: string): boolean {
    // Simple heuristics for file path detection
    return /^[./]/.test(input) || 
           /\.[a-zA-Z0-9]+$/.test(input) ||
           input.includes('/') ||
           input.includes('\\');
  }
}