"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Square, Terminal, Loader2 } from "lucide-react";
import type { ScrapingSession, ScrapingLog } from "@/lib/db/schema";

// Scraping sources with their display info
const SCRAPING_SOURCES = [
  { id: 'permits', name: 'Building Permits', emoji: '🏗️' },
  { id: 'incentives', name: 'Incentives', emoji: '💰' },
  { id: 'reddit', name: 'Reddit', emoji: '🤖' },
  { id: 'craigslist', name: 'Craigslist', emoji: '📋' },
  { id: 'twitter', name: 'Twitter/X', emoji: '🐦' },
  { id: 'yelp', name: 'Yelp', emoji: '⭐' },
  { id: 'quora', name: 'Quora', emoji: '❓' },
  { id: 'facebook', name: 'Facebook', emoji: '👥' },
  { id: 'nextdoor', name: 'Nextdoor', emoji: '🏘️' },
];

export default function LiveScrapingPage() {
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [location, setLocation] = useState("Georgia");
  const [sourceProgress, setSourceProgress] = useState<Record<string, number>>({});
  const consoleRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update source progress from logs
  useEffect(() => {
    const progress: Record<string, number> = {};
    logs.forEach(log => {
      const sourceKey = log.source.toLowerCase();
      if (log.status === 'success') {
        progress[sourceKey] = 100;
      } else if (log.status === 'processing') {
        progress[sourceKey] = 50;
      }
    });
    setSourceProgress(progress);
  }, [logs]);

  // Connect to SSE stream when current session changes
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'running') {
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource(`/api/scraping/stream/${currentSession.id}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'logs') {
        setLogs((prev) => [...prev, ...data.data]);
        // Auto-scroll console to bottom
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 100);
      } else if (data.type === 'session') {
        setCurrentSession(data.data);
        // Update sessions list
        setSessions((prev) =>
          prev.map((s) => (s.id === data.data.id ? data.data : s))
        );
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [currentSession?.id]);

  async function fetchSessions() {
    try {
      const response = await fetch('/api/scraping/sessions');
      const data = await response.json();
      setSessions(data);

      // Auto-select latest running session
      const runningSession = data.find((s: ScrapingSession) => s.status === 'running');
      if (runningSession && !currentSession) {
        setCurrentSession(runningSession);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }

  async function startScraping() {
    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch('/api/scraping/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        // Wait a moment then refresh sessions
        setTimeout(() => {
          fetchSessions();
          setIsStarting(false);
        }, 2000);
      } else {
        alert('Failed to start scraper');
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Error starting scraper:', error);
      alert('Failed to start scraper');
      setIsStarting(false);
    }
  }

  function formatTimestamp(timestamp: Date | string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'running':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  function getLogStatusIcon(status: string) {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Scraping</h1>
        <p className="text-gray-600 mt-1">
          Monitor real-time solar lead scraping across multiple sources
        </p>
      </div>

      {/* Quick Start Guide */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-xl shrink-0">
            ✓
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-3">🚀 Quick Start</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold text-green-900">Option 1: One-Click Trigger</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                  <li>Open terminal in <code className="bg-green-100 px-1 rounded text-xs">solar-data-extractor</code></li>
                  <li>Run: <code className="bg-green-100 px-2 py-1 rounded">npm run watch</code></li>
                  <li>Click "Start Scraping" below</li>
                </ol>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-green-900">Option 2: Manual Run</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                  <li>Open terminal in <code className="bg-green-100 px-1 rounded text-xs">solar-data-extractor</code></li>
                  <li>Run: <code className="bg-green-100 px-2 py-1 rounded">npm run scrape Georgia</code></li>
                  <li>Watch progress below</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Start Scraping Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4">🎯 Trigger Scraping Job</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Enter location (e.g., Georgia, Florida)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1"
            disabled={isStarting || currentSession?.status === 'running'}
          />
          <Button
            onClick={startScraping}
            disabled={isStarting || currentSession?.status === 'running'}
            className="gap-2 min-w-[140px]"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Scraping
              </>
            )}
          </Button>
        </div>
        {currentSession?.status === 'running' && (
          <p className="text-sm text-gray-600 mt-2">
            ⚠️ A scraping session is already running. Wait for it to complete.
          </p>
        )}
        {currentSession?.status === 'pending' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⏳ Job created! Waiting for job watcher to pick it up...
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Make sure <code className="bg-yellow-100 px-1 rounded">npm run watch</code> is running in solar-data-extractor folder
            </p>
          </div>
        )}
      </Card>

      {/* Progress Bars */}
      {currentSession?.status === 'running' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Scraping Progress</h2>
          <div className="space-y-3">
            {SCRAPING_SOURCES.map((source) => {
              const progress = sourceProgress[source.id] || 0;
              const isComplete = progress === 100;
              const isProcessing = progress > 0 && progress < 100;

              return (
                <div key={source.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {source.emoji} {source.name}
                    </span>
                    <span className={`text-xs ${
                      isComplete ? 'text-green-600' :
                      isProcessing ? 'text-blue-600' :
                      'text-gray-400'
                    }`}>
                      {isComplete ? '✓ Complete' :
                       isProcessing ? 'Processing...' :
                       'Waiting...'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-green-500' :
                        isProcessing ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Current Session Status */}
      {currentSession && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Session #{currentSession.id}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    currentSession.status
                  )}`}
                >
                  {currentSession.status.toUpperCase()}
                </span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Location:</span> {currentSession.location}
                </p>
                <p>
                  <span className="font-medium">Leads Found:</span> {currentSession.totalLeadsFound}
                </p>
                <p>
                  <span className="font-medium">Started:</span>{' '}
                  {new Date(currentSession.startedAt).toLocaleString()}
                </p>
              </div>

              {/* Pending status helper */}
              {currentSession.status === 'pending' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⏳ Waiting for scraper to pick up this job...
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Make sure the job watcher is running: <code className="bg-yellow-100 px-1 rounded">node watch-jobs.js</code>
                  </p>
                </div>
              )}
            </div>
            {currentSession.status === 'running' && (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
            {currentSession.status === 'pending' && (
              <div className="w-8 h-8 text-yellow-600 flex items-center justify-center">
                ⏳
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Console */}
      <Card className="overflow-hidden">
        <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Console Output</span>
          {logs.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{logs.length} messages</span>
          )}
        </div>
        <div
          ref={consoleRef}
          className="bg-gray-900 p-4 h-96 overflow-y-auto font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No activity yet. Start a scraping session to see real-time logs.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-gray-500 shrink-0">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  <span className="shrink-0">{getLogStatusIcon(log.status)}</span>
                  <span className="text-gray-300">
                    <span className="text-blue-400">{log.source}:</span> {log.message}
                    {log.leadCount > 0 && (
                      <span className="text-green-400"> ({log.leadCount} leads)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.slice(0, 6).map((session) => (
            <Card
              key={session.id}
              className={`p-4 cursor-pointer transition-all ${
                currentSession?.id === session.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() => {
                setCurrentSession(session);
                setLogs([]); // Clear logs when switching sessions
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">Session #{session.id}</div>
                  <div className="text-sm text-gray-600 mt-1">{session.location}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                    session.status
                  )}`}
                >
                  {session.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <div>Leads: {session.totalLeadsFound}</div>
                <div>{new Date(session.startedAt).toLocaleDateString()}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips Card */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>The job watcher polls every 5 seconds for new jobs from the dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>You can run multiple scrapers manually if needed: <code className="bg-gray-200 px-1 rounded text-xs">npm run scrape Florida</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>All leads are automatically saved to the database and appear in the Leads Library</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Sessions are tracked in Recent Sessions below for historical reference</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
