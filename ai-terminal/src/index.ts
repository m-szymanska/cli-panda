#!/usr/bin/env node

import blessed from 'blessed';
import { LMStudioService } from './core/lmstudio';
import { InlineAI } from './features/inline-ai';
import { SmartAutocomplete } from './features/autocomplete';
import * as pty from 'node-pty';
import chalk from 'chalk';
import figlet from 'figlet';
import { platform } from 'os';

class AITerminal {
  private screen: blessed.Widgets.Screen;
  private terminal: blessed.Widgets.TerminalElement;
  private statusBar: blessed.Widgets.BoxElement;
  private ptyProcess: pty.IPty;
  private lmStudio: LMStudioService;
  private inlineAI: InlineAI;
  private autocomplete: SmartAutocomplete;
  private currentInput: string = '';
  private commandHistory: string[] = [];

  constructor() {
    this.initializeScreen();
    this.initializeServices();
  }

  private initializeScreen(): void {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'AI Terminal',
      fullUnicode: true,
    });

    // Main terminal window
    this.terminal = blessed.terminal({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%-1',
      border: 'line',
      scrollable: true,
      mouse: true,
      keys: true,
      style: {
        border: { fg: 'cyan' },
        focus: { border: { fg: 'green' } },
      },
    });

    // Status bar
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' AI Terminal | ?? for help | Connected to LM Studio',
      style: {
        bg: 'blue',
        fg: 'white',
      },
    });

    // Initialize PTY
    const shell = platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
    this.ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: this.terminal.width as number - 2,
      rows: this.terminal.height as number - 2,
      cwd: process.cwd(),
      env: process.env,
    });

    // Connect PTY to terminal
    this.ptyProcess.onData((data) => {
      this.terminal.write(data);
    });

    this.terminal.on('data', (data) => {
      this.handleInput(data);
    });

    // Handle resize
    this.screen.on('resize', () => {
      this.ptyProcess.resize(
        this.terminal.width as number - 2,
        this.terminal.height as number - 2
      );
    });

    // Quit handlers
    this.screen.key(['C-c', 'q'], () => {
      this.cleanup();
      process.exit(0);
    });

    this.terminal.focus();
    this.screen.render();
  }

  private async initializeServices(): Promise<void> {
    // Show splash screen
    this.showSplash();

    this.lmStudio = new LMStudioService();
    
    try {
      await this.lmStudio.connect();
      this.inlineAI = new InlineAI(this.lmStudio);
      this.autocomplete = new SmartAutocomplete(this.lmStudio);
      
      this.updateStatus(' AI Terminal | ?? for help | ✓ Connected to LM Studio');
      
      this.lmStudio.on('error', (error) => {
        this.updateStatus(` AI Terminal | ?? for help | ✗ Error: ${error.message}`);
      });
    } catch (error) {
      this.updateStatus(' AI Terminal | ?? for help | ✗ Failed to connect to LM Studio');
      console.error('Failed to connect to LM Studio:', error);
    }
  }

  private showSplash(): void {
    const splash = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '60%',
      border: 'line',
      style: {
        border: { fg: 'cyan' },
        bg: 'black',
      },
    });

    const logo = figlet.textSync('AI Terminal', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });

    splash.setContent(
      chalk.cyan(logo) + '\n\n' +
      chalk.white('Connecting to LM Studio...\n\n') +
      chalk.gray('Press ?? at any time for AI assistance')
    );

    this.screen.render();

    setTimeout(() => {
      splash.destroy();
      this.screen.render();
    }, 2000);
  }

  private async handleInput(data: string): Promise<void> {
    this.currentInput += data;

    // Check for inline AI trigger
    if (this.inlineAI && this.inlineAI.isInlineQuery(this.currentInput)) {
      const context = {
        currentCommand: this.currentInput,
        workingDirectory: process.cwd(),
        recentHistory: this.commandHistory.slice(-10),
        shellType: process.env.SHELL || 'bash',
      };

      // Clear the ?? from terminal
      this.ptyProcess.write('\x1b[2K\r');
      
      // Get AI response
      await this.inlineAI.getStreamingResponse(
        this.currentInput,
        context,
        (token) => this.terminal.write(token)
      );

      this.currentInput = '';
      return;
    }

    // Pass through to PTY
    this.ptyProcess.write(data);

    // Track command history
    if (data === '\r' || data === '\n') {
      if (this.currentInput.trim()) {
        this.commandHistory.push(this.currentInput.trim());
      }
      this.currentInput = '';
    }
  }

  private updateStatus(content: string): void {
    this.statusBar.setContent(content);
    this.screen.render();
  }

  private cleanup(): void {
    this.ptyProcess.kill();
    this.lmStudio?.disconnect();
  }

  start(): void {
    console.log('Starting AI Terminal...');
  }
}

// Start the application
const terminal = new AITerminal();
terminal.start();

// Handle process termination
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));