import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';

/**
 * Reddit Scraper
 * Scrapes Reddit for solar-related posts and comments
 * Uses Reddit's public JSON API (no auth required for searches)
 */
export class RedditScraper extends BaseScraper {
  private subreddits = [
    'solar',
    'SolarDIY',
    'homeowners',
    'HomeImprovement',
    'electricians',
  ];

  private searchTerms = [
    'solar quote',
    'solar installation',
    'solar panels cost',
    'going solar',
    'solar company recommendation',
    'need solar installer',
    'solar estimate',
  ];

  constructor(config?: Partial<ScraperConfig>) {
    super('Reddit', {
      rateLimit: 2000, // Reddit rate limit: 1 request per 2 seconds
      ...config,
    });
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    try {
      this.log(`Searching Reddit for solar leads in ${location}`);

      const useMockData = process.env.USE_MOCK_SCRAPER !== 'false';

      if (useMockData) {
        this.log(`Using mock data mode for ${location}`);
        const mockLeads = this.generateMockLeads(location);
        leads.push(...mockLeads);
      } else {
        // Search subreddits for location-specific solar posts
        for (const subreddit of this.subreddits) {
          try {
            const subredditLeads = await this.searchSubreddit(subreddit, location);
            leads.push(...subredditLeads);
          } catch (error: any) {
            this.logError(`Failed to search r/${subreddit}: ${error.message}`);
          }
        }

        // Also search with specific terms
        for (const term of this.searchTerms.slice(0, 3)) { // Limit to avoid rate limits
          try {
            const searchLeads = await this.searchReddit(`${term} ${location}`);
            leads.push(...searchLeads);
          } catch (error: any) {
            this.logError(`Failed to search "${term}": ${error.message}`);
          }
        }
      }

      // Deduplicate by post URL
      const uniqueLeads = this.deduplicateLeads(leads);
      this.log(`Found ${uniqueLeads.length} unique Reddit leads in ${location}`);

      return uniqueLeads;
    } catch (error: any) {
      this.logError(`Reddit scraping failed: ${error.message}`);
      return leads;
    }
  }

  /**
   * Search a specific subreddit
   */
  private async searchSubreddit(subreddit: string, location: string): Promise<ScrapedLead[]> {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(location + ' solar')}&restrict_sr=1&sort=new&limit=25`;
    
    const data = await this.makeRequest<any>(url, {
      headers: {
        'User-Agent': 'SolarLeadBot/1.0',
      },
    });

    return this.parseRedditPosts(data?.data?.children || [], location);
  }

  /**
   * Search all of Reddit
   */
  private async searchReddit(query: string): Promise<ScrapedLead[]> {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25`;
    
    const data = await this.makeRequest<any>(url, {
      headers: {
        'User-Agent': 'SolarLeadBot/1.0',
      },
    });

    return this.parseRedditPosts(data?.data?.children || [], query);
  }

  /**
   * Parse Reddit posts into leads
   */
  private parseRedditPosts(posts: any[], location: string): ScrapedLead[] {
    const leads: ScrapedLead[] = [];

    for (const post of posts) {
      const data = post.data;
      
      // Skip if post is too old (more than 30 days)
      const postAge = Date.now() / 1000 - data.created_utc;
      if (postAge > 30 * 24 * 60 * 60) continue;

      // Check if it's a genuine solar inquiry
      if (!this.isSolarInquiry(data.title, data.selftext)) continue;

      const lead: ScrapedLead = {
        name: data.author || 'Reddit User',
        location: this.extractLocation(data.title, data.selftext) || location,
        request: this.cleanText(data.title + (data.selftext ? ` - ${data.selftext.slice(0, 200)}` : '')),
        source: this.source,
        score: 0,
        priority: 'medium',
        originalPostUrl: `https://reddit.com${data.permalink}`,
        profileUrl: `https://reddit.com/u/${data.author}`,
        whyHot: this.determineWhyHot(data),
        actionRequired: 'Respond to post with helpful information and offer consultation',
        postedTime: this.formatPostedTime(data.created_utc),
        message: data.selftext?.slice(0, 500) || data.title,
        intent: this.detectIntent(data.title, data.selftext),
      };

      lead.score = this.calculateLeadScore(lead);
      lead.priority = this.determinePriority(lead.score, false);

      leads.push(lead);
    }

    return leads;
  }

  /**
   * Check if post is a genuine solar inquiry
   */
  private isSolarInquiry(title: string, body: string): boolean {
    const text = `${title} ${body}`.toLowerCase();
    
    const inquiryKeywords = [
      'looking for',
      'recommend',
      'quote',
      'cost',
      'price',
      'worth it',
      'should i',
      'help me',
      'advice',
      'thinking about',
      'considering',
      'installer',
      'company',
      'experience with',
    ];

    const solarKeywords = ['solar', 'panels', 'photovoltaic', 'pv system'];

    const hasSolarKeyword = solarKeywords.some(kw => text.includes(kw));
    const hasInquiryKeyword = inquiryKeywords.some(kw => text.includes(kw));

    return hasSolarKeyword && hasInquiryKeyword;
  }

  /**
   * Extract location from post text
   */
  private extractLocation(title: string, body: string): string | undefined {
    const text = `${title} ${body}`;
    
    // Common US states
    const states = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ];

    for (const state of states) {
      if (text.toLowerCase().includes(state.toLowerCase())) {
        return state;
      }
    }

    return undefined;
  }

  /**
   * Determine why this lead is hot
   */
  private determineWhyHot(data: any): string {
    const text = `${data.title} ${data.selftext || ''}`.toLowerCase();
    
    if (text.includes('quote') || text.includes('estimate')) {
      return 'Actively seeking quotes - high purchase intent';
    }
    if (text.includes('installer') || text.includes('company')) {
      return 'Looking for installer recommendations';
    }
    if (text.includes('just bought') || text.includes('new home')) {
      return 'New homeowner considering solar';
    }
    if (data.num_comments > 10) {
      return 'Active discussion - engaged community';
    }
    
    return 'Expressed interest in solar installation';
  }

  /**
   * Detect user intent
   */
  private detectIntent(title: string, body: string): string {
    const text = `${title} ${body || ''}`.toLowerCase();
    
    if (text.includes('quote') || text.includes('cost') || text.includes('price')) {
      return 'pricing_inquiry';
    }
    if (text.includes('recommend') || text.includes('best company')) {
      return 'recommendation_request';
    }
    if (text.includes('worth it') || text.includes('should i')) {
      return 'decision_support';
    }
    if (text.includes('problem') || text.includes('issue')) {
      return 'support_needed';
    }
    
    return 'general_inquiry';
  }

  /**
   * Format posted time
   */
  private formatPostedTime(createdUtc: number): string {
    const now = Date.now() / 1000;
    const diff = now - createdUtc;
    
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  /**
   * Deduplicate leads by URL
   */
  private deduplicateLeads(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Set<string>();
    return leads.filter(lead => {
      if (lead.originalPostUrl && seen.has(lead.originalPostUrl)) {
        return false;
      }
      if (lead.originalPostUrl) seen.add(lead.originalPostUrl);
      return true;
    });
  }

  /**
   * Generate mock leads for testing
   */
  private generateMockLeads(location: string): ScrapedLead[] {
    const mockPosts = [
      {
        author: 'SolarCurious2024',
        title: `Looking for solar installer recommendations in ${location}`,
        body: 'Just bought a house and want to go solar. Anyone have experience with local installers?',
        subreddit: 'solar',
        age: 2,
      },
      {
        author: 'HomeOwnerHelp',
        title: `Solar quote seems high - ${location} area`,
        body: 'Got a quote for $25k for a 8kW system. Is this reasonable? Looking for other opinions.',
        subreddit: 'homeowners',
        age: 1,
      },
      {
        author: 'GreenEnergy_Fan',
        title: `Best solar companies in ${location}?`,
        body: 'Doing research before getting quotes. Which companies have good reviews here?',
        subreddit: 'solar',
        age: 3,
      },
      {
        author: 'DIYSolarNewbie',
        title: `Thinking about going solar - ${location}`,
        body: 'We have a south-facing roof and high electric bills. Is solar worth it in our area?',
        subreddit: 'SolarDIY',
        age: 5,
      },
      {
        author: 'EcoFriendlyHome',
        title: `Need help choosing between solar quotes - ${location}`,
        body: 'Got 3 quotes ranging from $18k to $28k. Not sure which to go with. Any advice?',
        subreddit: 'HomeImprovement',
        age: 1,
      },
    ];

    return mockPosts.map((post, index) => {
      const lead: ScrapedLead = {
        name: post.author,
        location: location,
        request: `${post.title} - ${post.body}`,
        source: this.source,
        score: 0,
        priority: 'medium',
        originalPostUrl: `https://reddit.com/r/${post.subreddit}/comments/abc${index}`,
        profileUrl: `https://reddit.com/u/${post.author}`,
        whyHot: 'Actively seeking solar information',
        actionRequired: 'Respond with helpful advice and offer consultation',
        postedTime: `${post.age} days ago`,
        message: post.body,
        intent: 'pricing_inquiry',
      };

      lead.score = this.calculateLeadScore(lead);
      lead.priority = this.determinePriority(lead.score, false);

      return lead;
    });
  }
}

