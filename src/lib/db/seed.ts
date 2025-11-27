import { db } from './index';
import { leads } from './schema';

/**
 * Database Seed Script
 *
 * WARNING: This file contains DEMO data only.
 * The dashboard is designed to work with REAL leads from the scraper.
 *
 * To populate with real data, run:
 *   cd solar-data-extractor
 *   node scrape-leads.js Georgia
 *
 * Only run this seed script if you need demo data for testing.
 */

async function seed() {
  console.log('⚠️  DEMO DATA SEED');
  console.log('');
  console.log('This will add sample leads to your database.');
  console.log('For real data, run the scraper instead: node scrape-leads.js');
  console.log('');
  console.log('Skipping seed. Dashboard will show empty state until real leads are scraped.');

  process.exit(0);

  // DEMO DATA (commented out - uncomment only if you need test data)
  /*
  const sampleLeads = [
    {
      name: 'Demo Lead',
      location: 'Test City, ST',
      score: 85,
      priority: 'high',
      source: 'Demo',
      phone: '(555) 555-0123',
      email: 'demo@example.com',
      request: 'This is demo data. Run the scraper for real leads.',
      whyHot: 'Demo lead for testing',
      actionRequired: 'Delete this and use real data',
      postedTime: 'Demo',
      profileUrl: null,
      originalPostUrl: null,
      revenueMin: 10000,
      revenueMax: 20000,
      autoSubmitted: 0,
    },
    {
      name: 'Michael Chen',
      location: 'San Francisco, CA',
      score: 88,
      priority: 'urgent',
      source: 'HomeAdvisor',
      phone: '(415) 555-0198',
      email: 'mchen@techco.com',
      request: 'Master bathroom renovation - looking for luxury finishes. Timeline: 3-4 weeks',
      whyHot: 'Premium location, luxury project signals high budget, verified homeowner',
      actionRequired: 'Submit proposal by EOD - reviewing 3 contractors tomorrow',
      postedTime: '1 hour ago',
      profileUrl: 'https://homeadvisor.com/profile/mchen',
      originalPostUrl: 'https://homeadvisor.com/request/bath-reno-94110',
      revenueMin: 30000,
      revenueMax: 60000,
      autoSubmitted: 1,
    },
    {
      name: 'Jennifer Martinez',
      location: 'Denver, CO',
      score: 82,
      priority: 'high',
      source: 'Nextdoor',
      phone: '(720) 555-0167',
      email: null,
      request: 'Basement finishing - 1200 sq ft, want home theater + bar area. Flexible timeline.',
      whyHot: 'Large project scope, flexible timeline means easier scheduling',
      actionRequired: 'Respond with portfolio examples of basement finishing',
      postedTime: '3 hours ago',
      profileUrl: 'https://nextdoor.com/profile/jmartinez',
      originalPostUrl: 'https://nextdoor.com/post/basement-finish-80202',
      revenueMin: 40000,
      revenueMax: 55000,
      autoSubmitted: 0,
    },
    {
      name: 'David Thompson',
      location: 'Seattle, WA',
      score: 78,
      priority: 'high',
      source: 'Thumbtack',
      phone: null,
      email: 'david.t@outlook.com',
      request: 'Open concept kitchen/living room. Looking for design-build contractor.',
      whyHot: 'Design-build means single contract, established neighborhood',
      actionRequired: 'Send initial consultation availability',
      postedTime: '5 hours ago',
      profileUrl: 'https://thumbtack.com/profile/david-t',
      originalPostUrl: 'https://thumbtack.com/request/open-concept-98103',
      revenueMin: 35000,
      revenueMax: 50000,
      autoSubmitted: 1,
    },
    {
      name: 'Amanda Rodriguez',
      location: 'Phoenix, AZ',
      score: 72,
      priority: 'high',
      source: 'Nextdoor',
      phone: '(602) 555-0145',
      email: 'a.rodriguez@email.com',
      request: 'Outdoor kitchen and patio cover. Want to start in 2-3 months.',
      whyHot: 'Seasonal project timing is perfect, growing Phoenix market',
      actionRequired: 'Schedule site visit for measurement and quote',
      postedTime: '8 hours ago',
      profileUrl: 'https://nextdoor.com/profile/arodriguez',
      originalPostUrl: 'https://nextdoor.com/post/outdoor-kitchen-85251',
      revenueMin: 25000,
      revenueMax: 40000,
      autoSubmitted: 0,
    },
    {
      name: 'Robert Kim',
      location: 'Portland, OR',
      score: 68,
      priority: 'medium',
      source: 'HomeAdvisor',
      phone: '(503) 555-0189',
      email: null,
      request: 'Guest house addition - 400 sq ft. Need permits handled.',
      whyHot: 'ADU project, high demand in Portland market',
      actionRequired: 'Provide permit handling process overview',
      postedTime: '12 hours ago',
      profileUrl: 'https://homeadvisor.com/profile/rkim',
      originalPostUrl: 'https://homeadvisor.com/request/adu-97202',
      revenueMin: 80000,
      revenueMax: 120000,
      autoSubmitted: 1,
    },
    {
      name: 'Lisa Patel',
      location: 'Boston, MA',
      score: 65,
      priority: 'medium',
      source: 'Nextdoor',
      phone: null,
      email: 'lpatel@gmail.com',
      request: 'Historic home kitchen update - need someone experienced with old homes.',
      whyHot: 'Specialized work = less competition, historic Boston neighborhood',
      actionRequired: 'Share historic renovation portfolio',
      postedTime: '1 day ago',
      profileUrl: 'https://nextdoor.com/profile/lpatel',
      originalPostUrl: 'https://nextdoor.com/post/historic-kitchen-02108',
      revenueMin: 45000,
      revenueMax: 65000,
      autoSubmitted: 0,
    },
    {
      name: 'James Wilson',
      location: 'Atlanta, GA',
      score: 62,
      priority: 'medium',
      source: 'Angi',
      phone: '(404) 555-0156',
      email: 'jwilson@company.com',
      request: 'Home office build-out in spare bedroom. Needs built-in desk and shelving.',
      whyHot: 'Work-from-home trend, quick project for fill-in work',
      actionRequired: 'Send design ideas and timeline estimate',
      postedTime: '1 day ago',
      profileUrl: 'https://angi.com/profile/jwilson',
      originalPostUrl: 'https://angi.com/request/home-office-30305',
      revenueMin: 15000,
      revenueMax: 25000,
      autoSubmitted: 0,
    },
    {
      name: 'Maria Garcia',
      location: 'Miami, FL',
      score: 58,
      priority: 'medium',
      source: 'Nextdoor',
      phone: '(305) 555-0178',
      email: null,
      request: 'Pool deck resurfacing and outdoor lighting. Hurricane damage repair.',
      whyHot: 'Insurance claim likely = guaranteed payment',
      actionRequired: 'Ask about insurance adjuster report',
      postedTime: '2 days ago',
      profileUrl: 'https://nextdoor.com/profile/mgarcia',
      originalPostUrl: 'https://nextdoor.com/post/pool-deck-33139',
      revenueMin: 20000,
      revenueMax: 35000,
      autoSubmitted: 1,
    },
    {
      name: 'Chris Anderson',
      location: 'Nashville, TN',
      score: 52,
      priority: 'medium',
      source: 'Thumbtack',
      phone: null,
      email: 'c.anderson@email.com',
      request: 'Laundry room makeover - new cabinets, countertop, sink. Small space.',
      whyHot: 'Quick turnaround project, good for scheduling gaps',
      actionRequired: 'Request room dimensions and photos',
      postedTime: '2 days ago',
      profileUrl: 'https://thumbtack.com/profile/canderson',
      originalPostUrl: 'https://thumbtack.com/request/laundry-37203',
      revenueMin: 8000,
      revenueMax: 15000,
      autoSubmitted: 0,
    },
  ];

  try {
    await db.insert(leads).values(sampleLeads);
    console.log(`✅ Successfully seeded ${sampleLeads.length} leads!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
  */
}

seed();
