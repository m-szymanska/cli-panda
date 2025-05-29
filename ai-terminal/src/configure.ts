#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupOptions {
  model?: string;
  port?: number;
}

class AITerminalSetup {
  private configPath = path.join(__dirname, '../config/default.json');
  
  async checkLMStudio(): Promise<boolean> {
    try {
      // Check if LM Studio is running
      const response = await fetch('http://localhost:1234/v1/models');
      return response.ok;
    } catch {
      return false;
    }
  }

  async downloadModel(modelName: string = 'qwen3-8b'): Promise<void> {
    console.log(chalk.cyan(`\n📥 Setting up ${modelName} model...\n`));
    
    console.log(chalk.yellow('Steps to complete setup:\n'));
    console.log('1. Open LM Studio');
    console.log('2. Go to the "Discover" tab');
    console.log(`3. Search for "${modelName}"`);
    console.log('4. Download the Q4_K_M or Q5_K_M version (recommended)');
    console.log('5. Once downloaded, load the model');
    console.log('6. Keep LM Studio running\n');
    
    console.log(chalk.gray('LM Studio download link: https://lmstudio.ai\n'));
  }

  async updateConfig(options: SetupOptions): Promise<void> {
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    
    if (options.model) {
      config.lmstudio.model = options.model;
    }
    
    if (options.port) {
      config.lmstudio.baseUrl = `ws://localhost:${options.port}`;
    }
    
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✅ Configuration updated'));
  }

  async setup(): Promise<void> {
    console.log(chalk.cyan(figlet.textSync('AI Terminal Setup')));
    console.log(chalk.gray('\nConfiguring AI Terminal for first use...\n'));
    
    // Check if LM Studio is running
    const isRunning = await this.checkLMStudio();
    
    if (!isRunning) {
      console.log(chalk.red('❌ LM Studio is not running\n'));
      await this.downloadModel();
      
      console.log(chalk.yellow('Press any key once LM Studio is running with qwen3-8b loaded...'));
      process.stdin.setRawMode(true);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
      process.stdin.setRawMode(false);
    } else {
      console.log(chalk.green('✅ LM Studio detected'));
      
      // Check available models
      try {
        const response = await fetch('http://localhost:1234/v1/models');
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          console.log(chalk.green('\n✅ Available models:'));
          data.data.forEach((model: any) => {
            console.log(`   - ${model.id}`);
          });
          
          const hasQwen = data.data.some((m: any) => m.id.toLowerCase().includes('qwen'));
          if (!hasQwen) {
            console.log(chalk.yellow('\n⚠️  qwen3-8b not found. Please download it in LM Studio.'));
            await this.downloadModel();
          }
        }
      } catch (error) {
        console.error(chalk.red('Failed to fetch models'), error);
      }
    }
    
    console.log(chalk.green('\n✅ Setup complete! Run `npm start` to launch AI Terminal\n'));
  }
}

// Import figlet dynamically
import('figlet').then((figletModule) => {
  global.figlet = figletModule.default;
  
  const setup = new AITerminalSetup();
  setup.setup().catch(console.error);
});
