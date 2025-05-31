import { LMStudioService } from '../core/lmstudio';
import { FileAnalyzer } from './file-analyzer';
import { GitAssistant } from './git-assistant';
import chalk from 'chalk';

export interface InlineAIContext {
  currentCommand: string;
  workingDirectory: string;
  recentHistory: string[];
  shellType: string;
}

export class InlineAI {
  private lmStudio: LMStudioService;
  private fileAnalyzer: FileAnalyzer;
  private gitAssistant: GitAssistant;
  private triggerPattern = /\?\?\s*(.*)$/;
  
  constructor(lmStudio: LMStudioService) {
    this.lmStudio = lmStudio;
    this.fileAnalyzer = new FileAnalyzer(lmStudio);
    this.gitAssistant = new GitAssistant(lmStudio);
  }

  isInlineQuery(input: string): boolean {
    return this.triggerPattern.test(input);
  }

  extractQuery(input: string): string | null {
    const match = input.match(this.triggerPattern);
    return match ? match[1].trim() : null;
  }

  async processInlineQuery(
    input: string,
    context: InlineAIContext
  ): Promise<string> {
    const query = this.extractQuery(input);
    if (!query) return '';

    // Check for special commands (file analysis, git operations)
    if (await this.handleSpecialCommands(query, context)) {
      return '';
    }

    const contextPrompt = this.buildContextPrompt(query, context);
    
    try {
      const response = await this.lmStudio.getCompletion(contextPrompt);
      return this.formatResponse(response);
    } catch (error) {
      return chalk.red(`AI Error: ${error.message}`);
    }
  }

  private buildContextPrompt(query: string, context: InlineAIContext): string {
    return `Terminal AI Assistant Request:

User query: "${query}"
Current command: ${context.currentCommand}
Working directory: ${context.workingDirectory}
Shell type: ${context.shellType}
Recent commands: ${context.recentHistory.slice(-5).join(', ')}

Provide a concise, helpful response. If suggesting commands, format them clearly.
Focus on the specific question asked.`;
  }

  private formatResponse(response: string): string {
    const lines = response.split('\n');
    const formatted = lines.map(line => {
      // Highlight commands in backticks
      return line.replace(/`([^`]+)`/g, (_, cmd) => chalk.cyan(cmd));
    }).join('\n');
    
    return `\n${chalk.green('AI:')} ${formatted}\n`;
  }

  async getStreamingResponse(
    input: string,
    context: InlineAIContext,
    onToken: (token: string) => void
  ): Promise<void> {
    const query = this.extractQuery(input);
    if (!query) return;

    const contextPrompt = this.buildContextPrompt(query, context);
    
    // Start with AI prefix
    onToken('\n' + chalk.green('AI: '));
    
    await this.lmStudio.getStreamingCompletion(
      contextPrompt,
      (token) => {
        // Apply formatting to tokens in real-time
        const formatted = token.replace(/`([^`]+)`/g, (_, cmd) => chalk.cyan(cmd));
        onToken(formatted);
      }
    );
    
    onToken('\n');
  }

  private async handleSpecialCommands(query: string, context: InlineAIContext): Promise<boolean> {
    const lowerQuery = query.toLowerCase();
    
    // File analysis patterns
    if (lowerQuery.startsWith('analyze ') || lowerQuery.startsWith('read ')) {
      const filePath = query.split(' ').slice(1).join(' ');
      if (filePath) {
        const result = await this.fileAnalyzer.analyzeFile(filePath);
        console.log(result);
        return true;
      }
    }
    
    // List files
    if (lowerQuery === 'list files' || lowerQuery === 'ls files' || lowerQuery === 'files') {
      const result = await this.fileAnalyzer.listFiles();
      console.log(result);
      return true;
    }
    
    // Suggest files based on intent
    if (lowerQuery.startsWith('suggest files for ') || lowerQuery.startsWith('files for ')) {
      const intent = query.replace(/^(suggest files for |files for )/i, '');
      if (intent) {
        const result = await this.fileAnalyzer.suggestFiles(intent);
        console.log(result);
        return true;
      }
    }
    
    // Git operations
    if (lowerQuery === 'git status' || lowerQuery === 'git' || lowerQuery.startsWith('git ')) {
      const result = await this.gitAssistant.analyzeChanges();
      console.log(result);
      return true;
    }

    if (lowerQuery === 'git recommendations' || lowerQuery === 'git help' || lowerQuery === 'git what should i do') {
      const result = await this.gitAssistant.getRecommendations();
      console.log(result);
      return true;
    }

    if (lowerQuery === 'generate commit message' || lowerQuery === 'commit message' || lowerQuery === 'git commit message') {
      const result = await this.gitAssistant.generateCommitMessage();
      console.log(result);
      return true;
    }

    // Auto-detect file paths in query
    const words = query.split(' ');
    const possibleFile = words.find(word => FileAnalyzer.isFilePath(word));
    if (possibleFile) {
      const result = await this.fileAnalyzer.analyzeFile(possibleFile, query);
      console.log(result);
      return true;
    }
    
    return false;
  }
}