import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workerInstances, scraperMetrics, proxyPool } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workers/health
 * Get worker health status and metrics
 */
export async function GET() {
  try {
    // Get all workers
    const workers = await db
      .select()
      .from(workerInstances)
      .orderBy(desc(workerInstances.startedAt))
      .limit(20);

    // Get recent metrics (last hour)
    const metrics = await db
      .select()
      .from(scraperMetrics)
      .orderBy(desc(scraperMetrics.timestamp))
      .limit(100);

    // Get proxy pool stats
    const proxies = await db.select().from(proxyPool);

    const proxyStats = {
      total: proxies.length,
      active: proxies.filter(p => p.status === 'active').length,
      failed: proxies.filter(p => p.status === 'failed').length,
      testing: proxies.filter(p => p.status === 'testing').length,
      avgSuccessRate: proxies.length > 0
        ? Math.round(proxies.reduce((sum, p) => sum + (p.successRate || 0), 0) / proxies.length)
        : 0,
    };

    // Calculate worker stats
    const activeWorkers = workers.filter(w =>
      w.status === 'running' || w.status === 'idle'
    ).length;

    const totalJobsProcessed = workers.reduce((sum, w) => sum + w.jobsProcessed, 0);
    const totalErrors = workers.reduce((sum, w) => sum + w.errorsCount, 0);

    // Calculate metrics by source
    const metricsBySource = metrics.reduce((acc: any, metric) => {
      if (!acc[metric.source]) {
        acc[metric.source] = {
          source: metric.source,
          requests: 0,
          successes: 0,
          errors: 0,
          leads: 0,
          avgResponseTime: 0,
        };
      }

      acc[metric.source].requests += metric.requestsCount;
      acc[metric.source].successes += metric.successCount;
      acc[metric.source].errors += metric.errorCount;
      acc[metric.source].leads += metric.leadsFound;

      return acc;
    }, {});

    // Calculate average response time for each source
    Object.keys(metricsBySource).forEach(source => {
      const sourceMetrics = metrics.filter(m => m.source === source);
      const avgResponseTime = sourceMetrics.length > 0
        ? Math.round(
            sourceMetrics.reduce((sum, m) => sum + (m.avgResponseTime || 0), 0) / sourceMetrics.length
          )
        : 0;

      metricsBySource[source].avgResponseTime = avgResponseTime;
      metricsBySource[source].successRate = metricsBySource[source].requests > 0
        ? Math.round((metricsBySource[source].successes / metricsBySource[source].requests) * 100)
        : 0;
    });

    return NextResponse.json({
      workers: workers.map(w => ({
        ...w,
        lastHeartbeat: w.lastHeartbeat?.toISOString(),
        startedAt: w.startedAt.toISOString(),
        stoppedAt: w.stoppedAt?.toISOString(),
      })),
      stats: {
        activeWorkers,
        totalJobsProcessed,
        totalErrors,
        errorRate: totalJobsProcessed > 0
          ? Math.round((totalErrors / totalJobsProcessed) * 100)
          : 0,
      },
      metrics: Object.values(metricsBySource),
      proxyStats,
    });
  } catch (error) {
    console.error('Error fetching worker health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker health' },
      { status: 500 }
    );
  }
}
