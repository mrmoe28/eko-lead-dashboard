#!/usr/bin/env tsx

/**
 * Start Workers Script
 * Starts the worker manager with configured number of workers
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { WorkerManager } from '../src/workers/manager';

async function main() {
  console.log('='.repeat(50));
  console.log('EKO LEAD GENERATOR - WORKER MANAGER');
  console.log('='.repeat(50));
  console.log();

  const numWorkers = parseInt(process.env.NUM_WORKERS || '3');
  const autoRestart = process.env.AUTO_RESTART !== 'false';

  console.log(`Starting with configuration:`);
  console.log(`  - Workers: ${numWorkers}`);
  console.log(`  - Auto-restart: ${autoRestart}`);
  console.log();

  const manager = new WorkerManager({
    numWorkers,
    autoRestart,
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    console.log('\nSIGTERM received, shutting down gracefully...');
    await manager.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    await manager.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });

  try {
    await manager.start();

    // Display status
    console.log();
    console.log('Worker manager is running!');
    console.log('Press Ctrl+C to stop');
    console.log();

    // Keep process alive
    setInterval(() => {
      const status = manager.getStatus();
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${status.activeWorkers}/${status.targetWorkers} workers active`);
    }, 60000); // Log status every minute
  } catch (error) {
    console.error('Failed to start worker manager:', error);
    process.exit(1);
  }
}

main();
