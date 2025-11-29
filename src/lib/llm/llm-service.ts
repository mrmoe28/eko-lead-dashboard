/**
 * LLM Service
 * Abstraction layer for local and external LLM providers
 * Supports OpenAI-compatible APIs
 */

import axios, { AxiosInstance } from 'axios';

export interface LLMConfig {
  provider: 'local' | 'openai' | 'anthropic';
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  id: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMUsageMetrics {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // $0 for local LLM
  timestamp: Date;
}

/**
 * LLM Service Class
 */
export class LLMService {
  private config: LLMConfig;
  private client: AxiosInstance;
  private usageMetrics: LLMUsageMetrics[] = [];

  constructor(config: LLMConfig) {
    this.config = {
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Chat completion with messages
   */
  async chat(messages: ChatMessage[], options?: Partial<LLMConfig>): Promise<string> {
    try {
      const response = await this.client.post<ChatCompletion>('/chat/completions', {
        model: options?.model || this.config.model,
        messages,
        max_tokens: options?.maxTokens || this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
      });

      const completion = response.data;
      const message = completion.choices[0]?.message?.content || '';

      // Track usage metrics
      if (completion.usage) {
        this.recordUsage({
          provider: this.config.provider,
          model: this.config.model,
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          cost: this.config.provider === 'local' ? 0 : this.calculateCost(completion.usage),
          timestamp: new Date(),
        });
      }

      return message.trim();
    } catch (error: any) {
      console.error('[LLMService] Chat completion failed:', error.message);
      throw new Error(`LLM request failed: ${error.message}`);
    }
  }

  /**
   * Simple prompt completion
   */
  async complete(prompt: string, options?: Partial<LLMConfig>): Promise<string> {
    return this.chat([
      { role: 'user', content: prompt }
    ], options);
  }

  /**
   * Structured data extraction
   */
  async extractJSON<T = any>(
    prompt: string,
    schema: string,
    options?: Partial<LLMConfig>
  ): Promise<T> {
    const systemPrompt = `You are a data extraction assistant. Extract structured data according to the schema provided. Return ONLY valid JSON, no markdown, no explanations.

Schema:
${schema}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], options);

    // Clean response (remove markdown code blocks if present)
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (error) {
      console.error('[LLMService] Failed to parse JSON:', cleaned);
      throw new Error('Failed to extract structured data from LLM response');
    }
  }

  /**
   * Calculate cost for external LLM usage
   * (Local LLM cost is always $0)
   */
  private calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
    if (this.config.provider === 'local') return 0;

    // OpenAI GPT-4 pricing (example - adjust based on actual model)
    const COST_PER_1K_PROMPT = 0.03;
    const COST_PER_1K_COMPLETION = 0.06;

    const promptCost = (usage.prompt_tokens / 1000) * COST_PER_1K_PROMPT;
    const completionCost = (usage.completion_tokens / 1000) * COST_PER_1K_COMPLETION;

    return promptCost + completionCost;
  }

  /**
   * Record usage metrics
   */
  private recordUsage(metrics: LLMUsageMetrics): void {
    this.usageMetrics.push(metrics);

    // Log for monitoring
    console.log(
      `[LLMService] ${metrics.provider}/${metrics.model}: ${metrics.totalTokens} tokens, $${metrics.cost.toFixed(4)}`
    );
  }

  /**
   * Get usage metrics
   */
  getUsageMetrics(): LLMUsageMetrics[] {
    return [...this.usageMetrics];
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.usageMetrics.reduce((sum, m) => sum + m.cost, 0);
  }

  /**
   * Get total tokens used
   */
  getTotalTokens(): number {
    return this.usageMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.usageMetrics = [];
  }
}

/**
 * Default LLM instance (uses env config)
 */
let defaultLLMInstance: LLMService | null = null;

export function getLLM(): LLMService {
  if (!defaultLLMInstance) {
    const config: LLMConfig = {
      provider: (process.env.LLM_PROVIDER || 'local') as 'local' | 'openai' | 'anthropic',
      baseURL: process.env.LLM_BASE_URL || 'http://localhost:3001/v1',
      apiKey: process.env.LLM_API_KEY || 'local-key',
      model: process.env.LLM_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    };

    // Use mock LLM if enabled
    if (process.env.LLM_USE_MOCK === 'true') {
      const { createMockLLM } = require('./mock-llm-service');
      defaultLLMInstance = createMockLLM(config);
      console.log('[LLM] Using Mock LLM (LM Studio not required)');
    } else {
      defaultLLMInstance = new LLMService(config);
    }
  }

  return defaultLLMInstance;
}

/**
 * Create custom LLM instance
 */
export function createLLM(config: LLMConfig): LLMService {
  return new LLMService(config);
}
