import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, scrapingSessions, scrapingLogs } from '@/lib/db/schema';
import { eq, desc, sql, count, avg, or, and, gte } from 'drizzle-orm';
import { getLLM } from '@/lib/llm/llm-service';
import { analyzeLead, enrichLead, generateResponse } from '@/lib/llm/lead-intelligence';

// System functions the assistant can call
const systemFunctions = {
  get_lead_stats: async () => {
    const totalLeads = await db.select({ count: count() }).from(leads);
    const byPriority = await db
      .select({
        priority: leads.priority,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.priority);
    
    const avgScore = await db.select({ avg: avg(leads.score) }).from(leads);
    const recentLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5);

    return {
      totalLeads: totalLeads[0]?.count || 0,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item.count;
        return acc;
      }, {} as Record<string, number>),
      averageScore: parseFloat(avgScore[0]?.avg || '0'),
      recentLeads: recentLeads.map(l => ({
        id: l.id,
        name: l.name,
        location: l.location,
        score: l.score,
        priority: l.priority,
        source: l.source,
      })),
    };
  },

  get_scraping_sessions: async (params?: { limit?: number; status?: string }) => {
    const limit = params?.limit || 10;
    let query = db
      .select()
      .from(scrapingSessions)
      .orderBy(desc(scrapingSessions.startedAt))
      .limit(limit);

    if (params?.status) {
      query = query.where(eq(scrapingSessions.status, params.status)) as any;
    }

    const sessions = await query;
    return {
      sessions: sessions.map(s => ({
        id: s.id,
        location: s.location,
        status: s.status,
        totalLeadsFound: s.totalLeadsFound,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        sourcesScraped: s.sourcesScraped,
      })),
    };
  },

  start_scraping: async (params: { location: string }) => {
    if (!params.location) {
      throw new Error('Location is required');
    }

    const [session] = await db
      .insert(scrapingSessions)
      .values({
        location: params.location,
        status: 'pending',
        totalLeadsFound: 0,
        sourcesScraped: [],
      })
      .returning();

    return {
      success: true,
      sessionId: session.id,
      message: `Scraping job created for ${params.location}. Waiting for scraper to pick it up...`,
    };
  },

  search_leads: async (params: { query?: string; location?: string; priority?: string; limit?: number }) => {
    const limit = params.limit || 20;
    let queryBuilder = db.select().from(leads).limit(limit);

    const conditions = [];
    if (params.query) {
      const searchPattern = `%${params.query}%`;
      conditions.push(
        or(
          sql`${leads.name}::text ILIKE ${searchPattern}`,
          sql`${leads.request}::text ILIKE ${searchPattern}`,
          sql`${leads.location}::text ILIKE ${searchPattern}`
        )!
      );
    }
    if (params.location) {
      const locationPattern = `%${params.location}%`;
      conditions.push(sql`${leads.location}::text ILIKE ${locationPattern}`);
    }
    if (params.priority) {
      conditions.push(eq(leads.priority, params.priority));
    }

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const results = await queryBuilder.orderBy(desc(leads.score));
    return {
      leads: results.map(l => ({
        id: l.id,
        name: l.name,
        location: l.location,
        score: l.score,
        priority: l.priority,
        source: l.source,
        request: l.request,
        phone: l.phone,
        email: l.email,
      })),
      count: results.length,
    };
  },

  analyze_lead: async (params: { leadId: number }) => {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, params.leadId))
      .limit(1);

    if (!lead) {
      throw new Error('Lead not found');
    }

    const analysis = await analyzeLead({
      name: lead.name,
      location: lead.location,
      request: lead.request,
      message: lead.message || lead.request,
      phone: lead.phone || undefined,
      email: lead.email || undefined,
    });

    // Update lead with analysis
    await db
      .update(leads)
      .set({
        score: analysis.score,
        priority: analysis.priority,
        intent: analysis.intent,
        whyHot: analysis.reasoning,
        actionRequired: analysis.actionRequired,
        revenueMin: analysis.estimatedRevenue.min,
        revenueMax: analysis.estimatedRevenue.max,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, params.leadId));

    return {
      success: true,
      analysis: {
        score: analysis.score,
        priority: analysis.priority,
        intent: analysis.intent,
        reasoning: analysis.reasoning,
        actionRequired: analysis.actionRequired,
        estimatedRevenue: analysis.estimatedRevenue,
      },
    };
  },

  get_analytics: async () => {
    const leadsBySource = await db
      .select({
        source: leads.source,
        totalLeads: count(leads.id),
        avgScore: avg(leads.score),
      })
      .from(leads)
      .groupBy(leads.source);

    const leadsByPriority = await db
      .select({
        priority: leads.priority,
        totalLeads: count(leads.id),
      })
      .from(leads)
      .groupBy(leads.priority);

    const sessionStats = await db
      .select({
        totalSessions: count(scrapingSessions.id),
        completedSessions: sql<number>`count(case when ${scrapingSessions.status} = 'completed' then 1 end)`,
        runningSessions: sql<number>`count(case when ${scrapingSessions.status} = 'running' then 1 end)`,
        avgLeadsPerSession: avg(scrapingSessions.totalLeadsFound),
      })
      .from(scrapingSessions);

    return {
      leadsBySource: leadsBySource.map(s => ({
        source: s.source,
        totalLeads: s.totalLeads,
        avgScore: parseFloat(s.avgScore || '0'),
      })),
      leadsByPriority: leadsByPriority.map(p => ({
        priority: p.priority,
        totalLeads: p.totalLeads,
      })),
      sessionStats: {
        totalSessions: sessionStats[0]?.totalSessions || 0,
        completedSessions: sessionStats[0]?.completedSessions || 0,
        runningSessions: sessionStats[0]?.runningSessions || 0,
        avgLeadsPerSession: parseFloat(sessionStats[0]?.avgLeadsPerSession || '0'),
      },
    };
  },

  get_recent_activity: async (params?: { hours?: number }) => {
    const hours = params?.hours || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentLeads = await db
      .select()
      .from(leads)
      .where(gte(leads.createdAt, since))
      .orderBy(desc(leads.createdAt))
      .limit(10);

    const recentSessions = await db
      .select()
      .from(scrapingSessions)
      .where(gte(scrapingSessions.startedAt, since))
      .orderBy(desc(scrapingSessions.startedAt))
      .limit(5);

    return {
      recentLeads: recentLeads.map(l => ({
        id: l.id,
        name: l.name,
        location: l.location,
        score: l.score,
        priority: l.priority,
        source: l.source,
        createdAt: l.createdAt,
      })),
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        location: s.location,
        status: s.status,
        totalLeadsFound: s.totalLeadsFound,
        startedAt: s.startedAt,
      })),
    };
  },
};

// Function definitions for LLM
const functionDefinitions = [
  {
    name: 'get_lead_stats',
    description: 'Get statistics about leads including total count, breakdown by priority, average score, and recent leads',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_scraping_sessions',
    description: 'Get information about scraping sessions including status, location, and lead counts',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of sessions to return (default: 10)' },
        status: { type: 'string', description: 'Filter by status: pending, running, completed, failed' },
      },
    },
  },
  {
    name: 'start_scraping',
    description: 'Start a new scraping job for a specific location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Location to scrape (e.g., "Atlanta, GA", "Miami, FL")' },
      },
      required: ['location'],
    },
  },
  {
    name: 'search_leads',
    description: 'Search for leads by query, location, or priority',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to match in name, request, or location' },
        location: { type: 'string', description: 'Filter by location' },
        priority: { type: 'string', description: 'Filter by priority: urgent, high, medium, low' },
        limit: { type: 'number', description: 'Maximum number of results (default: 20)' },
      },
    },
  },
  {
    name: 'analyze_lead',
    description: 'Analyze a specific lead using AI to get score, priority, intent, and recommendations',
    parameters: {
      type: 'object',
      properties: {
        leadId: { type: 'number', description: 'The ID of the lead to analyze' },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'get_analytics',
    description: 'Get comprehensive analytics including leads by source, priority breakdown, and session statistics',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_recent_activity',
    description: 'Get recent leads and scraping sessions from the last N hours',
    parameters: {
      type: 'object',
      properties: {
        hours: { type: 'number', description: 'Number of hours to look back (default: 24)' },
      },
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, functionCall } = body;

    // If this is a function call execution
    if (functionCall) {
      const { name, arguments: args } = functionCall;
      
      if (!systemFunctions[name as keyof typeof systemFunctions]) {
        return NextResponse.json(
          { error: `Unknown function: ${name}` },
          { status: 400 }
        );
      }

      try {
        const result = await systemFunctions[name as keyof typeof systemFunctions](args || {});
        return NextResponse.json({
          success: true,
          result,
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Function execution failed' },
          { status: 500 }
        );
      }
    }

    // Regular chat completion with function calling
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get system context
    const leadStats = await systemFunctions.get_lead_stats();
    const recentActivity = await systemFunctions.get_recent_activity({ hours: 24 });

    const systemPrompt = `You are an AI assistant for the EKO Lead Dashboard, a lead generation system for contractors.

Current System Status:
- Total Leads: ${leadStats.totalLeads}
- Average Lead Score: ${leadStats.averageScore.toFixed(1)}/100
- Recent Activity: ${recentActivity.recentLeads.length} new leads in last 24 hours, ${recentActivity.recentSessions.length} scraping sessions

You have access to real-time data about:
- Leads (search, analyze, get statistics)
- Scraping sessions (status, start new jobs)
- Analytics (performance metrics, source quality)

You can perform actions like:
- Starting scraping jobs for locations
- Analyzing leads with AI
- Searching for specific leads
- Getting analytics and statistics

Always provide helpful, actionable responses. When users ask about the system, use the available functions to get current data. When they want to perform actions, use the appropriate functions.

Be conversational but professional. Help users understand their lead generation performance and take actions to improve it.`;

    const llm = getLLM();

    // Prepare messages with system prompt
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    // For OpenAI-compatible APIs with function calling
    // Note: This is a simplified version - you may need to adjust based on your LLM API
    try {
      const response = await llm.chat(chatMessages, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      return NextResponse.json({
        message: response,
        functions: functionDefinitions,
      });
    } catch (error: any) {
      console.error('LLM chat error:', error);
      
      // Fallback: Try direct API call to Vercel LLM app
      const LLM_CHAT_URL = process.env.LLM_CHAT_URL || process.env.LLM_BASE_URL?.replace('/v1', '') || '';
      
      if (LLM_CHAT_URL) {
        try {
          const vercelResponse = await fetch(`${LLM_CHAT_URL}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.LLM_CHAT_API_KEY && {
                'Authorization': `Bearer ${process.env.LLM_CHAT_API_KEY}`,
              }),
            },
            body: JSON.stringify({
              messages: chatMessages,
              systemContext: {
                leadStats,
                recentActivity,
                availableFunctions: functionDefinitions,
              },
            }),
          });

          if (vercelResponse.ok) {
            const data = await vercelResponse.json();
            return NextResponse.json({
              message: data.message || data.content || data.response,
              functions: functionDefinitions,
            });
          }
        } catch (vercelError) {
          console.error('Vercel LLM fallback error:', vercelError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to get AI response', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

