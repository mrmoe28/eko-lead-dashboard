import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ScraperConfig, DEFAULT_SCRAPER_CONFIG, ScrapedLead, ScraperResult } from '../scraper-config';
import PQueue from 'p-queue';

/**
 * Abstract Base Scraper Class
 * All scrapers must extend this class
 */
export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected httpClient: AxiosInstance;
  protected queue: PQueue;
  protected startTime?: Date;
  protected endTime?: Date;
  protected requestsMade = 0;
  protected successfulRequests = 0;
  protected errors: string[] = [];

  constructor(
    protected source: string,
    config: Partial<ScraperConfig> = {}
  ) {
    this.config = { ...DEFAULT_SCRAPER_CONFIG, ...config };

    // Create rate-limited HTTP client
    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        ...this.config.headers,
      },
    });

    // Create rate-limited queue
    this.queue = new PQueue({
      interval: this.config.rateLimit,
      intervalCap: 1,
      concurrency: this.config.maxConcurrent,
    });

    // Add response interceptor for metrics
    this.httpClient.interceptors.response.use(
      (response) => {
        this.successfulRequests++;
        return response;
      },
      (error) => {
        this.logError(`Request failed: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * Main scraping method - must be implemented by subclasses
   */
  abstract scrape(location: string): Promise<ScrapedLead[]>;

  /**
   * Make a rate-limited HTTP request
   */
  protected async makeRequest<T = any>(
    url: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.queue.add(async () => {
      this.requestsMade++;

      if (this.config.logRequests) {
        this.log(`Requesting: ${url}`);
      }

      const response = await this.retryRequest(() =>
        this.httpClient.request({ url, ...options })
      );

      return response.data as T;
    }) as Promise<T>;
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, attempt - 1);
      this.log(`Retry attempt ${attempt}/${this.config.maxRetries} after ${delay}ms`, 'warn');

      await this.sleep(delay);
      return this.retryRequest(fn, attempt + 1);
    }
  }

  /**
   * Execute scraping with metrics tracking
   */
  async execute(location: string): Promise<ScraperResult> {
    this.startTime = new Date();
    this.requestsMade = 0;
    this.successfulRequests = 0;
    this.errors = [];

    this.log(`Starting scrape for location: ${location}`);

    try {
      const leads = await this.scrape(location);
      this.endTime = new Date();

      const result: ScraperResult = {
        source: this.source,
        location,
        leads,
        totalLeads: leads.length,
        errors: this.errors,
        startTime: this.startTime,
        endTime: this.endTime,
        duration: this.endTime.getTime() - this.startTime.getTime(),
        requestsMade: this.requestsMade,
        successRate: this.requestsMade > 0
          ? (this.successfulRequests / this.requestsMade) * 100
          : 0,
      };

      this.log(`Scrape completed: ${leads.length} leads found in ${result.duration}ms`);
      return result;
    } catch (error: any) {
      this.endTime = new Date();
      this.logError(`Scrape failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate lead score (0-100) based on various factors
   */
  protected calculateLeadScore(lead: Partial<ScrapedLead>): number {
    let score = 50; // Base score

    // Has contact info
    if (lead.phone) score += 15;
    if (lead.email) score += 15;

    // Has detailed request
    if (lead.request && lead.request.length > 50) score += 10;

    // Has address
    if (lead.address) score += 10;

    // Recent posting
    if (lead.postedTime) {
      const keywords = ['today', 'hour', 'minute', 'just now'];
      if (keywords.some(kw => lead.postedTime!.toLowerCase().includes(kw))) {
        score += 10;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine lead priority based on score and other factors
   */
  protected determinePriority(score: number, hasContactInfo: boolean): 'urgent' | 'high' | 'medium' | 'low' {
    if (score >= 80 && hasContactInfo) return 'urgent';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Clean and sanitize text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  /**
   * Extract email from text
   */
  protected extractEmail(text: string): string | undefined {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract phone number from text
   */
  protected extractPhone(text: string): string | undefined {
    const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utilities
   */
  protected log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${this.source}] [${level.toUpperCase()}] ${message}`);
    }
  }

  protected logError(message: string): void {
    this.errors.push(message);
    this.log(message, 'error');
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
    };
  }
}
