import { NextRequest, NextResponse } from 'next/server';
import { analyzeLead, enrichLead, generateResponse } from '@/lib/llm/lead-intelligence';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/analyze
 * Analyze a lead with LLM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, action = 'analyze' } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Fetch lead from database
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Perform requested action
    switch (action) {
      case 'analyze': {
        const analysis = await analyzeLead(lead);

        // Update lead with analysis results
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
          .where(eq(leads.id, leadId));

        return NextResponse.json({
          success: true,
          analysis,
        });
      }

      case 'enrich': {
        const enriched = await enrichLead(lead);

        // Update lead with enriched data
        const updates: any = {
          updatedAt: new Date(),
        };

        if (enriched.phone) updates.phone = enriched.phone;
        if (enriched.email) updates.email = enriched.email;
        if (enriched.address) updates.address = enriched.address;
        if (enriched.systemSize) updates.systemSize = enriched.systemSize;

        await db
          .update(leads)
          .set(updates)
          .where(eq(leads.id, leadId));

        return NextResponse.json({
          success: true,
          enriched,
        });
      }

      case 'generate_response': {
        const response = await generateResponse(lead);

        return NextResponse.json({
          success: true,
          response,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Lead analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lead', details: error.message },
      { status: 500 }
    );
  }
}
