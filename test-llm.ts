#!/usr/bin/env tsx
/**
 * Test LLM Connection
 * Verifies your local LLM is configured correctly
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '.env.local') });

import { getLLM } from './src/lib/llm/llm-service';
import { analyzeLead } from './src/lib/llm/lead-intelligence';

async function testBasicConnection() {
  console.log('🔍 Testing LLM connection...\n');

  const llm = getLLM();

  console.log('Configuration:');
  console.log(`  Provider: ${process.env.LLM_PROVIDER}`);
  console.log(`  Base URL: ${process.env.LLM_BASE_URL}`);
  console.log(`  Model: ${process.env.LLM_MODEL}`);
  console.log(`  Enabled: ${process.env.LLM_ENABLED}\n`);

  try {
    console.log('📤 Sending test prompt...');
    const response = await llm.complete('Say "Hello from Qwen!" in one sentence.');

    console.log('✅ LLM Response:');
    console.log(`   "${response}"\n`);

    // Check metrics
    const metrics = llm.getUsageMetrics();
    if (metrics.length > 0) {
      const latest = metrics[metrics.length - 1];
      console.log('📊 Usage Metrics:');
      console.log(`   Tokens: ${latest.totalTokens}`);
      console.log(`   Cost: $${latest.cost.toFixed(4)} (Free!)\n`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ LLM Connection Failed:');
    console.error(`   ${error.message}\n`);
    return false;
  }
}

async function testLeadAnalysis() {
  console.log('🧠 Testing Lead Analysis...\n');

  const testLead = {
    name: 'John Smith',
    location: 'Atlanta, GA',
    source: 'Building Permits',
    request: 'Installing 10kW solar system on residential property',
    message: 'Looking to install panels ASAP, budget around $25k, want to reduce my $300/month electric bill',
    phone: '404-555-1234',
    email: 'john@example.com',
  };

  console.log('Test Lead:');
  console.log(`  Name: ${testLead.name}`);
  console.log(`  Location: ${testLead.location}`);
  console.log(`  Request: ${testLead.request}`);
  console.log(`  Message: ${testLead.message}\n`);

  try {
    console.log('📤 Analyzing with AI...');
    const analysis = await analyzeLead(testLead);

    console.log('✅ AI Analysis Results:');
    console.log(`   Score: ${analysis.score}/100`);
    console.log(`   Priority: ${analysis.priority.toUpperCase()}`);
    console.log(`   Intent: ${analysis.intent}`);
    console.log(`   Sentiment: ${analysis.sentiment}`);
    console.log(`   Urgency: ${analysis.urgency}`);
    console.log(`   Budget: ${analysis.budget}`);
    console.log(`   Readiness: ${analysis.readiness}`);
    console.log(`   Revenue: $${analysis.estimatedRevenue.min.toLocaleString()} - $${analysis.estimatedRevenue.max.toLocaleString()}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);
    console.log(`   Action: ${analysis.actionRequired}\n`);

    return true;
  } catch (error: any) {
    console.error('❌ Lead Analysis Failed:');
    console.error(`   ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('EKO LEAD GENERATOR - LLM CONNECTION TEST');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Basic connection
  const basicTest = await testBasicConnection();

  if (!basicTest) {
    console.log('⚠️  Basic connection test failed. Please check:');
    console.log('   1. LLM_BASE_URL is correct');
    console.log('   2. LLM_API_KEY is valid');
    console.log('   3. Your LLM server is running');
    console.log('   4. Firewall/network allows connection\n');
    process.exit(1);
  }

  // Test 2: Lead analysis
  console.log('─'.repeat(60));
  const analysisTest = await testLeadAnalysis();

  if (!analysisTest) {
    console.log('⚠️  Lead analysis test failed. This might mean:');
    console.log('   1. LLM model doesn\'t support structured output well');
    console.log('   2. Try lowering LLM_TEMPERATURE to 0.2');
    console.log('   3. Check if model supports JSON formatting\n');
    process.exit(1);
  }

  // Success!
  console.log('='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log();
  console.log('Your LLM is configured correctly and ready to use!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Start workers: npm run workers:dev');
  console.log('  2. Create a scraping job');
  console.log('  3. Watch leads get analyzed automatically!');
  console.log();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
