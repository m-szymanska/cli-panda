import { LMStudioService } from '../core/lmstudio';
import Fuse from 'fuse.js';
import { execSync } from 'child_process';

export interface AutocompleteContext {
  currentInput: string;
  cursorPosition: number;
  workingDirectory: string;
  availableCommands: string[];
}

export interface Suggestion {
  text: string;
  description?: string;
  score: number;
  isAiGenerated?: boolean;
}

export class SmartAutocomplete {
  private lmStudio: LMStudioService;
  private commandCache: Map<string, string[]> = new Map();
  private fuse: Fuse<{ cmd: string }>;
  
  constructor(lmStudio: LMStudioService) {
    this.lmStudio = lmStudio;
    this.initializeCommandList();
  }

  private initializeCommandList(): void {
    try {
      // Get all available commands
      const commands = execSync('compgen -c', { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);
      
      this.fuse = new Fuse(
        commands.map(cmd => ({ cmd })),
        {
          keys: ['cmd'],
          threshold: 0.3,
        }
      );
    } catch (error) {
      // Fallback for non-bash shells
      this.fuse = new Fuse([], { keys: ['cmd'] });
    }
  }

  async getSuggestions(context: AutocompleteContext): Promise<Suggestion[]> {
    const { currentInput, cursorPosition } = context;
    
    // Extract the current word being typed
    const beforeCursor = currentInput.slice(0, cursorPosition);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    
    const suggestions: Suggestion[] = [];
    
    // 1. Fuzzy search for commands
    if (words.length === 1 && currentWord.length > 0) {
      const fuzzyResults = this.fuse.search(currentWord).slice(0, 5);
      suggestions.push(...fuzzyResults.map(result => ({
        text: result.item.cmd,
        score: 1 - result.score!,
        description: 'Command',
      })));
    }
    
    // 2. File/directory completion
    if (currentWord.includes('/') || currentWord.startsWith('.')) {
      const fileSuggestions = await this.getFileSuggestions(currentWord, context.workingDirectory);
      suggestions.push(...fileSuggestions);
    }
    
    // 3. AI-powered suggestions for complex scenarios
    if (suggestions.length < 3 && currentInput.length > 5) {
      const aiSuggestions = await this.getAISuggestions(context);
      suggestions.push(...aiSuggestions);
    }
    
    // Sort by score and deduplicate
    return this.deduplicateAndSort(suggestions);
  }

  private async getFileSuggestions(
    partial: string,
    workingDir: string
  ): Promise<Suggestion[]> {
    try {
      const basePath = partial.substring(0, partial.lastIndexOf('/') + 1);
      const searchTerm = partial.substring(partial.lastIndexOf('/') + 1);
      
      const files = execSync(
        `cd "${workingDir}" && ls -1a "${basePath}" 2>/dev/null | grep "^${searchTerm}"`,
        { encoding: 'utf-8' }
      ).split('\n').filter(Boolean);
      
      return files.map(file => ({
        text: basePath + file,
        description: 'File/Directory',
        score: 0.9,
      }));
    } catch {
      return [];
    }
  }

  private async getAISuggestions(context: AutocompleteContext): Promise<Suggestion[]> {
    try {
      const prompt = `Given the partial command: "${context.currentInput}"
Working directory: ${context.workingDirectory}

Suggest 3 likely command completions. Return only the commands, one per line.`;
      
      const response = await this.lmStudio.getCompletion(prompt);
      const suggestions = response.split('\n')
        .filter(Boolean)
        .slice(0, 3)
        .map((text, index) => ({
          text: text.trim(),
          description: 'AI suggestion',
          score: 0.8 - index * 0.1,
          isAiGenerated: true,
        }));
      
      return suggestions;
    } catch {
      return [];
    }
  }

  private deduplicateAndSort(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    return suggestions
      .filter(s => {
        if (seen.has(s.text)) return false;
        seen.add(s.text);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}