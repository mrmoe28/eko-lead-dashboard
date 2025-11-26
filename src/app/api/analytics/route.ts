import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, scrapingSessions, scrapingLogs } from "@/lib/db/schema";
import { sql, count, avg, desc } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Leads by Source
    const leadsBySource = await db
      .select({
        source: leads.source,
        totalLeads: count(leads.id),
        avgScore: avg(leads.score),
      })
      .from(leads)
      .groupBy(leads.source)
      .orderBy(desc(count(leads.id)));

    // 2. Leads by Priority
    const leadsByPriority = await db
      .select({
        priority: leads.priority,
        totalLeads: count(leads.id),
      })
      .from(leads)
      .groupBy(leads.priority);

    // 3. Session Performance
    const sessionStats = await db
      .select({
        totalSessions: count(scrapingSessions.id),
        completedSessions: sql<number>`count(case when ${scrapingSessions.status} = 'completed' then 1 end)`,
        failedSessions: sql<number>`count(case when ${scrapingSessions.status} = 'failed' then 1 end)`,
        avgLeadsPerSession: avg(scrapingSessions.totalLeadsFound),
      })
      .from(scrapingSessions);

    // 4. Recent Sessions with Lead Counts
    const recentSessions = await db
      .select({
        id: scrapingSessions.id,
        location: scrapingSessions.location,
        totalLeadsFound: scrapingSessions.totalLeadsFound,
        startedAt: scrapingSessions.startedAt,
        completedAt: scrapingSessions.completedAt,
        status: scrapingSessions.status,
      })
      .from(scrapingSessions)
      .orderBy(desc(scrapingSessions.startedAt))
      .limit(10);

    // 5. Top Performing Sources (by quality)
    const sourceQuality = await db
      .select({
        source: leads.source,
        totalLeads: count(leads.id),
        avgScore: avg(leads.score),
        hotLeads: sql<number>`count(case when ${leads.priority} = 'Hot' then 1 end)`,
        warmLeads: sql<number>`count(case when ${leads.priority} = 'Warm' then 1 end)`,
        coldLeads: sql<number>`count(case when ${leads.priority} = 'Cold' then 1 end)`,
      })
      .from(leads)
      .groupBy(leads.source)
      .orderBy(desc(avg(leads.score)));

    // 6. Leads Over Time (last 30 days)
    const leadsOverTime = await db
      .select({
        date: sql<string>`DATE(${leads.createdAt})`,
        totalLeads: count(leads.id),
        hotLeads: sql<number>`count(case when ${leads.priority} = 'Hot' then 1 end)`,
      })
      .from(leads)
      .where(sql`${leads.createdAt} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    // 7. Contact Info Availability
    const contactStats = await db
      .select({
        withPhone: sql<number>`count(case when ${leads.phone} is not null and ${leads.phone} != '' then 1 end)`,
        withEmail: sql<number>`count(case when ${leads.email} is not null and ${leads.email} != '' then 1 end)`,
        withBoth: sql<number>`count(case when (${leads.phone} is not null and ${leads.phone} != '') and (${leads.email} is not null and ${leads.email} != '') then 1 end)`,
        noContact: sql<number>`count(case when (${leads.phone} is null or ${leads.phone} = '') and (${leads.email} is null or ${leads.email} = '') then 1 end)`,
      })
      .from(leads);

    // 8. Generate AI Insights
    const insights = generateInsights({
      leadsBySource,
      sourceQuality,
      sessionStats: sessionStats[0],
      contactStats: contactStats[0],
    });

    return NextResponse.json({
      leadsBySource,
      leadsByPriority,
      sessionStats: sessionStats[0],
      recentSessions,
      sourceQuality,
      leadsOverTime,
      contactStats: contactStats[0],
      insights,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// AI-powered insights generator
function generateInsights(data: any) {
  const insights: Array<{
    type: "success" | "warning" | "info" | "danger";
    title: string;
    description: string;
    recommendation: string;
  }> = [];

  // Analyze source performance
  const topSource = data.sourceQuality[0];
  if (topSource) {
    const avgScore = parseFloat(topSource.avgScore || "0");
    if (avgScore > 60) {
      insights.push({
        type: "success",
        title: `${topSource.source} is your best source`,
        description: `Average lead score of ${avgScore.toFixed(1)} with ${topSource.hotLeads} hot leads.`,
        recommendation: `Increase scraping frequency for ${topSource.source} to maximize high-quality leads.`,
      });
    }
  }

  // Check for low-performing sources
  const lowPerformers = data.sourceQuality.filter(
    (s: any) => parseFloat(s.avgScore || "0") < 30
  );
  if (lowPerformers.length > 0) {
    insights.push({
      type: "warning",
      title: "Low-performing sources detected",
      description: `${lowPerformers.map((s: any) => s.source).join(", ")} have low average scores.`,
      recommendation: "Consider reducing resources allocated to these sources or refining filters.",
    });
  }

  // Contact info availability
  const contactRate = data.contactStats.withPhone + data.contactStats.withEmail;
  const totalLeads = contactRate + data.contactStats.noContact;
  const contactPercentage = totalLeads > 0 ? (contactRate / totalLeads) * 100 : 0;

  if (contactPercentage < 50) {
    insights.push({
      type: "danger",
      title: "Low contact information rate",
      description: `Only ${contactPercentage.toFixed(1)}% of leads have contact info.`,
      recommendation: "Focus on sources that provide direct contact information (phone or email).",
    });
  } else if (contactPercentage > 75) {
    insights.push({
      type: "success",
      title: "Excellent contact information rate",
      description: `${contactPercentage.toFixed(1)}% of leads have contact info.`,
      recommendation: "Current sources are providing actionable leads. Maintain strategy.",
    });
  }

  // Session success rate
  const totalSessions = parseInt(data.sessionStats.totalSessions || "0");
  const completedSessions = parseInt(data.sessionStats.completedSessions || "0");
  const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  if (successRate < 80 && totalSessions > 5) {
    insights.push({
      type: "warning",
      title: "Scraping reliability issues",
      description: `Only ${successRate.toFixed(1)}% of sessions complete successfully.`,
      recommendation: "Review error logs and consider adding retry logic or fixing source integrations.",
    });
  }

  // Diversification check
  if (data.leadsBySource.length < 3) {
    insights.push({
      type: "info",
      title: "Limited source diversity",
      description: "You're only using a few lead sources.",
      recommendation: "Consider enabling more scrapers (Twitter, Quora, etc.) to diversify lead pipeline.",
    });
  }

  // Volume check
  const totalLeadsCount = data.leadsBySource.reduce(
    (sum: number, s: any) => sum + parseInt(s.totalLeads || "0"),
    0
  );
  const avgLeadsPerSession = parseFloat(data.sessionStats.avgLeadsPerSession || "0");

  if (avgLeadsPerSession < 5 && totalSessions > 3) {
    insights.push({
      type: "warning",
      title: "Low lead volume per session",
      description: `Averaging only ${avgLeadsPerSession.toFixed(1)} leads per session.`,
      recommendation: "Expand search criteria or add more geographic locations to increase volume.",
    });
  }

  return insights;
}
