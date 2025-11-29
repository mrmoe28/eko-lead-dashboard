/**
 * Mock LLM Service
 * Provides realistic mock responses for testing without requiring LM Studio
 */

import type { LLMConfig, ChatMessage } from './llm-service';
import { LLMService } from './llm-service';

/**
 * Mock LLM that generates realistic responses without calling external APIs
 */
export class MockLLMService extends LLMService {
  constructor(config: LLMConfig) {
    super(config);
  }

  /**
   * Override chat to return mock responses
   */
  async chat(messages: ChatMessage[], options?: Partial<LLMConfig>): Promise<string> {
    // Simulate network delay
    await this.sleep(500 + Math.random() * 1000);

    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    // Generate contextual mock response based on the prompt
    let response = '';

    // Lead analysis detection
    if (content.includes('analyze') && content.includes('lead')) {
      response = this.generateLeadAnalysis(content);
    }
    // Lead enrichment detection
    else if (content.includes('extract') && (content.includes('information') || content.includes('structured'))) {
      response = this.generateLeadEnrichment(content);
    }
    // Response generation detection
    else if (content.includes('generate') && content.includes('response')) {
      response = this.generateLeadResponse(content);
    }
    // Source classification
    else if (content.includes('analyze') && content.includes('source')) {
      response = this.generateSourceAnalysis(content);
    }
    // Generic response
    else {
      response = this.generateGenericResponse(content);
    }

    // Record mock metrics (zero cost)
    this.recordUsage({
      provider: 'mock',
      model: 'mock-model',
      promptTokens: this.estimateTokens(lastMessage.content),
      completionTokens: this.estimateTokens(response),
      totalTokens: this.estimateTokens(lastMessage.content) + this.estimateTokens(response),
      cost: 0,
      timestamp: new Date(),
    });

    return response;
  }

  /**
   * Generate mock lead analysis response
   */
  private generateLeadAnalysis(content: string): string {
    const scores = [85, 92, 78, 88, 95, 82, 90, 87];
    const score = scores[Math.floor(Math.random() * scores.length)];

    const priorities = ['urgent', 'high', 'high', 'medium'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const sentiments = ['hot', 'hot', 'warm', 'warm'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    const urgencies = ['immediate', 'soon', 'flexible'];
    const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];

    return JSON.stringify({
      score,
      priority,
      intent: "Residential solar installation with 8-10kW system capacity",
      sentiment,
      urgency,
      budget: "medium",
      readiness: "ready",
      reasoning: "High-quality lead with clear intent and specific requirements. Shows urgency and budget awareness. Strong conversion potential based on detailed request and contact information provided.",
      actionRequired: "Schedule site assessment within 48 hours. Prepare detailed quote with financing options. Contact via phone for faster response.",
      estimatedRevenue: {
        min: 15000,
        max: 30000
      }
    }, null, 2);
  }

  /**
   * Generate mock lead enrichment response
   */
  private generateLeadEnrichment(content: string): string {
    const systemSizes = ['8kW', '10kW', '12kW', '6kW'];
    const roofTypes = ['asphalt shingle', 'metal', 'tile', 'composite'];

    return JSON.stringify({
      name: null,
      phone: null,
      email: null,
      address: null,
      systemSize: systemSizes[Math.floor(Math.random() * systemSizes.length)],
      roofType: roofTypes[Math.floor(Math.random() * roofTypes.length)],
      shadingIssues: Math.random() > 0.7,
      currentUtilityBill: 200 + Math.floor(Math.random() * 200),
      timeline: "2-3 months",
      homeOwnership: "owner",
      propertyType: "residential",
      decisionMaker: true
    }, null, 2);
  }

  /**
   * Generate mock response to lead
   */
  private generateLeadResponse(content: string): string {
    const responses = [
      "Hi there! Thank you for your interest in solar energy. I'd love to help you explore how solar can reduce your energy costs and increase your home's value. Based on your needs, I can provide a customized quote and walk you through available incentives. When would be a good time for a quick call to discuss your specific situation?",

      "Hello! Thanks for reaching out about solar installation. Your property sounds like an excellent candidate for solar panels. I'd be happy to provide a free site assessment and detailed proposal. We have financing options available that can make your solar system cash-flow positive from day one. Can we schedule a brief consultation?",

      "Hi! I appreciate your interest in going solar. Based on what you've shared, you could see significant savings on your electricity bills. Our team can provide a comprehensive analysis of your energy usage and design a custom system that maximizes your ROI. Would you like to schedule a free consultation this week?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate mock source analysis
   */
  private generateSourceAnalysis(content: string): string {
    const qualities = ['high', 'high', 'medium', 'medium'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    const reliability = quality === 'high' ? 85 + Math.floor(Math.random() * 10) : 65 + Math.floor(Math.random() * 15);

    return JSON.stringify({
      quality,
      reliability,
      reasoning: "Source provides consistently detailed lead information with good contact data coverage. Intent clarity is strong and conversion potential appears solid based on sample quality."
    }, null, 2);
  }

  /**
   * Generate generic response
   */
  private generateGenericResponse(content: string): string {
    if (content.includes('hello') || content.includes('hi')) {
      return "Hello! I'm your local LLM assistant. I'm running in mock mode for testing. How can I help you today?";
    }

    return "I'm a mock LLM service running locally for testing purposes. In production, I would be replaced with your actual LLM (Qwen 3 VL 4B via LM Studio). This allows you to test the integration without requiring the full AI backend to be running.";
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordUsage(metrics: any): void {
    // Mock implementation - just log
    console.log(`[MockLLM] Request processed: ${metrics.totalTokens} tokens, $${metrics.cost}`);
  }
}

/**
 * Create mock LLM instance
 */
export function createMockLLM(config: LLMConfig): MockLLMService {
  return new MockLLMService(config);
}
