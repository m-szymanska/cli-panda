import { LMStudioService } from '../core/lmstudio';
import chalk from 'chalk';

export interface InlineAIContext {
  currentCommand: string;
  workingDirectory: string;
  recentHistory: string[];
  shellType: string;
}

export class InlineAI {
  private lmStudio: LMStudioService;
  private triggerPattern = /\?\?\s*(.*)$/;
  
  constructor(lmStudio: LMStudioService) {
    this.lmStudio = lmStudio;
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
}