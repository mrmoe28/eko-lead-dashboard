"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Upload,
  Link as LinkIcon,
  TrendingUp,
  Activity,
  BarChart3,
  Trash2,
  Play,
  Pause,
  Archive,
  FileText,
  DollarSign,
  MessageSquare,
  List,
  Twitter,
  Star,
  HelpCircle,
  Users,
  Home,
} from "lucide-react";

interface LeadSource {
  id: number;
  name: string;
  type: "url" | "file" | "manual";
  url?: string;
  fileName?: string;
  status: "active" | "testing" | "paused" | "archived";
  totalLeads: number;
  qualityScore: number;
  conversionRate: number;
  avgLeadScore: number;
  lastTestedAt?: string;
  createdAt: string;
}

// Built-in scraping sources
const BUILT_IN_SOURCES = [
  { id: 'permits', name: 'Building Permits', icon: FileText, type: 'built-in' as const, description: 'County building permit databases' },
  { id: 'incentives', name: 'Incentives', icon: DollarSign, type: 'built-in' as const, description: 'Solar incentive programs' },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, type: 'built-in' as const, description: 'Solar subreddits' },
  { id: 'craigslist', name: 'Craigslist', icon: List, type: 'built-in' as const, description: 'Craigslist posts' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, type: 'built-in' as const, description: 'Twitter/X posts' },
  { id: 'yelp', name: 'Yelp', icon: Star, type: 'built-in' as const, description: 'Yelp reviews and Q&A' },
  { id: 'quora', name: 'Quora', icon: HelpCircle, type: 'built-in' as const, description: 'Quora questions' },
  { id: 'facebook', name: 'Facebook', icon: Users, type: 'built-in' as const, description: 'Facebook groups' },
  { id: 'nextdoor', name: 'Nextdoor', icon: Home, type: 'built-in' as const, description: 'Nextdoor posts' },
];

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "url" as "url" | "file",
    url: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addSource() {
    if (!newSource.name) {
      alert("Please enter a source name");
      return;
    }

    if (newSource.type === "url" && !newSource.url) {
      alert("Please enter a URL");
      return;
    }

    if (newSource.type === "file" && !newSource.file) {
      alert("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newSource.name);
      formData.append("type", newSource.type);

      if (newSource.type === "url") {
        formData.append("url", newSource.url);
      } else if (newSource.file) {
        formData.append("file", newSource.file);
      }

      const res = await fetch("/api/sources", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewSource({ name: "", type: "url", url: "", file: null });
        fetchSources();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add source");
      }
    } catch (error) {
      console.error("Error adding source:", error);
      alert("Failed to add source");
    }
  }

  async function testSource(id: number) {
    try {
      const res = await fetch(`/api/sources/${id}/test`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Test started! Check back in a few minutes for results.");
        fetchSources();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start test");
      }
    } catch (error) {
      console.error("Error testing source:", error);
      alert("Failed to test source");
    }
  }

  async function updateSourceStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchSources();
      }
    } catch (error) {
      console.error("Error updating source:", error);
    }
  }

  async function deleteSource(id: number) {
    if (!confirm("Are you sure you want to delete this source?")) return;

    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSources();
      }
    } catch (error) {
      console.error("Error deleting source:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading lead sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lead Sources</h1>
          <p className="text-gray-300 mt-1">Test and manage your lead generation sources</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Add Source
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Sources</p>
              <p className="text-2xl font-bold mt-1 text-white">{sources.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Active Sources</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {sources.filter((s) => s.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Leads</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {sources.reduce((sum, s) => sum + s.totalLeads, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Avg Quality</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {sources.length > 0
                  ? Math.round(
                      sources.reduce((sum, s) => sum + s.qualityScore, 0) / sources.length
                    )
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Built-in Sources */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-blue-500/20">
        <h2 className="text-xl font-bold mb-4 text-white">Built-in Scraper Sources</h2>
        <p className="text-sm text-gray-400 mb-4">These sources are automatically used during scraping sessions</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILT_IN_SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <div
                key={source.id}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{source.name}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                      {source.type}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{source.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Custom Sources List */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-cyan-500/20">
        <h2 className="text-xl font-bold mb-4 text-white">Custom Lead Sources</h2>

        {sources.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No custom lead sources yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          source.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : source.status === "testing"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : source.status === "paused"
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {source.status}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                        {source.type}
                      </span>
                    </div>

                    {source.url && (
                      <p className="text-sm text-gray-400 mb-2">
                        <LinkIcon className="w-4 h-4 inline mr-1" />
                        {source.url}
                      </p>
                    )}

                    {source.fileName && (
                      <p className="text-sm text-gray-400 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        {source.fileName}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Total Leads</span>
                          <span className="text-white font-semibold">{source.totalLeads}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Avg Lead Score</span>
                          <span className="text-white font-semibold">{source.avgLeadScore}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Quality Score</span>
                          <span className="text-white font-semibold">{source.qualityScore}/100</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${source.qualityScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">Conversion Rate</span>
                          <span className="text-white font-semibold">{source.conversionRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${source.conversionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testSource(source.id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Test Source"
                    >
                      <Play className="w-5 h-5" />
                    </button>

                    {source.status === "active" ? (
                      <button
                        onClick={() => updateSourceStatus(source.id, "paused")}
                        className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
                        title="Pause"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateSourceStatus(source.id, "active")}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => updateSourceStatus(source.id, "archived")}
                      className="p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-purple-500/20 m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Add New Lead Source</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-gray-400 hover:text-white text-xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Source Name</label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Facebook Solar Groups"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Source Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewSource({ ...newSource, type: "url", file: null })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      newSource.type === "url"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-slate-800 border-slate-600 text-gray-400 hover:border-slate-500"
                    }`}
                  >
                    <LinkIcon className="w-5 h-5 mx-auto mb-1" />
                    URL
                  </button>
                  <button
                    onClick={() => setNewSource({ ...newSource, type: "file", url: "" })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      newSource.type === "file"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "bg-slate-800 border-slate-600 text-gray-400 hover:border-slate-500"
                    }`}
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    File
                  </button>
                </div>
              </div>

              {newSource.type === "url" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">URL</label>
                  <input
                    type="url"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/leads"
                  />
                </div>
              )}

              {newSource.type === "file" && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Upload File</label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewSource({ ...newSource, file: e.target.files?.[0] || null })
                    }
                    accept=".csv,.xlsx,.json"
                    className="w-full p-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: CSV, XLSX, JSON
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSource}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30"
              >
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
