import { db } from './index';
import { leads } from './schema';

/**
 * Clear All Leads from Database
 * 
 * WARNING: This will delete ALL leads from the database.
 * Use this to remove demo/test data before starting with real scraper data.
 * 
 * Usage: npx tsx src/lib/db/clear-leads.ts
 */

async function clearLeads() {
  console.log('⚠️  WARNING: This will delete ALL leads from the database.');
  console.log('');
  
  try {
    const result = await db.delete(leads);
    console.log('✅ All leads deleted successfully!');
    console.log('');
    console.log('To add real leads, run the scraper:');
    console.log('  cd solar-data-extractor');
    console.log('  node scrape-leads.js Georgia');
  } catch (error) {
    console.error('❌ Error clearing leads:', error);
    throw error;
  }

  process.exit(0);
}

clearLeads();
