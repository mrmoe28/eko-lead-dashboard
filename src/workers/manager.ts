import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { db } from '@/lib/db';
import { workerInstances } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Worker Manager Configuration
 */
interface ManagerConfig {
  numWorkers: number;
  healthCheckInterval: number; // ms
  workerTimeout: number; // ms
  autoRestart: boolean;
}

const DEFAULT_CONFIG: ManagerConfig = {
  numWorkers: 3,
  healthCheckInterval: 60000, // 1 minute
  workerTimeout: 120000, // 2 minutes
  autoRestart: true,
};

/**
 * Worker Manager
 * Spawns, monitors, and manages worker processes
 */
export class WorkerManager {
  private config: ManagerConfig;
  private workers: Map<string, ChildProcess> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: Partial<ManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the worker manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Manager] Already running');
      return;
    }

    console.log('[Manager] Starting worker manager...');
    console.log(`[Manager] Configuration:`, this.config);

    this.isRunning = true;

    // Clean up stale worker records
    await this.cleanupStaleWorkers();

    // Spawn workers
    for (let i = 0; i < this.config.numWorkers; i++) {
      await this.spawnWorker(i);
      await this.sleep(1000); // Stagger worker startup
    }

    // Start health checks
    this.startHealthChecks();

    console.log(`[Manager] Started with ${this.config.numWorkers} workers`);
  }

  /**
   * Stop the worker manager
   */
  async stop(): Promise<void> {
    console.log('[Manager] Stopping worker manager...');
    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all workers
    const stopPromises = Array.from(this.workers.entries()).map(([id, worker]) =>
      this.stopWorker(id, worker)
    );

    await Promise.all(stopPromises);

    console.log('[Manager] Stopped');
  }

  /**
   * Spawn a new worker process
   */
  private async spawnWorker(index: number): Promise<void> {
    const workerScript = path.join(__dirname, 'scraper-worker.ts');

    console.log(`[Manager] Spawning worker #${index}...`);

    const worker = spawn('tsx', [workerScript], {
      stdio: 'inherit',
      env: { ...process.env, WORKER_INDEX: index.toString() },
    });

    const workerId = `worker-${index}-${Date.now()}`;
    this.workers.set(workerId, worker);

    // Handle worker exit
    worker.on('exit', (code, signal) => {
      console.log(`[Manager] Worker ${workerId} exited with code ${code}, signal ${signal}`);
      this.workers.delete(workerId);

      // Auto-restart if enabled
      if (this.config.autoRestart && this.isRunning) {
        console.log(`[Manager] Auto-restarting worker #${index}...`);
        setTimeout(() => this.spawnWorker(index), 5000); // Wait 5s before restart
      }
    });

    // Handle worker errors
    worker.on('error', (error) => {
      console.error(`[Manager] Worker ${workerId} error:`, error);
    });
  }

  /**
   * Stop a specific worker
   */
  private async stopWorker(workerId: string, worker: ChildProcess): Promise<void> {
    console.log(`[Manager] Stopping worker ${workerId}...`);

    return new Promise((resolve) => {
      worker.on('exit', () => {
        this.workers.delete(workerId);
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      worker.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (this.workers.has(workerId)) {
          console.log(`[Manager] Force killing worker ${workerId}`);
          worker.kill('SIGKILL');
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all workers
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - this.config.workerTimeout);

      // Find workers that haven't sent heartbeat recently
      const staleWorkers = await db
        .select()
        .from(workerInstances)
        .where(
          and(
            eq(workerInstances.status, 'running'),
            lt(workerInstances.lastHeartbeat, timeoutThreshold)
          )
        );

      for (const worker of staleWorkers) {
        console.warn(`[Manager] Worker ${worker.workerId} appears crashed (no heartbeat)`);

        // Mark as crashed
        await db
          .update(workerInstances)
          .set({
            status: 'crashed',
            stoppedAt: new Date(),
          })
          .where(eq(workerInstances.workerId, worker.workerId));

        // If it was processing a job, fail it
        if (worker.currentJobId) {
          console.warn(`[Manager] Failing job ${worker.currentJobId} from crashed worker`);
          // Job queue will handle retry logic
        }
      }

      // Check if we need to spawn more workers
      const activeCount = this.workers.size;
      if (activeCount < this.config.numWorkers) {
        const needed = this.config.numWorkers - activeCount;
        console.log(`[Manager] Spawning ${needed} replacement workers...`);

        for (let i = 0; i < needed; i++) {
          await this.spawnWorker(activeCount + i);
          await this.sleep(1000);
        }
      }
    } catch (error) {
      console.error('[Manager] Health check failed:', error);
    }
  }

  /**
   * Clean up stale worker records from previous runs
   */
  private async cleanupStaleWorkers(): Promise<void> {
    try {
      await db
        .update(workerInstances)
        .set({
          status: 'stopped',
          stoppedAt: new Date(),
        })
        .where(eq(workerInstances.status, 'running'));

      console.log(`[Manager] Cleaned up stale worker records`);
    } catch (error) {
      console.error('[Manager] Failed to cleanup stale workers:', error);
    }
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeWorkers: this.workers.size,
      targetWorkers: this.config.numWorkers,
      workers: Array.from(this.workers.keys()),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI entry point
if (require.main === module) {
  const manager = new WorkerManager({
    numWorkers: parseInt(process.env.NUM_WORKERS || '3'),
    autoRestart: process.env.AUTO_RESTART !== 'false',
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await manager.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down...');
    await manager.stop();
    process.exit(0);
  });

  // Start manager
  manager.start().catch((error) => {
    console.error('Failed to start manager:', error);
    process.exit(1);
  });
}
