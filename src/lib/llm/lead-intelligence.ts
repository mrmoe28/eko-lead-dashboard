/**
 * Lead Intelligence
 * LLM-powered lead analysis, scoring, and enrichment
 */

import { getLLM } from './llm-service';
import type { ScrapedLead } from '../scraper-config';

/**
 * Lead Analysis Result
 */
export interface LeadAnalysis {
  score: number; // 0-100
  priority: 'urgent' | 'high' | 'medium' | 'low';
  intent: string; // What the lead wants
  sentiment: 'hot' | 'warm' | 'cold';
  urgency: 'immediate' | 'soon' | 'flexible' | 'unknown';
  budget: 'high' | 'medium' | 'low' | 'unknown';
  readiness: 'ready' | 'researching' | 'considering' | 'unknown';
  reasoning: string; // Why this score/priority
  actionRequired: string; // Next steps
  estimatedRevenue: { min: number; max: number };
}

/**
 * Enriched Lead Data
 */
export interface EnrichedLead {
  // Contact info
  name?: string;
  phone?: string;
  email?: string;
  address?: string;

  // Solar-specific
  systemSize?: string;
  roofType?: string;
  shadingIssues?: boolean;
  currentUtilityBill?: number;
  timeline?: string;

  // Business context
  homeOwnership?: 'owner' | 'renter' | 'unknown';
  propertyType?: 'residential' | 'commercial' | 'unknown';
  decisionMaker?: boolean;
}

/**
 * Analyze lead with LLM
 */
export async function analyzeLead(lead: Partial<ScrapedLead>): Promise<LeadAnalysis> {
  const llm = getLLM();

  const prompt = `Analyze this solar lead and provide a structured assessment:

LEAD DATA:
Name: ${lead.name || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Source: ${lead.source || 'Unknown'}
Request: ${lead.request || 'No details'}
Message: ${lead.message || 'None'}
Posted: ${lead.postedTime || 'Unknown'}
Contact: ${lead.phone ? 'Has phone' : 'No phone'}, ${lead.email ? 'Has email' : 'No email'}

Analyze this lead and provide:
1. Lead score (0-100): Overall quality and likelihood to convert
2. Priority level: urgent/high/medium/low
3. Intent: What exactly they want (be specific)
4. Sentiment: hot/warm/cold
5. Urgency: immediate/soon/flexible/unknown
6. Budget estimate: high/medium/low/unknown
7. Readiness: ready/researching/considering/unknown
8. Reasoning: Why you assigned this score/priority (2-3 sentences)
9. Action required: Specific next steps for the sales team
10. Estimated revenue: Min and max revenue potential in dollars

Focus on solar installation signals like:
- Mentions of roof, panels, system size, electricity bills
- Timeline urgency
- Budget indicators
- Decision-making authority
- Property ownership`;

  const schema = `{
  "score": number (0-100),
  "priority": "urgent" | "high" | "medium" | "low",
  "intent": string,
  "sentiment": "hot" | "warm" | "cold",
  "urgency": "immediate" | "soon" | "flexible" | "unknown",
  "budget": "high" | "medium" | "low" | "unknown",
  "readiness": "ready" | "researching" | "considering" | "unknown",
  "reasoning": string,
  "actionRequired": string,
  "estimatedRevenue": { "min": number, "max": number }
}`;

  try {
    const analysis = await llm.extractJSON<LeadAnalysis>(prompt, schema, {
      temperature: 0.3, // Lower temperature for more consistent scoring
      maxTokens: 500,
    });

    return analysis;
  } catch (error) {
    console.error('[LeadIntelligence] Analysis failed:', error);

    // Return default analysis on error
    return {
      score: 50,
      priority: 'medium',
      intent: 'Unknown - analysis failed',
      sentiment: 'warm',
      urgency: 'unknown',
      budget: 'unknown',
      readiness: 'unknown',
      reasoning: 'Automated analysis unavailable',
      actionRequired: 'Manual review required',
      estimatedRevenue: { min: 5000, max: 25000 },
    };
  }
}

/**
 * Enrich lead data by extracting structured information
 */
export async function enrichLead(lead: Partial<ScrapedLead>): Promise<EnrichedLead> {
  const llm = getLLM();

  const prompt = `Extract structured information from this lead data:

LEAD DATA:
Name: ${lead.name || 'Unknown'}
Request: ${lead.request || ''}
Message: ${lead.message || ''}
Address: ${lead.address || ''}
Location: ${lead.location || ''}

Extract any available information about:
- Contact details (phone, email if not already captured)
- Full address
- System size preferences (in kW)
- Roof type (asphalt, metal, tile, etc.)
- Shading issues mentioned
- Current utility bill amount
- Timeline/urgency
- Home ownership status
- Property type
- Whether they are the decision maker

Only include fields where you found actual information. Use null for missing data.`;

  const schema = `{
  "name": string | null,
  "phone": string | null,
  "email": string | null,
  "address": string | null,
  "systemSize": string | null,
  "roofType": string | null,
  "shadingIssues": boolean | null,
  "currentUtilityBill": number | null,
  "timeline": string | null,
  "homeOwnership": "owner" | "renter" | "unknown",
  "propertyType": "residential" | "commercial" | "unknown",
  "decisionMaker": boolean | null
}`;

  try {
    const enriched = await llm.extractJSON<EnrichedLead>(prompt, schema, {
      temperature: 0.2, // Very low for data extraction
      maxTokens: 300,
    });

    return enriched;
  } catch (error) {
    console.error('[LeadIntelligence] Enrichment failed:', error);
    return {};
  }
}

/**
 * Generate personalized response to lead
 */
export async function generateResponse(
  lead: Partial<ScrapedLead>,
  context?: string
): Promise<string> {
  const llm = getLLM();

  const prompt = `Generate a personalized response to this solar lead:

LEAD:
Name: ${lead.name || 'there'}
Request: ${lead.request || 'Inquiry about solar'}
Message: ${lead.message || 'None'}
Source: ${lead.source || 'Unknown'}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}

Write a friendly, professional response that:
1. Acknowledges their specific needs/questions
2. Provides helpful information about solar installation
3. Mentions relevant benefits based on their situation
4. Includes a clear call-to-action
5. Keeps it conversational (2-3 paragraphs max)
6. Signs off professionally

Tone: Helpful, knowledgeable, not pushy`;

  try {
    const response = await llm.complete(prompt, {
      temperature: 0.8, // Higher for more creative responses
      maxTokens: 400,
    });

    return response;
  } catch (error) {
    console.error('[LeadIntelligence] Response generation failed:', error);
    return `Hi ${lead.name || 'there'},\n\nThank you for your interest in solar! I'd love to help you explore your options. Could we schedule a quick call to discuss your specific needs?\n\nBest regards,\nEKO Solar Team`;
  }
}

/**
 * Classify lead source reliability
 */
export async function classifySource(
  source: string,
  sampleLeads: string[]
): Promise<{
  quality: 'high' | 'medium' | 'low';
  reliability: number; // 0-100
  reasoning: string;
}> {
  const llm = getLLM();

  const prompt = `Analyze this lead source quality:

SOURCE: ${source}
SAMPLE LEADS (last 5):
${sampleLeads.map((lead, i) => `${i + 1}. ${lead}`).join('\n')}

Rate the source quality based on:
- Lead information completeness
- Contact info availability
- Intent clarity
- Conversion likelihood
- Data accuracy

Provide:
1. Quality level: high/medium/low
2. Reliability score: 0-100
3. Reasoning: Why you rated it this way (2-3 sentences)`;

  const schema = `{
  "quality": "high" | "medium" | "low",
  "reliability": number,
  "reasoning": string
}`;

  try {
    return await llm.extractJSON(prompt, schema, {
      temperature: 0.3,
      maxTokens: 200,
    });
  } catch (error) {
    console.error('[LeadIntelligence] Source classification failed:', error);
    return {
      quality: 'medium',
      reliability: 50,
      reasoning: 'Analysis unavailable',
    };
  }
}

/**
 * Batch analyze multiple leads (more efficient)
 */
export async function batchAnalyzeLeads(
  leads: Partial<ScrapedLead>[],
  maxLeads = 10
): Promise<Map<number, LeadAnalysis>> {
  const results = new Map<number, LeadAnalysis>();

  // Process in chunks to avoid overwhelming LLM
  const chunks: Array<Partial<ScrapedLead>[]> = [];
  for (let i = 0; i < Math.min(leads.length, maxLeads); i += 5) {
    chunks.push(leads.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const analyses = await Promise.all(
      chunk.map(lead => analyzeLead(lead))
    );

    analyses.forEach((analysis, idx) => {
      const leadIdx = chunks.indexOf(chunk) * 5 + idx;
      results.set(leadIdx, analysis);
    });
  }

  return results;
}
