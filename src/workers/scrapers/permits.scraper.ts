import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';
import * as cheerio from 'cheerio';

/**
 * Building Permits Scraper
 * Scrapes county building permit databases for solar installations
 */
export class PermitsScraper extends BaseScraper {
  constructor(config?: Partial<ScraperConfig>) {
    super('Building Permits', config);
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    try {
      this.log(`Searching building permits in ${location}`);

      // Check if we should use mock data (for testing) or real scraping
      const useMockData = process.env.USE_MOCK_SCRAPER !== 'false';

      if (useMockData) {
        // Generate realistic mock data for testing
        this.log(`Using mock data mode for ${location}`);
        const mockLeads = this.generateMockLeads(location);
        leads.push(...mockLeads);
      } else {
        // Real scraping implementation
        const permitUrls = this.getPermitUrls(location);

        for (const permitUrl of permitUrls) {
          try {
            const html = await this.makeRequest<string>(permitUrl);
            const extractedLeads = this.parsePermitPage(html, location);
            leads.push(...extractedLeads);
          } catch (error: any) {
            this.logError(`Failed to scrape ${permitUrl}: ${error.message}`);
          }
        }
      }

      this.log(`Found ${leads.length} permit leads in ${location}`);
    } catch (error: any) {
      this.logError(`Permits scraping failed: ${error.message}`);
    }

    return leads;
  }

  /**
   * Generate mock leads for testing/demo purposes
   */
  private generateMockLeads(location: string): ScrapedLead[] {
    const mockLeads: ScrapedLead[] = [];
    const numLeads = 5 + Math.floor(Math.random() * 10); // 5-15 leads

    const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa', 'James', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const streets = ['Oak St', 'Maple Ave', 'Cedar Lane', 'Pine Dr', 'Elm Rd', 'Birch Way', 'Willow Ct', 'Aspen Blvd'];
    const cities = {
      'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
      'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
    };

    const locationCities = cities[location as keyof typeof cities] || ['Main City'];

    for (let i = 0; i < numLeads; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = locationCities[Math.floor(Math.random() * locationCities.length)];
      const streetNum = 100 + Math.floor(Math.random() * 9900);
      const permitNum = `SP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

      const systemSizes = ['6kW', '8kW', '10kW', '12kW', '15kW', '20kW'];
      const systemSize = systemSizes[Math.floor(Math.random() * systemSizes.length)];

      const hasPhone = Math.random() > 0.3;
      const hasEmail = Math.random() > 0.4;

      const lead: ScrapedLead = {
        name: `${firstName} ${lastName}`,
        location: `${city}, ${location}`,
        address: `${streetNum} ${street}, ${city}, ${location}`,
        permitNumber: permitNum,
        systemSize,
        request: `Solar PV Installation - ${systemSize} residential rooftop system`,
        source: this.source,
        score: 0,
        priority: 'medium',
        phone: hasPhone ? `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        email: hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : undefined,
        originalPostUrl: `https://permits.${location.toLowerCase().replace(/\s/g, '')}.gov/permit/${permitNum}`,
        whyHot: 'Recently filed solar permit - high purchase intent',
        actionRequired: 'Contact homeowner about solar installation quote',
        postedTime: `${Math.floor(Math.random() * 7) + 1} days ago`,
      };

      // Calculate score and priority
      lead.score = this.calculateLeadScore(lead);
      lead.priority = this.determinePriority(lead.score, !!(lead.phone || lead.email));

      // Simulate slight delay for realism
      mockLeads.push(lead);
    }

    return mockLeads;
  }

  /**
   * Get permit database URLs for location
   * In production, this would query a database of county permit portals
   */
  private getPermitUrls(location: string): string[] {
    // This is a placeholder - real implementation would have a database
    // of county permit portal URLs mapped to locations

    const permitDatabases: Record<string, string[]> = {
      'Georgia': [
        'https://example-county.gov/permits/search', // Placeholder
      ],
      'Florida': [
        'https://example-fl-county.gov/permits', // Placeholder
      ],
    };

    return permitDatabases[location] || [];
  }

  /**
   * Parse permit search results page
   */
  private parsePermitPage(html: string, location: string): ScrapedLead[] {
    const $ = cheerio.load(html);
    const leads: ScrapedLead[] = [];

    // This is example parsing logic
    // Real implementation would match actual permit page structure

    $('.permit-row').each((i, element) => {
      try {
        const permitNumber = $(element).find('.permit-number').text().trim();
        const address = $(element).find('.address').text().trim();
        const owner = $(element).find('.owner').text().trim();
        const description = $(element).find('.description').text().trim();
        const phone = this.extractPhone($(element).text());
        const email = this.extractEmail($(element).text());

        // Only include if it's solar-related
        if (this.isSolarRelated(description)) {
          const lead: ScrapedLead = {
            name: this.cleanText(owner) || 'Unknown Homeowner',
            location: address || location,
            address,
            permitNumber,
            request: description,
            source: this.source,
            score: 0,
            priority: 'medium',
            phone,
            email,
            originalPostUrl: permitNumber ? `#permit-${permitNumber}` : undefined,
            whyHot: 'Recently filed solar permit - high intent',
            actionRequired: 'Contact homeowner about solar installation',
          };

          // Calculate score and priority
          lead.score = this.calculateLeadScore(lead);
          lead.priority = this.determinePriority(lead.score, !!(phone || email));

          leads.push(lead);
        }
      } catch (error: any) {
        this.logError(`Failed to parse permit row: ${error.message}`);
      }
    });

    return leads;
  }

  /**
   * Check if permit description is solar-related
   */
  private isSolarRelated(description: string): boolean {
    const solarKeywords = [
      'solar',
      'photovoltaic',
      'pv panel',
      'solar panel',
      'solar energy',
      'renewable energy',
      'solar system',
    ];

    const lowerDesc = description.toLowerCase();
    return solarKeywords.some(keyword => lowerDesc.includes(keyword));
  }
}
