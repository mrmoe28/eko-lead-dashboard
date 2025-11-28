"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Cpu,
  Zap,
  Globe
} from "lucide-react";

interface Worker {
  id: number;
  workerId: string;
  status: string;
  lastHeartbeat: string | null;
  jobsProcessed: number;
  errorsCount: number;
  currentJobId: number | null;
  startedAt: string;
  stoppedAt: string | null;
}

interface Stats {
  activeWorkers: number;
  totalJobsProcessed: number;
  totalErrors: number;
  errorRate: number;
}

interface Metric {
  source: string;
  requests: number;
  successes: number;
  errors: number;
  leads: number;
  avgResponseTime: number;
  successRate: number;
}

interface ProxyStats {
  total: number;
  active: number;
  failed: number;
  testing: number;
  avgSuccessRate: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeWorkers: 0,
    totalJobsProcessed: 0,
    totalErrors: 0,
    errorRate: 0,
  });
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [proxyStats, setProxyStats] = useState<ProxyStats>({
    total: 0,
    active: 0,
    failed: 0,
    testing: 0,
    avgSuccessRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const response = await fetch('/api/workers/health');
      const data = await response.json();

      setWorkers(data.workers || []);
      setStats(data.stats || stats);
      setMetrics(data.metrics || []);
      setProxyStats(data.proxyStats || proxyStats);
    } catch (error) {
      console.error('Failed to fetch worker health:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'running':
        return <Activity className="w-5 h-5 text-green-400 animate-pulse" />;
      case 'idle':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'crashed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'stopped':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'idle':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'crashed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'stopped':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  }

  function formatTimestamp(timestamp: string | null) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading worker health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Worker Health Dashboard</h1>
        <p className="text-gray-300 mt-1">Monitor scraper workers, performance, and proxy pool</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Active Workers</p>
              <p className="text-2xl font-bold mt-1 text-white">{stats.activeWorkers}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Jobs Processed</p>
              <p className="text-2xl font-bold mt-1 text-white">{stats.totalJobsProcessed}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Error Rate</p>
              <p className="text-2xl font-bold mt-1 text-white">{stats.errorRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Active Proxies</p>
              <p className="text-2xl font-bold mt-1 text-white">{proxyStats.active}/{proxyStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Workers List */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Worker Instances</h2>

        {workers.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No workers running</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(worker.status)}
                    <div>
                      <h3 className="text-sm font-semibold text-white">{worker.workerId}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(worker.status)}`}>
                        {worker.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <p className="text-gray-400">Last heartbeat:</p>
                    <p className="text-white font-medium">{formatTimestamp(worker.lastHeartbeat)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-600/30">
                  <div>
                    <p className="text-xs text-gray-400">Jobs Processed</p>
                    <p className="text-lg font-semibold text-white">{worker.jobsProcessed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Errors</p>
                    <p className="text-lg font-semibold text-white">{worker.errorsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Current Job</p>
                    <p className="text-lg font-semibold text-white">{worker.currentJobId || 'None'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Metrics by Source */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Scraper Performance</h2>

        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No metrics data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div
                key={metric.source}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{metric.source}</h3>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    metric.successRate >= 80
                      ? 'bg-green-500/20 text-green-400'
                      : metric.successRate >= 50
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {metric.successRate}% success
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Requests</p>
                    <p className="text-lg font-semibold text-white">{metric.requests}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Leads Found</p>
                    <p className="text-lg font-semibold text-white">{metric.leads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Errors</p>
                    <p className="text-lg font-semibold text-white">{metric.errors}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg Response</p>
                    <p className="text-lg font-semibold text-white">{metric.avgResponseTime}ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Proxy Stats */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Proxy Pool Status</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{proxyStats.total}</p>
            <p className="text-sm text-gray-400 mt-1">Total Proxies</p>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg text-center border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">{proxyStats.active}</p>
            <p className="text-sm text-gray-400 mt-1">Active</p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg text-center border border-red-500/30">
            <p className="text-2xl font-bold text-red-400">{proxyStats.failed}</p>
            <p className="text-sm text-gray-400 mt-1">Failed</p>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg text-center border border-yellow-500/30">
            <p className="text-2xl font-bold text-yellow-400">{proxyStats.testing}</p>
            <p className="text-sm text-gray-400 mt-1">Testing</p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{proxyStats.avgSuccessRate}%</p>
            <p className="text-sm text-gray-400 mt-1">Avg Success</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
