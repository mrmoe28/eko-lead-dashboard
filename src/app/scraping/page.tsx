"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Terminal, Loader2 } from "lucide-react";
import type { ScrapingSession, ScrapingLog } from "@/lib/db/schema";

export default function LiveScrapingPage() {
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

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

  function formatTimestamp(timestamp: Date | string) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  function getStatusColor(status: string) {
    switch (status) {
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
          Monitor real-time lead scraping activity
        </p>
      </div>

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
            </div>
            {currentSession.status === 'running' && (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Start Scraping</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Configure the scraper CLI with your API key</li>
          <li>Run the scraper: <code className="bg-blue-100 px-2 py-1 rounded">node scrape-leads.js Georgia</code></li>
          <li>Watch real-time progress here in the dashboard</li>
          <li>All leads are automatically saved to the database</li>
        </ol>
      </Card>
    </div>
  );
}
