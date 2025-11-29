import { db } from '@/lib/db';
import { scrapingSessions, scrapingLogs, leads, scraperMetrics } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import type { ScrapingSession } from '@/lib/db/schema';

/**
 * Job Queue Manager
 * Handles fetching, processing, and updating scraping jobs from database
 */
export class JobQueue {
  private processingJobIds = new Set<number>();

  /**
   * Fetch next pending job from database
   */
  async getNextJob(workerId: string): Promise<ScrapingSession | null> {
    try {
      // Find oldest pending job that's not being processed
      const [job] = await db
        .select()
        .from(scrapingSessions)
        .where(
          and(
            eq(scrapingSessions.status, 'pending'),
            // Exclude jobs being processed by other workers
            or(
              isNull(scrapingSessions.workerId),
              eq(scrapingSessions.workerId, ''),
              eq(scrapingSessions.workerId, workerId)
            )
          )
        )
        .orderBy(scrapingSessions.createdAt)
        .limit(1);

      if (!job) {
        return null;
      }

      // Check if already processing
      if (this.processingJobIds.has(job.id)) {
        return null;
      }

      // Claim the job
      await this.claimJob(job.id, workerId);
      this.processingJobIds.add(job.id);

      return job;
    } catch (error) {
      console.error('[JobQueue] Error fetching next job:', error);
      return null;
    }
  }

  /**
   * Claim a job by updating worker ID
   */
  private async claimJob(jobId: number, workerId: string): Promise<void> {
    const timeoutAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute timeout

    await db
      .update(scrapingSessions)
      .set({
        workerId,
        status: 'running',
        startedAt: new Date(),
        timeoutAt,
        updatedAt: new Date(),
      })
      .where(eq(scrapingSessions.id, jobId));
  }

  /**
   * Mark job as completed
   */
  async completeJob(
    jobId: number,
    totalLeads: number,
    sources: string[]
  ): Promise<void> {
    this.processingJobIds.delete(jobId);

    await db
      .update(scrapingSessions)
      .set({
        status: 'completed',
        totalLeadsFound: totalLeads,
        sourcesScraped: sources,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(scrapingSessions.id, jobId));
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: number, errorMessage: string): Promise<void> {
    this.processingJobIds.delete(jobId);

    // Get current retry count
    const [session] = await db
      .select()
      .from(scrapingSessions)
      .where(eq(scrapingSessions.id, jobId));

    if (!session) return;

    const retryCount = session.retryCount + 1;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      // Retry the job
      await db
        .update(scrapingSessions)
        .set({
          status: 'pending',
          retryCount,
          errorMessage,
          workerId: null,
          updatedAt: new Date(),
        })
        .where(eq(scrapingSessions.id, jobId));

      console.log(`[JobQueue] Job ${jobId} will be retried (${retryCount}/${maxRetries})`);
    } else {
      // Max retries reached, mark as failed
      await db
        .update(scrapingSessions)
        .set({
          status: 'failed',
          errorMessage: `${errorMessage} (Max retries reached)`,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(scrapingSessions.id, jobId));

      console.log(`[JobQueue] Job ${jobId} failed after ${maxRetries} retries`);
    }
  }

  /**
   * Add log entry for a job
   */
  async addLog(
    sessionId: number,
    source: string,
    message: string,
    status: 'processing' | 'success' | 'error',
    leadCount = 0
  ): Promise<void> {
    await db.insert(scrapingLogs).values({
      sessionId,
      source,
      message,
      status,
      leadCount,
    });
  }

  /**
   * Save leads to database
   */
  async saveLeads(sessionId: number, leadsData: any[]): Promise<void> {
    if (leadsData.length === 0) return;

    const leadsToInsert = leadsData.map(lead => ({
      ...lead,
      sessionId,
      scrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(leads).values(leadsToInsert);
  }

  /**
   * Record scraper metrics
   */
  async recordMetrics(
    source: string,
    requestsCount: number,
    successCount: number,
    errorCount: number,
    avgResponseTime: number,
    leadsFound: number
  ): Promise<void> {
    await db.insert(scraperMetrics).values({
      source,
      requestsCount,
      successCount,
      errorCount,
      avgResponseTime,
      leadsFound,
      timestamp: new Date(),
    });
  }

  /**
   * Check for timed out jobs
   */
  async checkTimeouts(): Promise<void> {
    const now = new Date();

    const timedOutJobs = await db
      .select()
      .from(scrapingSessions)
      .where(
        and(
          eq(scrapingSessions.status, 'running'),
          // @ts-ignore - timeoutAt comparison
          `timeout_at < ${now.toISOString()}`
        )
      );

    for (const job of timedOutJobs) {
      await this.failJob(job.id, 'Job timed out');
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const [pending] = await db
      .select()
      .from(scrapingSessions)
      .where(eq(scrapingSessions.status, 'pending'));

    const [running] = await db
      .select()
      .from(scrapingSessions)
      .where(eq(scrapingSessions.status, 'running'));

    return {
      pending: pending ? 1 : 0,
      running: running ? 1 : 0,
      processing: this.processingJobIds.size,
    };
  }
}
