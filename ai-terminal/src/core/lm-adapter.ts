import { EventEmitter } from 'events';
import { LMStudioClient } from '@lmstudio/sdk';
import type { Model as SDKModel, ChatMessage as SDKMessage } from '@lmstudio/sdk';

export interface LMConfig {
  mode: 'sdk' | 'rest';
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Model {
  id: string;
  name: string;
  loaded: boolean;
}

// Base interface for LM providers
export interface LMProvider {
  connect(): Promise<void>;
  disconnect(): void;
  listModels(): Promise<Model[]>;
  chatCompletion(messages: ChatMessage[]): Promise<string>;
  chatCompletionStream(messages: ChatMessage[], onToken: (token: string) => void): Promise<void>;
}

// SDK Implementation
class SDKProvider extends EventEmitter implements LMProvider {
  private client: LMStudioClient;
  private model: SDKModel | null = null;
  private config: LMConfig;

  constructor(config: LMConfig) {
    super();
    this.config = config;
    this.client = new LMStudioClient({
      baseUrl: config.baseUrl || 'ws://localhost:1234',
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    const models = await this.client.model.list();
    
    const preferredModel = models.find(m => m.id.includes(this.config.model || 'qwen3-8b'));
    this.model = preferredModel || models[0];
    
    if (!this.model) {
      throw new Error('No models available in LM Studio');
    }
    
    this.emit('connected', this.model.id);
  }

  disconnect(): void {
    this.client.disconnect();
  }

  async listModels(): Promise<Model[]> {
    const models = await this.client.model.list();
    return models.map(m => ({
      id: m.id,
      name: m.id,
      loaded: true,
    }));
  }

  async chatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.model) throw new Error('Not connected');
    
    const response = await this.model.chat(messages as SDKMessage[], {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
    
    return response.content;
  }

  async chatCompletionStream(
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): Promise<void> {
    if (!this.model) throw new Error('Not connected');
    
    const stream = this.model.chatStream(messages as SDKMessage[], {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
    
    for await (const chunk of stream) {
      onToken(chunk.content);
    }
  }
}

// REST Implementation
class RESTProvider extends EventEmitter implements LMProvider {
  private baseUrl: string;
  private config: LMConfig;

  constructor(config: LMConfig) {
    super();
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:1234';
  }

  async connect(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/models`);
    if (!response.ok) throw new Error('Failed to connect to LM Studio');
    this.emit('connected', 'REST API');
  }

  disconnect(): void {
    // No persistent connection for REST
  }

  async listModels(): Promise<Model[]> {
    const response = await fetch(`${this.baseUrl}/v1/models`);
    const data = await response.json();
    
    return data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
      loaded: true,
    }));
  }

  async chatCompletion(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'qwen3-8b',
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async chatCompletionStream(
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'qwen3-8b',
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });
    
    if (!response.body) throw new Error('No response body');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content;
            if (content) onToken(content);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

// Adapter factory
export class LMAdapter extends EventEmitter {
  private provider: LMProvider;
  
  constructor(config: LMConfig) {
    super();
    
    if (config.mode === 'sdk') {
      this.provider = new SDKProvider(config);
    } else {
      this.provider = new RESTProvider(config);
    }
    
    // Forward events
    (this.provider as EventEmitter).on('connected', (info) => this.emit('connected', info));
    (this.provider as EventEmitter).on('error', (error) => this.emit('error', error));
  }
  
  async connect(): Promise<void> {
    return this.provider.connect();
  }
  
  disconnect(): void {
    return this.provider.disconnect();
  }
  
  async listModels(): Promise<Model[]> {
    return this.provider.listModels();
  }
  
  async chatCompletion(messages: ChatMessage[]): Promise<string> {
    return this.provider.chatCompletion(messages);
  }
  
  async chatCompletionStream(
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): Promise<void> {
    return this.provider.chatCompletionStream(messages, onToken);
  }
}