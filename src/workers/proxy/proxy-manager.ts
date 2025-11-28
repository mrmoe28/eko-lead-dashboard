import { db } from '@/lib/db';
import { proxyPool } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import axios, { AxiosProxyConfig } from 'axios';

/**
 * Proxy Manager
 * Manages proxy pool with health checking and rotation
 */
export class ProxyManager {
  private healthCheckInterval?: NodeJS.Timeout;
  private healthCheckRunning = false;

  /**
   * Get next available proxy
   */
  async getProxy(): Promise<string | null> {
    try {
      // Get active proxies ordered by success rate
      const [proxy] = await db
        .select()
        .from(proxyPool)
        .where(eq(proxyPool.status, 'active'))
        .orderBy(proxyPool.successRate)
        .limit(1);

      if (!proxy) {
        console.warn('[ProxyManager] No active proxies available');
        return null;
      }

      // Update last used timestamp
      await db
        .update(proxyPool)
        .set({ lastUsed: new Date() })
        .where(eq(proxyPool.id, proxy.id));

      return proxy.proxyUrl;
    } catch (error) {
      console.error('[ProxyManager] Error getting proxy:', error);
      return null;
    }
  }

  /**
   * Record proxy usage result
   */
  async recordUsage(
    proxyUrl: string,
    success: boolean,
    responseTime?: number
  ): Promise<void> {
    try {
      const [proxy] = await db
        .select()
        .from(proxyPool)
        .where(eq(proxyPool.proxyUrl, proxyUrl));

      if (!proxy) return;

      // Calculate new success rate (moving average)
      const weight = 0.1; // Weight for new data point
      const currentRate = proxy.successRate || 0;
      const newSuccessRate = success
        ? currentRate + weight * (100 - currentRate)
        : currentRate - weight * currentRate;

      // Calculate new average response time
      const newAvgResponseTime = responseTime && proxy.avgResponseTime
        ? Math.floor((proxy.avgResponseTime * 0.9) + (responseTime * 0.1))
        : responseTime || proxy.avgResponseTime;

      const updates: any = {
        successRate: Math.max(0, Math.min(100, newSuccessRate)),
        lastUsed: new Date(),
      };

      if (responseTime) {
        updates.avgResponseTime = newAvgResponseTime;
      }

      if (!success) {
        updates.failuresCount = proxy.failuresCount + 1;

        // Mark as failed if too many consecutive failures
        if (proxy.failuresCount + 1 >= 5) {
          updates.status = 'failed';
          console.warn(`[ProxyManager] Proxy ${proxyUrl} marked as failed (5 failures)`);
        }
      }

      await db
        .update(proxyPool)
        .set(updates)
        .where(eq(proxyPool.id, proxy.id));
    } catch (error) {
      console.error('[ProxyManager] Error recording usage:', error);
    }
  }

  /**
   * Add proxy to pool
   */
  async addProxy(proxyUrl: string): Promise<void> {
    try {
      // Check if proxy already exists
      const [existing] = await db
        .select()
        .from(proxyPool)
        .where(eq(proxyPool.proxyUrl, proxyUrl));

      if (existing) {
        console.log(`[ProxyManager] Proxy already exists: ${proxyUrl}`);
        return;
      }

      // Test proxy before adding
      const isHealthy = await this.testProxy(proxyUrl);

      await db.insert(proxyPool).values({
        proxyUrl,
        status: isHealthy ? 'active' : 'testing',
        successRate: isHealthy ? 100 : 0,
        lastHealthCheck: new Date(),
        failuresCount: isHealthy ? 0 : 1,
      });

      console.log(`[ProxyManager] Added proxy: ${proxyUrl} (${isHealthy ? 'active' : 'testing'})`);
    } catch (error) {
      console.error('[ProxyManager] Error adding proxy:', error);
    }
  }

  /**
   * Remove proxy from pool
   */
  async removeProxy(proxyUrl: string): Promise<void> {
    try {
      await db
        .delete(proxyPool)
        .where(eq(proxyPool.proxyUrl, proxyUrl));

      console.log(`[ProxyManager] Removed proxy: ${proxyUrl}`);
    } catch (error) {
      console.error('[ProxyManager] Error removing proxy:', error);
    }
  }

  /**
   * Test if proxy is working
   */
  private async testProxy(proxyUrl: string): Promise<boolean> {
    try {
      const proxyConfig = this.parseProxyUrl(proxyUrl);

      const response = await axios.get('https://httpbin.org/ip', {
        proxy: proxyConfig,
        timeout: 10000,
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse proxy URL to axios proxy config
   */
  private parseProxyUrl(proxyUrl: string): AxiosProxyConfig {
    const url = new URL(proxyUrl);

    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port),
      auth: url.username && url.password ? {
        username: url.username,
        password: url.password,
      } : undefined,
    };
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs = 300000): void {
    if (this.healthCheckInterval) {
      console.warn('[ProxyManager] Health checks already running');
      return;
    }

    console.log(`[ProxyManager] Starting health checks (every ${intervalMs}ms)`);

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalMs);

    // Run immediately
    this.performHealthChecks();
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('[ProxyManager] Health checks stopped');
    }
  }

  /**
   * Perform health checks on all proxies
   */
  private async performHealthChecks(): Promise<void> {
    if (this.healthCheckRunning) {
      return;
    }

    this.healthCheckRunning = true;

    try {
      const proxies = await db.select().from(proxyPool);

      console.log(`[ProxyManager] Performing health checks on ${proxies.length} proxies...`);

      for (const proxy of proxies) {
        const isHealthy = await this.testProxy(proxy.proxyUrl);

        const updates: any = {
          lastHealthCheck: new Date(),
        };

        if (isHealthy) {
          updates.status = 'active';
          updates.failuresCount = 0;
        } else {
          updates.failuresCount = proxy.failuresCount + 1;

          if (proxy.failuresCount + 1 >= 3) {
            updates.status = 'failed';
          }
        }

        await db
          .update(proxyPool)
          .set(updates)
          .where(eq(proxyPool.id, proxy.id));
      }

      console.log('[ProxyManager] Health checks completed');
    } catch (error) {
      console.error('[ProxyManager] Health check failed:', error);
    } finally {
      this.healthCheckRunning = false;
    }
  }

  /**
   * Get proxy pool stats
   */
  async getStats() {
    try {
      const proxies = await db.select().from(proxyPool);

      const active = proxies.filter(p => p.status === 'active').length;
      const failed = proxies.filter(p => p.status === 'failed').length;
      const testing = proxies.filter(p => p.status === 'testing').length;

      const avgSuccessRate = proxies.length > 0
        ? proxies.reduce((sum, p) => sum + (p.successRate || 0), 0) / proxies.length
        : 0;

      return {
        total: proxies.length,
        active,
        failed,
        testing,
        avgSuccessRate: Math.round(avgSuccessRate),
      };
    } catch (error) {
      console.error('[ProxyManager] Error getting stats:', error);
      return {
        total: 0,
        active: 0,
        failed: 0,
        testing: 0,
        avgSuccessRate: 0,
      };
    }
  }

  /**
   * Seed free proxy list (for testing)
   * NOTE: Free proxies are unreliable! Use paid proxies in production
   */
  async seedFreeProxies(): Promise<void> {
    console.log('[ProxyManager] Seeding free proxies (NOT recommended for production)');

    const freeProxies: string[] = [
      // Add some free proxy URLs here for testing
      // NOTE: These will likely be slow/unreliable
      // 'http://proxy1.example.com:8080',
      // 'http://proxy2.example.com:3128',
    ];

    for (const proxyUrl of freeProxies) {
      await this.addProxy(proxyUrl);
    }

    console.log(`[ProxyManager] Added ${freeProxies.length} free proxies`);
  }
}
