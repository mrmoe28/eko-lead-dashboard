"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Square, Terminal, Loader2, FileText, DollarSign, MessageSquare, List, Twitter, Star, HelpCircle, Users, Home, Settings, Link as LinkIcon, Check, X, Activity } from "lucide-react";
import type { ScrapingSession, ScrapingLog } from "@/lib/db/schema";

// Scraping sources with their display info
const SCRAPING_SOURCES = [
  { id: 'permits', name: 'Building Permits', icon: FileText },
  { id: 'incentives', name: 'Incentives', icon: DollarSign },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare },
  { id: 'craigslist', name: 'Craigslist', icon: List },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  { id: 'yelp', name: 'Yelp', icon: Star },
  { id: 'quora', name: 'Quora', icon: HelpCircle },
  { id: 'facebook', name: 'Facebook', icon: Users },
  { id: 'nextdoor', name: 'Nextdoor', icon: Home },
];

interface LeadSource {
  id: number;
  name: string;
  type: string;
  url?: string;
  fileName?: string;
  status: string;
}

export default function LiveScrapingPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [location, setLocation] = useState("Georgia");
  const [sourceProgress, setSourceProgress] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enabledScrapingSources');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    // Default: all enabled
    const initial: Record<string, boolean> = {};
    SCRAPING_SOURCES.forEach(source => initial[source.id] = true);
    return initial;
  });
  const [dbSources, setDbSources] = useState<LeadSource[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Save enabled sources to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enabledScrapingSources', JSON.stringify(enabledSources));
    }
  }, [enabledSources]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettings]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchLeadSources();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch historical progress for completed sessions
  useEffect(() => {
    if (currentSession && (currentSession.status === 'completed' || currentSession.status === 'failed')) {
      fetchHistoricalProgress(currentSession.id);
    }
  }, [currentSession?.id, currentSession?.status]);

  // Fetch lead sources from database
  async function fetchLeadSources() {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      if (data.sources) {
        setDbSources(data.sources);
        // Add new sources to enabledSources if not already present
        setEnabledSources(prev => {
          const updated = { ...prev };
          data.sources.forEach((source: LeadSource) => {
            const sourceKey = `db_${source.id}`;
            if (updated[sourceKey] === undefined) {
              updated[sourceKey] = true;
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to fetch lead sources:', error);
    }
  }

  // Load progress from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scrapingProgress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only load if it's from the last 24 hours to avoid stale data
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setSourceProgress(parsed.progress || {});
          }
        } catch (error) {
          console.error('Failed to load progress from localStorage:', error);
        }
      }
    }
  }, []);

  // Update source progress from logs
  useEffect(() => {
    const progress: Record<string, number> = {};

    logs.forEach(log => {
      // Match log source to our source IDs (case-insensitive matching)
      const logSource = log.source.toLowerCase();

      // Find matching source ID
      let sourceId = '';
      if (logSource.includes('permit')) sourceId = 'permits';
      else if (logSource.includes('incentive')) sourceId = 'incentives';
      else if (logSource.includes('reddit')) sourceId = 'reddit';
      else if (logSource.includes('craigslist')) sourceId = 'craigslist';
      else if (logSource.includes('twitter') || logSource.includes('x')) sourceId = 'twitter';
      else if (logSource.includes('yelp')) sourceId = 'yelp';
      else if (logSource.includes('quora')) sourceId = 'quora';
      else if (logSource.includes('facebook')) sourceId = 'facebook';
      else if (logSource.includes('nextdoor')) sourceId = 'nextdoor';

      if (sourceId) {
        if (log.status === 'success') {
          progress[sourceId] = 100;
        } else if (log.status === 'processing') {
          progress[sourceId] = 50;
        }
      }
    });

    console.log('[Progress] Updated progress:', progress);
    setSourceProgress(progress);

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('scrapingProgress', JSON.stringify({
        progress,
        timestamp: Date.now()
      }));
    }
  }, [logs]);

  // Connect to SSE stream when current session changes
  useEffect(() => {
    // Don't connect if no session or session is not running/pending
    if (!currentSession || (currentSession.status !== 'running' && currentSession.status !== 'pending')) {
      setIsConnected(false);
      return;
    }

    console.log(`[SSE] Connecting to stream for session #${currentSession.id}`);
    const eventSource = new EventSource(`/api/scraping/stream/${currentSession.id}`);

    eventSource.onopen = () => {
      console.log(`[SSE] Connected to session #${currentSession.id}`);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`[SSE] Received:`, data);

      if (data.type === 'logs') {
        setLogs((prev) => {
          const newLogs = [...prev, ...data.data];
          console.log(`[SSE] Total logs: ${newLogs.length}`);
          return newLogs;
        });
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

    eventSource.onerror = (error) => {
      console.error(`[SSE] Error:`, error);
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

  async function fetchHistoricalProgress(sessionId: number) {
    try {
      const response = await fetch(`/api/scraping/logs?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (data.logs) {
        const progress: Record<string, number> = {};
        
        data.logs.forEach((log: ScrapingLog) => {
          const logSource = log.source.toLowerCase();
          let sourceId = '';
          
          if (logSource.includes('permit')) sourceId = 'permits';
          else if (logSource.includes('incentive')) sourceId = 'incentives';
          else if (logSource.includes('reddit')) sourceId = 'reddit';
          else if (logSource.includes('craigslist')) sourceId = 'craigslist';
          else if (logSource.includes('twitter') || logSource.includes('x')) sourceId = 'twitter';
          else if (logSource.includes('yelp')) sourceId = 'yelp';
          else if (logSource.includes('quora')) sourceId = 'quora';
          else if (logSource.includes('facebook')) sourceId = 'facebook';
          else if (logSource.includes('nextdoor')) sourceId = 'nextdoor';

          if (sourceId) {
            if (log.status === 'success') {
              progress[sourceId] = 100;
            } else if (log.status === 'processing') {
              progress[sourceId] = 50;
            }
          }
        });

        setSourceProgress(progress);
      }
    } catch (error) {
      console.error('Failed to fetch historical progress:', error);
    }
  }

  async function deleteSession(sessionId: number) {
    if (!confirm(`Delete session #${sessionId}?`)) return;

    try {
      const response = await fetch(`/api/scraping/sessions/cancel?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh sessions
        fetchSessions();
        // Clear current session if it was deleted
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setLogs([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  async function cancelAllPending() {
    if (!confirm('Cancel all pending sessions?')) return;

    try {
      const response = await fetch('/api/scraping/sessions/cancel', {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to cancel sessions:', error);
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
        // Clear progress for new session
        setSourceProgress({});
        setLogs([]);
        
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

  async function stopScraping() {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/scraping/sessions/cancel?id=${currentSession.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh sessions and clear current session
        fetchSessions();
        setCurrentSession(null);
        setLogs([]);
      } else {
        alert('Failed to stop scraper');
      }
    } catch (error) {
      console.error('Error stopping scraper:', error);
      alert('Failed to stop scraper');
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
        return '→';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '·';
    }
  }

  function toggleSource(sourceId: string) {
    setEnabledSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Settings */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Scraping</h1>
          <p className="text-gray-600 mt-1">
            Monitor real-time solar lead scraping across multiple sources
          </p>
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-sm"
            title="Scraping Settings"
          >
            <Settings className="w-6 h-6 text-gray-700" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Scraping Sources</h3>
                <p className="text-xs text-gray-600 mt-1">Enable or disable sources</p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Built-in scraping sources */}
                {SCRAPING_SOURCES.map((source) => {
                  const Icon = source.icon;
                  const isEnabled = enabledSources[source.id];
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{source.name}</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </button>
                  );
                })}

                {/* Custom database sources */}
                {dbSources.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-100 border-y border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 uppercase">Custom Sources</span>
                    </div>
                    {dbSources.map((source) => {
                      const sourceKey = `db_${source.id}`;
                      const isEnabled = enabledSources[sourceKey];
                      return (
                        <button
                          key={sourceKey}
                          onClick={() => toggleSource(sourceKey)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <LinkIcon className="w-5 h-5 text-blue-600" />
                            <div className="text-left">
                              <span className="text-sm font-medium text-gray-900 block">{source.name}</span>
                              <span className="text-xs text-gray-500">{source.type}</span>
                            </div>
                          </div>
                          <div className={`w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => router.push('/sources')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  Manage Lead Sources
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Console */}
      <Card className="overflow-hidden rounded-xl border-0 shadow-lg">
        <div className="bg-black px-4 py-3 flex items-center gap-2 border-b border-gray-800 rounded-t-xl">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-200">Console Output</span>
          {logs.length > 0 && (
            <span className="ml-auto text-xs text-gray-500">{logs.length} messages</span>
          )}
          {isConnected && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          )}
        </div>
        <div
          ref={consoleRef}
          className="bg-black p-4 h-96 overflow-y-auto font-mono text-sm rounded-b-xl"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#374151 #000000'
          }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p>No activity yet. Start a scraping session to see real-time logs.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="text-gray-600 shrink-0 font-normal">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  <span className="shrink-0">{getLogStatusIcon(log.status)}</span>
                  <span className="text-gray-300">
                    <span className="text-cyan-400 font-semibold">{log.source}:</span> {log.message}
                    {log.leadCount > 0 && (
                      <span className="text-green-400 font-semibold"> ({log.leadCount} leads)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Start Scraping Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4">Trigger Scraping Job</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Enter location (e.g., Georgia, Florida)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 text-black bg-gradient-to-r from-gray-100 to-gray-200"
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
          <Button
            onClick={stopScraping}
            disabled={!currentSession || currentSession.status !== 'running'}
            variant="destructive"
            className="gap-2 min-w-[140px]"
          >
            <Square className="w-4 h-4" />
            Stop Scraping
          </Button>
        </div>
        {currentSession?.status === 'running' && (
          <p className="text-sm text-gray-600 mt-2">
            A scraping session is already running. Wait for it to complete.
          </p>
        )}
        {currentSession?.status === 'pending' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              Job created! Waiting for job watcher to pick it up...
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              <strong>First time?</strong> Double-click <code className="bg-yellow-100 px-1 rounded">Install-Auto-Watcher.command</code> to set up automatic scraping (one-time setup)
            </p>
          </div>
        )}
      </Card>

      {/* Progress Bars - Modern Redesign */}
      <div className="relative">
        {/* Animated background gradient */}
        {currentSession?.status === 'running' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl animate-pulse" />
        )}

        <Card className="relative p-8 bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Activity className={`w-7 h-7 ${currentSession?.status === 'running' ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                Scraping Progress
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {currentSession?.status === 'running'
                  ? 'Real-time source monitoring'
                  : 'Start a scraping session to track progress'}
              </p>
            </div>
            {currentSession?.status === 'running' ? (
              <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <span className="text-blue-300 text-sm font-medium">
                  {Object.values(sourceProgress).filter(p => p === 100).length} / {SCRAPING_SOURCES.filter(s => enabledSources[s.id]).length} Complete
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <span className="text-slate-400 text-sm font-medium">
                  {SCRAPING_SOURCES.filter(s => enabledSources[s.id]).length} Sources Ready
                </span>
              </div>
            )}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SCRAPING_SOURCES.filter(source => enabledSources[source.id]).map((source) => {
                const progress = sourceProgress[source.id] || 0;
                const isComplete = progress === 100;
                const isProcessing = progress > 0 && progress < 100;
                const Icon = source.icon;

                return (
                  <div
                    key={source.id}
                    className={`relative p-4 rounded-xl border transition-all duration-500 ${
                      isComplete
                        ? 'bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20'
                        : isProcessing
                        ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    {/* Animated corner gradient */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl animate-pulse" />
                    )}

                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isComplete ? 'bg-green-500/20' :
                            isProcessing ? 'bg-blue-500/20' :
                            'bg-slate-700/50'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isComplete ? 'text-green-400' :
                              isProcessing ? 'text-blue-400' :
                              'text-slate-500'
                            }`} />
                          </div>
                          <span className="font-semibold text-white text-sm">{source.name}</span>
                        </div>
                        {isComplete && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Progress bar with gradient */}
                      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                            isComplete
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : isProcessing
                              ? 'bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                        {isProcessing && (
                          <div
                            className="absolute inset-y-0 bg-white/30 w-1/3 animate-shimmer"
                            style={{
                              animation: 'shimmer 2s infinite',
                              left: '-33.333%',
                            }}
                          />
                        )}
                      </div>

                      {/* Status text */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium ${
                          isComplete ? 'text-green-400' :
                          isProcessing ? 'text-blue-400' :
                          'text-slate-500'
                        }`}>
                          {isComplete ? '✓ Complete' :
                           isProcessing ? '⟳ Processing...' :
                           '◦ Waiting...'}
                        </span>
                        <span className="text-xs font-bold text-white">{progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
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

              {/* Pending status helper */}
              {currentSession.status === 'pending' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    Waiting for scraper to pick up this job...
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Install auto-watcher: <code className="bg-yellow-100 px-1 rounded">Install-Auto-Watcher.command</code> (one-time setup, then it works automatically)
                  </p>
                </div>
              )}
            </div>
            {currentSession.status === 'running' && (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
            {currentSession.status === 'pending' && (
              <div className="w-8 h-8 text-yellow-600 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
          {sessions.filter(s => s.status === 'pending').length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={cancelAllPending}
              className="text-red-600 hover:text-red-700"
            >
              Clear All Pending
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.slice(0, 6).map((session) => (
            <Card
              key={session.id}
              className={`p-4 transition-all bg-slate-800/50 backdrop-blur-xl border-slate-700/50 ${
                currentSession?.id === session.id
                  ? 'shadow-xl shadow-blue-500/50 border-blue-500/50'
                  : 'shadow-lg shadow-black/50 hover:shadow-xl hover:shadow-purple-500/30 hover:border-slate-600/50'
              }`}
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  setCurrentSession(session);
                  setLogs([]); // Clear logs when switching sessions
                  // Clear progress for running sessions, fetch historical for completed ones
                  if (session.status === 'running' || session.status === 'pending') {
                    setSourceProgress({});
                  } else {
                    fetchHistoricalProgress(session.id);
                  }
                }}
                onDoubleClick={() => {
                  // Navigate to session detail page on double-click
                  if (session.status === 'completed') {
                    router.push(`/scraping/${session.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white">Session #{session.id}</div>
                    <div className="text-sm text-gray-400 mt-1">{session.location}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                      session.status
                    )}`}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-white">
                  <div>Leads: {session.totalLeadsFound}</div>
                  <div>{new Date(session.startedAt).toLocaleDateString()}</div>
                  {session.status === 'completed' && (
                    <div className="text-xs text-blue-400 mt-2">
                      Double-click to view details
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="flex-1 bg-slate-700 border-slate-600 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips Card */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Tips</h3>
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
