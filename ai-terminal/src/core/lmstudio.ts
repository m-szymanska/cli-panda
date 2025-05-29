import { LMStudioClient } from '@lmstudio/sdk';
import type { Model, ChatMessage } from '@lmstudio/sdk';
import { EventEmitter } from 'events';

export interface LMStudioConfig {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LMStudioService extends EventEmitter {
  private client: LMStudioClient;
  private model: Model | null = null;
  private config: LMStudioConfig;

  constructor(config: LMStudioConfig = {}) {
    super();
    // Load from config file if exists
    let defaultConfig = {
      baseUrl: 'ws://localhost:1234',
      model: 'qwen3-8b',
      temperature: 0.7,
      maxTokens: 200,
    };
    
    try {
      const configPath = new URL('../../config/default.json', import.meta.url);
      const configFile = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
      defaultConfig = { ...defaultConfig, ...configFile.lmstudio };
    } catch {
      // Use defaults if config file not found
    }
    
    this.config = {
      baseUrl: config.baseUrl || defaultConfig.baseUrl,
      model: config.model || defaultConfig.model,
      temperature: config.temperature || defaultConfig.temperature,
      maxTokens: config.maxTokens || defaultConfig.maxTokens,
    };
    
    this.client = new LMStudioClient({
      baseUrl: this.config.baseUrl,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      const models = await this.client.model.list();
      
      // Find preferred model or use first available
      const preferredModel = models.find(m => m.id.includes(this.config.model!));
      this.model = preferredModel || models[0];
      
      if (!this.model) {
        throw new Error('No models available in LM Studio');
      }
      
      this.emit('connected', this.model.id);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getCompletion(prompt: string, context?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Not connected to LM Studio');
    }

    const messages: ChatMessage[] = [];
    
    if (context) {
      messages.push({
        role: 'system',
        content: `You are an intelligent terminal assistant. Help with command line tasks. Context: ${context}`,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });

    try {
      const response = await this.model.chat(messages, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      return response.content;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getStreamingCompletion(
    prompt: string,
    onToken: (token: string) => void,
    context?: string
  ): Promise<void> {
    if (!this.model) {
      throw new Error('Not connected to LM Studio');
    }

    const messages: ChatMessage[] = [];
    
    if (context) {
      messages.push({
        role: 'system',
        content: `You are an intelligent terminal assistant. Context: ${context}`,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });

    const stream = this.model.chatStream(messages, {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    for await (const chunk of stream) {
      onToken(chunk.content);
    }
  }

  disconnect(): void {
    this.client.disconnect();
    this.emit('disconnected');
  }
}