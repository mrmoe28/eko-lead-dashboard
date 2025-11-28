/**
 * Scraper Configuration Interface
 * Defines configuration for all scrapers
 */

export interface ScraperConfig {
  // Rate limiting
  rateLimit: number; // Min ms between requests (min 1000ms)
  maxConcurrent: number; // Max concurrent requests

  // Retry configuration
  maxRetries: number; // Default: 3
  retryDelay: number; // Initial retry delay in ms
  retryBackoff: number; // Exponential backoff multiplier

  // Timeout configuration
  timeout: number; // Request timeout in ms (default: 30000)
  jobTimeout: number; // Total job timeout in ms

  // Request configuration
  userAgent: string;
  headers: Record<string, string>;

  // Ethical scraping
  respectRobotsTxt: boolean; // Always true
  checkRobotsTxt: boolean; // Check robots.txt before scraping

  // Proxy configuration
  useProxy: boolean;
  proxyRotation: boolean;
  proxyHealthCheck: boolean;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRequests: boolean;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  rateLimit: 2000, // 2 seconds between requests
  maxConcurrent: 3,
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,
  timeout: 30000,
  jobTimeout: 600000, // 10 minutes
  userAgent: 'EkoLeadGenerator/1.0 (Solar Lead Scraper; +https://ekoleadgen.com)',
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  respectRobotsTxt: true,
  checkRobotsTxt: true,
  useProxy: false, // Disabled by default
  proxyRotation: true,
  proxyHealthCheck: true,
  logLevel: 'info',
  logRequests: true,
};

/**
 * Lead Priority Levels
 */
export type LeadPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Scraped Lead Data Structure
 */
export interface ScrapedLead {
  name: string;
  location: string;
  score: number; // 0-100
  priority: LeadPriority;
  source: string; // e.g., 'Reddit', 'Building Permits'
  phone?: string;
  email?: string;
  request: string; // What they're looking for
  whyHot?: string; // Why this is a hot lead
  actionRequired?: string; // Next steps
  postedTime?: string;
  profileUrl?: string;
  originalPostUrl?: string;
  revenueMin?: number;
  revenueMax?: number;
  // Scraper-specific fields
  address?: string;
  systemSize?: string;
  permitNumber?: string;
  message?: string;
  intent?: string; // Lead's intent/sentiment
}

/**
 * Scraper Result
 */
export interface ScraperResult {
  source: string;
  location: string;
  leads: ScrapedLead[];
  totalLeads: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // in ms
  requestsMade: number;
  successRate: number; // percentage
}
