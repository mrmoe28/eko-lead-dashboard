import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';
import * as cheerio from 'cheerio';

/**
 * Craigslist Scraper
 * Scrapes Craigslist for solar-related services wanted posts
 */
export class CraigslistScraper extends BaseScraper {
  // Craigslist city codes mapped to states
  private locationToCities: Record<string, string[]> = {
    'Georgia': ['atlanta', 'savannah', 'augusta', 'macon', 'athens'],
    'Florida': ['miami', 'orlando', 'tampa', 'jacksonville', 'fortlauderdale'],
    'California': ['losangeles', 'sfbay', 'sandiego', 'sacramento', 'fresno'],
    'Texas': ['houston', 'dallas', 'austin', 'sanantonio', 'fortworth'],
    'Arizona': ['phoenix', 'tucson', 'flagstaff'],
    'Nevada': ['lasvegas', 'reno'],
    'Colorado': ['denver', 'cosprings', 'boulder'],
    'New York': ['newyork', 'buffalo', 'albany'],
  };

  constructor(config?: Partial<ScraperConfig>) {
    super('Craigslist', {
      rateLimit: 3000, // Be respectful of Craigslist - 1 request per 3 seconds
      timeout: 15000,
      ...config,
    });
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    try {
      this.log(`Searching Craigslist for solar leads in ${location}`);

      const useMockData = process.env.USE_MOCK_SCRAPER !== 'false';

      if (useMockData) {
        this.log(`Using mock data mode for ${location}`);
        const mockLeads = this.generateMockLeads(location);
        leads.push(...mockLeads);
      } else {
        const cities = this.locationToCities[location] || [];
        
        if (cities.length === 0) {
          this.log(`No Craigslist cities mapped for ${location}, using search`);
          return leads;
        }

        // Search services wanted section for each city
        for (const city of cities.slice(0, 3)) { // Limit to avoid rate limits
          try {
            const cityLeads = await this.searchCity(city, location);
            leads.push(...cityLeads);
          } catch (error: any) {
            this.logError(`Failed to search ${city}: ${error.message}`);
          }
        }
      }

      this.log(`Found ${leads.length} Craigslist leads in ${location}`);
      return leads;
    } catch (error: any) {
      this.logError(`Craigslist scraping failed: ${error.message}`);
      return leads;
    }
  }

  /**
   * Search a specific Craigslist city
   */
  private async searchCity(city: string, state: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Search in services wanted (hsw) category
    const searchTerms = ['solar', 'solar panels', 'solar installation'];
    
    for (const term of searchTerms) {
      try {
        const url = `https://${city}.craigslist.org/search/hsw?query=${encodeURIComponent(term)}`;
        
        const html = await this.makeRequest<string>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        const parsedLeads = this.parseListings(html, city, state);
        leads.push(...parsedLeads);
      } catch (error: any) {
        this.logError(`Failed to search ${city} for "${term}": ${error.message}`);
      }
    }

    return leads;
  }

  /**
   * Parse Craigslist search results
   */
  private parseListings(html: string, city: string, state: string): ScrapedLead[] {
    const $ = cheerio.load(html);
    const leads: ScrapedLead[] = [];

    // Craigslist uses various selectors - try common ones
    const selectors = ['.result-row', '.cl-search-result', 'li.result-info'];
    
    for (const selector of selectors) {
      $(selector).each((i, element) => {
        try {
          const $el = $(element);
          
          // Try different title selectors
          const title = $el.find('.result-title, .posting-title, a.titlestring').text().trim() ||
                        $el.find('a').first().text().trim();
          
          const link = $el.find('a.result-title, a.posting-title, a.titlestring').attr('href') ||
                       $el.find('a').first().attr('href');
          
          const dateStr = $el.find('time, .result-date').attr('datetime') ||
                          $el.find('.date').text().trim();
          
          const neighborhood = $el.find('.result-hood, .nearby').text().trim()
            .replace(/[()]/g, '');

          if (!title || !this.isSolarRelated(title)) return;

          const lead: ScrapedLead = {
            name: 'Craigslist User',
            location: neighborhood ? `${neighborhood}, ${city}, ${state}` : `${city}, ${state}`,
            request: title,
            source: this.source,
            score: 0,
            priority: 'medium',
            originalPostUrl: link?.startsWith('http') ? link : `https://${city}.craigslist.org${link}`,
            whyHot: 'Posted service request - actively seeking solar help',
            actionRequired: 'Respond to Craigslist post with service offer',
            postedTime: this.parseDate(dateStr),
            message: title,
            intent: this.detectIntent(title),
          };

          lead.score = this.calculateLeadScore(lead);
          lead.priority = this.determinePriority(lead.score, false);

          leads.push(lead);
        } catch (error: any) {
          // Skip malformed listings
        }
      });

      if (leads.length > 0) break; // Found listings with this selector
    }

    return leads;
  }

  /**
   * Check if listing is solar-related
   */
  private isSolarRelated(text: string): boolean {
    const keywords = [
      'solar', 'photovoltaic', 'pv panel', 'solar panel',
      'solar installation', 'solar system', 'solar power'
    ];
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Recently';
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return `${Math.floor(days / 7)} weeks ago`;
    } catch {
      return 'Recently';
    }
  }

  /**
   * Detect user intent
   */
  private detectIntent(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('install') || lower.includes('installation')) {
      return 'installation_request';
    }
    if (lower.includes('repair') || lower.includes('fix')) {
      return 'repair_request';
    }
    if (lower.includes('quote') || lower.includes('estimate')) {
      return 'quote_request';
    }
    if (lower.includes('clean') || lower.includes('maintenance')) {
      return 'maintenance_request';
    }
    
    return 'general_inquiry';
  }

  /**
   * Generate mock leads for testing
   */
  private generateMockLeads(location: string): ScrapedLead[] {
    const cities = this.locationToCities[location] || ['city'];
    const city = cities[0];

    const mockListings = [
      {
        title: 'Need solar panel installation for residential home',
        neighborhood: 'Downtown',
        age: 1,
      },
      {
        title: 'Looking for solar company to provide quote',
        neighborhood: 'Suburbs',
        age: 2,
      },
      {
        title: 'Wanted: Solar installer for new construction',
        neighborhood: 'North Side',
        age: 3,
      },
      {
        title: 'Solar panel cleaning and maintenance needed',
        neighborhood: 'West End',
        age: 1,
      },
      {
        title: 'Need help with solar system design and installation',
        neighborhood: 'East Side',
        age: 4,
      },
    ];

    return mockListings.map((listing, index) => {
      const lead: ScrapedLead = {
        name: 'Craigslist User',
        location: `${listing.neighborhood}, ${city}, ${location}`,
        request: listing.title,
        source: this.source,
        score: 0,
        priority: 'medium',
        originalPostUrl: `https://${city}.craigslist.org/hsw/d/${index}`,
        whyHot: 'Posted service request - actively seeking solar help',
        actionRequired: 'Respond to Craigslist post with service offer',
        postedTime: `${listing.age} days ago`,
        message: listing.title,
        intent: this.detectIntent(listing.title),
      };

      lead.score = this.calculateLeadScore(lead);
      lead.priority = this.determinePriority(lead.score, false);

      return lead;
    });
  }
}

