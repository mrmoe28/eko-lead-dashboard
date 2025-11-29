import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';

/**
 * Incentives Scraper
 * Scrapes solar incentive databases to identify areas with new/updated incentives
 * This helps target homeowners in areas with favorable solar economics
 */
export class IncentivesScraper extends BaseScraper {
  // State abbreviations mapping
  private stateAbbreviations: Record<string, string> = {
    'Georgia': 'GA',
    'Florida': 'FL',
    'California': 'CA',
    'Texas': 'TX',
    'Arizona': 'AZ',
    'Nevada': 'NV',
    'Colorado': 'CO',
    'New York': 'NY',
    'North Carolina': 'NC',
    'Massachusetts': 'MA',
  };

  constructor(config?: Partial<ScraperConfig>) {
    super('Incentives', {
      rateLimit: 2000,
      ...config,
    });
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    try {
      this.log(`Searching solar incentives in ${location}`);

      const useMockData = process.env.USE_MOCK_SCRAPER !== 'false';

      if (useMockData) {
        this.log(`Using mock data mode for ${location}`);
        const mockLeads = this.generateMockLeads(location);
        leads.push(...mockLeads);
      } else {
        // In production, this would query DSIRE API or scrape their database
        // DSIRE (Database of State Incentives for Renewables & Efficiency)
        // https://www.dsireusa.org/
        
        const stateAbbr = this.stateAbbreviations[location];
        if (!stateAbbr) {
          this.log(`No state abbreviation found for ${location}`);
          return leads;
        }

        // Fetch incentives data
        const incentives = await this.fetchIncentives(stateAbbr);
        
        // Convert incentives to leads (areas with good incentives = hot leads)
        for (const incentive of incentives) {
          const lead = this.incentiveToLead(incentive, location);
          if (lead) leads.push(lead);
        }
      }

      this.log(`Found ${leads.length} incentive-based leads in ${location}`);
      return leads;
    } catch (error: any) {
      this.logError(`Incentives scraping failed: ${error.message}`);
      return leads;
    }
  }

  /**
   * Fetch incentives from DSIRE or similar database
   */
  private async fetchIncentives(stateAbbr: string): Promise<any[]> {
    // Note: DSIRE requires registration for API access
    // This is a placeholder for the actual API call
    
    try {
      // In production, this would be:
      // const url = `https://api.dsireusa.org/api/v2/getprograms?state=${stateAbbr}&technology=solar`;
      // const response = await this.makeRequest(url);
      
      // For now, return empty - real implementation needs DSIRE API key
      return [];
    } catch (error: any) {
      this.logError(`Failed to fetch incentives: ${error.message}`);
      return [];
    }
  }

  /**
   * Convert an incentive program to a lead opportunity
   */
  private incentiveToLead(incentive: any, location: string): ScrapedLead | null {
    // This would map incentive data to lead format
    // Incentives represent areas where solar is economically favorable
    
    const lead: ScrapedLead = {
      name: `${location} Solar Incentive Area`,
      location: location,
      request: incentive.programName || 'Solar incentive program available',
      source: this.source,
      score: 0,
      priority: 'medium',
      originalPostUrl: incentive.url,
      whyHot: `New/active solar incentive: ${incentive.programName}`,
      actionRequired: 'Target marketing to this area highlighting incentives',
      message: incentive.description,
    };

    lead.score = this.calculateLeadScore(lead);
    lead.priority = this.determinePriority(lead.score, false);

    return lead;
  }

  /**
   * Generate mock leads representing incentive opportunities
   */
  private generateMockLeads(location: string): ScrapedLead[] {
    const stateAbbr = this.stateAbbreviations[location] || 'XX';
    
    const mockIncentives = [
      {
        name: 'Federal Solar Investment Tax Credit (ITC)',
        description: '30% federal tax credit for solar installations through 2032',
        type: 'Tax Credit',
        value: '30% of system cost',
        expiry: '2032',
      },
      {
        name: `${location} Solar Rebate Program`,
        description: `State rebate program offering $0.50/watt for residential solar`,
        type: 'Rebate',
        value: '$0.50/watt',
        expiry: 'While funds available',
      },
      {
        name: 'Net Metering Program',
        description: 'Full retail credit for excess solar energy sent to grid',
        type: 'Net Metering',
        value: '1:1 credit ratio',
        expiry: 'Ongoing',
      },
      {
        name: `${location} Property Tax Exemption`,
        description: 'Solar installations exempt from property tax assessment',
        type: 'Tax Exemption',
        value: '100% exemption',
        expiry: 'Permanent',
      },
      {
        name: 'Local Utility Solar Program',
        description: 'Additional $500 rebate from local utility company',
        type: 'Utility Rebate',
        value: '$500 flat rebate',
        expiry: '2024-12-31',
      },
    ];

    return mockIncentives.map((incentive, index) => {
      const urgency = incentive.expiry.includes('2024') ? 'urgent' : 
                      incentive.expiry === 'While funds available' ? 'high' : 'medium';
      
      const lead: ScrapedLead = {
        name: `Incentive Opportunity - ${location}`,
        location: location,
        request: incentive.name,
        source: this.source,
        score: 0,
        priority: urgency as 'urgent' | 'high' | 'medium' | 'low',
        originalPostUrl: `https://dsireusa.org/incentives/${stateAbbr.toLowerCase()}/${index}`,
        whyHot: `${incentive.type}: ${incentive.value} - ${incentive.description}`,
        actionRequired: `Promote solar with ${incentive.name} incentive to prospects in ${location}`,
        postedTime: 'Current',
        message: `${incentive.description}\n\nValue: ${incentive.value}\nExpires: ${incentive.expiry}`,
        intent: 'incentive_opportunity',
      };

      // Incentive leads get high scores as they represent marketing opportunities
      lead.score = 70 + Math.floor(Math.random() * 20);
      
      return lead;
    });
  }
}

