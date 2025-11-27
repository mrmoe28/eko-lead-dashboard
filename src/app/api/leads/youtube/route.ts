import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { desc, eq, and, or, inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';

interface YouTubeLead {
  id: string;
  priority: string;
  score: number;
  source: string;
  name: string;
  location: string;
  message: string;
  profileUrl: string;
  postUrl: string;
  timestamp: string;
  intent: string;
  phone: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    // Query database for YouTube leads that are Hot or Warm
    const youtubeLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.source, 'YouTube'),
          or(
            eq(leads.priority, 'Hot'),
            eq(leads.priority, 'Warm')
          )
        )
      )
      .orderBy(desc(leads.score));

    // Transform database leads to match frontend interface
    const transformedLeads: YouTubeLead[] = youtubeLeads.map(lead => ({
      id: `youtube-${lead.id}`,
      priority: lead.priority,
      score: lead.score,
      source: lead.source,
      name: lead.name,
      location: lead.location,
      message: lead.message || lead.request || '',
      profileUrl: lead.profileUrl || '',
      postUrl: lead.originalPostUrl || '',
      timestamp: lead.postedTime || '',
      intent: lead.intent || '',
      phone: lead.phone || '',
      email: lead.email || '',
    }));

    return NextResponse.json({
      leads: transformedLeads,
      totalCount: transformedLeads.length
    });

  } catch (error) {
    console.error('Error fetching YouTube leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube leads' },
      { status: 500 }
    );
  }
}
