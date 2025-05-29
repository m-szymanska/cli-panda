#!/usr/bin/env node

import { Command } from 'commander';
import { LMAdapter } from './core/lm-adapter';
import { InlineAI } from './features/inline-ai';
import { SmartAutocomplete } from './features/autocomplete';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

const CONFIG_PATH = path.join(os.homedir(), '.config', 'cli-panda', 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {
      mode: 'sdk',
      model: 'qwen3-8b',
      temperature: 0.7,
      maxTokens: 200,
    };
  }
}

const program = new Command();
const config = loadConfig();

program
  .name('cli-panda')
  .description('AI-powered terminal assistant')
  .version('0.1.0');

// Main interactive mode
program
  .command('interactive', { isDefault: true })
  .alias('i')
  .description('Start interactive AI terminal')
  .action(async () => {
    const { AITerminal } = await import('./index');
    const terminal = new AITerminal();
    terminal.start();
  });

// Inline AI query
program
  .command('inline <query...>')
  .description('Quick AI query')
  .action(async (query: string[]) => {
    const lmAdapter = new LMAdapter(config);
    const inlineAI = new InlineAI(lmAdapter as any);
    
    try {
      await lmAdapter.connect();
      const response = await inlineAI.processInlineQuery(
        `?? ${query.join(' ')}`,
        {
          currentCommand: '',
          workingDirectory: process.cwd(),
          recentHistory: [],
          shellType: process.env.SHELL || 'bash',
        }
      );
      console.log(response);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    } finally {
      lmAdapter.disconnect();
    }
  });

// Explain command
program
  .command('explain-command <command...>')
  .alias('explain')
  .description('Explain what a command does')
  .action(async (command: string[]) => {
    const lmAdapter = new LMAdapter(config);
    
    try {
      await lmAdapter.connect();
      const response = await lmAdapter.chatCompletion([
        {
          role: 'system',
          content: 'You are a helpful terminal assistant. Explain commands clearly and concisely.',
        },
        {
          role: 'user',
          content: `Explain this command: ${command.join(' ')}`,
        },
      ]);
      console.log(chalk.cyan('Explanation:'), response);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    } finally {
      lmAdapter.disconnect();
    }
  });

// Model management
const models = program.command('models');

models
  .command('list')
  .description('List available models')
  .action(async () => {
    const lmAdapter = new LMAdapter(config);
    
    try {
      await lmAdapter.connect();
      const modelList = await lmAdapter.listModels();
      
      console.log(chalk.cyan('Available models:'));
      modelList.forEach(model => {
        console.log(`  ${model.loaded ? chalk.green('●') : chalk.gray('○')} ${model.id}`);
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    } finally {
      lmAdapter.disconnect();
    }
  });

// Config management
program
  .command('config')
  .description('Show current configuration')
  .option('-e, --edit', 'Edit configuration')
  .action(async (options) => {
    if (options.edit) {
      const editor = process.env.EDITOR || 'nano';
      const { execSync } = await import('child_process');
      execSync(`${editor} ${CONFIG_PATH}`, { stdio: 'inherit' });
    } else {
      console.log(chalk.cyan('Current configuration:'));
      console.log(JSON.stringify(config, null, 2));
    }
  });

// Parse arguments
program.parse(process.argv);