import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';

/**
 * Yelp Scraper
 * Scrapes Yelp for solar-related reviews and requests
 * Can use Yelp Fusion API (requires API key) or mock data
 */
export class YelpScraper extends BaseScraper {
  private apiKey: string | undefined;

  constructor(config?: Partial<ScraperConfig>) {
    super('Yelp', {
      rateLimit: 1000, // Yelp API allows 5000 calls/day
      ...config,
    });
    this.apiKey = process.env.YELP_API_KEY;
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    try {
      this.log(`Searching Yelp for solar leads in ${location}`);

      // Real scraping only - no mock data
      if (!this.apiKey) {
        this.log(`No Yelp API key configured - data not available. Set YELP_API_KEY in environment.`);
        return leads;
      }

      // Use Yelp Fusion API
      const businesses = await this.searchYelp(location);
      
      if (businesses.length === 0) {
        this.log(`No solar businesses found on Yelp for ${location}`);
        return leads;
      }

      for (const business of businesses) {
        // Get reviews for businesses asking about solar
        const reviewLeads = await this.getReviewLeads(business);
        leads.push(...reviewLeads);
      }

      if (leads.length === 0) {
        this.log(`No Yelp leads found for ${location} - real data returned empty`);
      } else {
        this.log(`Found ${leads.length} real Yelp leads in ${location}`);
      }
      
      return leads;
    } catch (error: any) {
      this.logError(`Yelp scraping failed: ${error.message}`);
      return leads;
    }
  }

  /**
   * Search Yelp for solar-related businesses and their reviews
   */
  private async searchYelp(location: string): Promise<any[]> {
    if (!this.apiKey) return [];

    try {
      const url = 'https://api.yelp.com/v3/businesses/search';
      
      const response = await this.makeRequest<any>(url, {
        params: {
          term: 'solar installation',
          location: location,
          limit: 20,
          sort_by: 'review_count',
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.businesses || [];
    } catch (error: any) {
      this.logError(`Yelp API search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get leads from business reviews
   */
  private async getReviewLeads(business: any): Promise<ScrapedLead[]> {
    if (!this.apiKey) return [];

    try {
      const url = `https://api.yelp.com/v3/businesses/${business.id}/reviews`;
      
      const response = await this.makeRequest<any>(url, {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const leads: ScrapedLead[] = [];

      for (const review of response.reviews || []) {
        // Look for reviews indicating solar interest
        if (this.indicatesSolarInterest(review.text)) {
          const lead = this.reviewToLead(review, business);
          leads.push(lead);
        }
      }

      return leads;
    } catch (error: any) {
      this.logError(`Failed to get reviews for ${business.name}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if review indicates solar purchasing interest
   */
  private indicatesSolarInterest(text: string): boolean {
    const interestKeywords = [
      'looking to get',
      'considering',
      'thinking about',
      'want to install',
      'need quotes',
      'comparing',
      'recommend',
      'best company',
      'good experience',
    ];

    const lower = text.toLowerCase();
    return interestKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Convert Yelp review to lead
   */
  private reviewToLead(review: any, business: any): ScrapedLead {
    const lead: ScrapedLead = {
      name: review.user?.name || 'Yelp User',
      location: business.location?.city 
        ? `${business.location.city}, ${business.location.state}`
        : 'Unknown',
      request: `Interested in solar - reviewed ${business.name}`,
      source: this.source,
      score: 0,
      priority: 'medium',
      originalPostUrl: review.url,
      profileUrl: review.user?.profile_url,
      whyHot: 'Actively researching solar companies on Yelp',
      actionRequired: 'Engage on Yelp or target with ads',
      postedTime: this.formatDate(review.time_created),
      message: review.text?.slice(0, 500),
    };

    lead.score = this.calculateLeadScore(lead);
    lead.priority = this.determinePriority(lead.score, false);

    return lead;
  }

  /**
   * Format date string
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return `${Math.floor(days / 30)} months ago`;
    } catch {
      return 'Recently';
    }
  }
}

