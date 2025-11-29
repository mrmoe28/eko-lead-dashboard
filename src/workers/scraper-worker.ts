import { v4 as uuidv4 } from 'uuid';
import { JobQueue } from './queue/job-queue';
import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { PermitsScraper } from './scrapers/permits.scraper';
import { db } from '@/lib/db';
import { workerInstances, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { analyzeLead, enrichLead } from '@/lib/llm/lead-intelligence';

/**
 * Scraper Worker Process
 * Polls for jobs and executes scrapers
 */
export class ScraperWorker {
  private workerId: string;
  private queue: JobQueue;
  private isRunning = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private jobCheckInterval?: NodeJS.Timeout;
  private scrapers: Map<string, BaseScraper>;
  private jobsProcessed = 0;
  private errorsCount = 0;

  constructor() {
    this.workerId = `worker-${uuidv4().slice(0, 8)}`;
    this.queue = new JobQueue();
    this.scrapers = this.initializeScrapers();
  }

  /**
   * Initialize available scrapers
   */
  private initializeScrapers(): Map<string, BaseScraper> {
    const scrapers = new Map<string, BaseScraper>();

    // Register scrapers
    scrapers.set('permits', new PermitsScraper());
    // Add more scrapers here as they're implemented
    // scrapers.set('reddit', new RedditScraper());
    // scrapers.set('yelp', new YelpScraper());

    return scrapers;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`[Worker ${this.workerId}] Already running`);
      return;
    }

    console.log(`[Worker ${this.workerId}] Starting...`);
    this.isRunning = true;

    // Register worker in database
    await this.registerWorker();

    // Start heartbeat
    this.startHeartbeat();

    // Start job polling
    this.startJobPolling();

    console.log(`[Worker ${this.workerId}] Started successfully`);
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    console.log(`[Worker ${this.workerId}] Stopping...`);
    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.jobCheckInterval) {
      clearInterval(this.jobCheckInterval);
    }

    // Update worker status
    await db
      .update(workerInstances)
      .set({
        status: 'stopped',
        stoppedAt: new Date(),
      })
      .where(eq(workerInstances.workerId, this.workerId));

    console.log(`[Worker ${this.workerId}] Stopped`);
  }

  /**
   * Register worker in database
   */
  private async registerWorker(): Promise<void> {
    await db.insert(workerInstances).values({
      workerId: this.workerId,
      status: 'idle',
      lastHeartbeat: new Date(),
      jobsProcessed: 0,
      errorsCount: 0,
    });
  }

  /**
   * Start heartbeat updates
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await db
          .update(workerInstances)
          .set({
            lastHeartbeat: new Date(),
            jobsProcessed: this.jobsProcessed,
            errorsCount: this.errorsCount,
          })
          .where(eq(workerInstances.workerId, this.workerId));
      } catch (error) {
        console.error(`[Worker ${this.workerId}] Heartbeat failed:`, error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start polling for jobs
   */
  private startJobPolling(): void {
    this.jobCheckInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.processNextJob();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process next job from queue
   */
  private async processNextJob(): Promise<void> {
    try {
      const job = await this.queue.getNextJob(this.workerId);

      if (!job) {
        // No jobs available, set status to idle
        await db
          .update(workerInstances)
          .set({ status: 'idle', currentJobId: null })
          .where(eq(workerInstances.workerId, this.workerId));
        return;
      }

      console.log(`[Worker ${this.workerId}] Processing job #${job.id} for ${job.location}`);

      // Update worker status
      await db
        .update(workerInstances)
        .set({ status: 'running', currentJobId: job.id })
        .where(eq(workerInstances.workerId, this.workerId));

      // Add initial log
      await this.queue.addLog(
        job.id,
        'Worker',
        `Job assigned to worker ${this.workerId}`,
        'processing'
      );

      // Execute scraping
      await this.executeJob(job);

      this.jobsProcessed++;
    } catch (error: any) {
      console.error(`[Worker ${this.workerId}] Error processing job:`, error);
      this.errorsCount++;
    }
  }

  /**
   * Execute scraping job
   */
  private async executeJob(job: any): Promise<void> {
    const allLeads: any[] = [];
    const sourcesScraped: string[] = [];

    try {
      // Get enabled scrapers (for now, just use permits)
      const scrapersToRun = ['permits']; // In production, this would come from job config

      for (const scraperKey of scrapersToRun) {
        const scraper = this.scrapers.get(scraperKey);

        if (!scraper) {
          console.warn(`[Worker ${this.workerId}] Scraper not found: ${scraperKey}`);
          continue;
        }

        try {
          // Add log
          await this.queue.addLog(
            job.id,
            scraper['source'],
            `Starting scraper...`,
            'processing'
          );

          // Execute scraper
          const result = await scraper.execute(job.location);

          // Save leads
          if (result.leads.length > 0) {
            await this.queue.saveLeads(job.id, result.leads);
            allLeads.push(...result.leads);

            // LLM Analysis: Analyze and enrich leads if enabled
            if (process.env.LLM_ENABLED === 'true') {
              await this.analyzeLeadsWithLLM(job.id, result.leads);
            }
          }

          // Record metrics (avoid division by zero)
          const avgResponseTime = result.requestsMade > 0 
            ? Math.floor(result.duration / result.requestsMade) 
            : 0;
          
          await this.queue.recordMetrics(
            result.source,
            result.requestsMade,
            Math.floor((result.successRate / 100) * result.requestsMade),
            result.errors.length,
            avgResponseTime,
            result.totalLeads
          );

          // Add success log
          await this.queue.addLog(
            job.id,
            result.source,
            `Completed: ${result.totalLeads} leads found`,
            'success',
            result.totalLeads
          );

          sourcesScraped.push(result.source);
        } catch (error: any) {
          console.error(`[Worker ${this.workerId}] Scraper ${scraperKey} failed:`, error);

          // Add error log
          await this.queue.addLog(
            job.id,
            scraper['source'] || scraperKey,
            `Error: ${error.message}`,
            'error'
          );
        }
      }

      // Mark job as completed
      await this.queue.completeJob(job.id, allLeads.length, sourcesScraped);

      console.log(
        `[Worker ${this.workerId}] Job #${job.id} completed: ${allLeads.length} total leads from ${sourcesScraped.length} sources`
      );
    } catch (error: any) {
      console.error(`[Worker ${this.workerId}] Job execution failed:`, error);
      await this.queue.failJob(job.id, error.message);
    }
  }

  /**
   * Analyze and enrich leads with LLM
   */
  private async analyzeLeadsWithLLM(jobId: number, leadsData: any[]): Promise<void> {
    try {
      await this.queue.addLog(
        jobId,
        'LLM',
        `Analyzing ${leadsData.length} leads with AI...`,
        'processing'
      );

      let analyzed = 0;
      let enriched = 0;

      // Process leads (limit to first 10 to avoid overwhelming LLM)
      const leadsToProcess = leadsData.slice(0, 10);

      for (const leadData of leadsToProcess) {
        try {
          // Analyze lead
          const analysis = await analyzeLead(leadData);

          // Enrich lead
          const enrichment = await enrichLead(leadData);

          // Update lead in database with analysis results
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
              // Add enriched data if available
              ...(enrichment.phone && { phone: enrichment.phone }),
              ...(enrichment.email && { email: enrichment.email }),
              ...(enrichment.systemSize && { systemSize: enrichment.systemSize }),
              updatedAt: new Date(),
            })
            .where(eq(leads.name, leadData.name)); // Match by name (temp solution)

          analyzed++;
          if (Object.keys(enrichment).length > 0) enriched++;
        } catch (error: any) {
          console.error(`[Worker ${this.workerId}] LLM analysis failed for lead:`, error.message);
        }
      }

      await this.queue.addLog(
        jobId,
        'LLM',
        `AI analysis complete: ${analyzed} analyzed, ${enriched} enriched`,
        'success'
      );
    } catch (error: any) {
      console.error(`[Worker ${this.workerId}] LLM batch analysis failed:`, error);
      await this.queue.addLog(
        jobId,
        'LLM',
        `AI analysis error: ${error.message}`,
        'error'
      );
    }
  }

  /**
   * Get worker ID
   */
  getWorkerId(): string {
    return this.workerId;
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// CLI entry point
if (require.main === module) {
  const worker = new ScraperWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  // Start worker
  worker.start().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}
