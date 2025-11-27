"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Search, Filter, Calendar, MapPin, Target, Database } from "lucide-react";
import type { ScrapingSession } from "@/lib/db/schema";

interface Lead {
  id: number;
  name: string;
  location: string;
  priority: string;
  score: number;
  source: string;
  phone: string | null;
  email: string | null;
  request: string;
  whyHot: string | null;
  actionRequired: string | null;
  postedTime: string | null;
  profileUrl: string | null;
  originalPostUrl: string | null;
  createdAt: Date;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ScrapingSession | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, filterSource, filterPriority]);

  async function fetchSessionData() {
    try {
      setLoading(true);

      // Fetch session details
      const sessionRes = await fetch(`/api/scraping/sessions`);
      const sessions = await sessionRes.json();
      const currentSession = sessions.find((s: ScrapingSession) => s.id === parseInt(sessionId));
      setSession(currentSession);

      // Fetch leads for this session
      const leadsRes = await fetch(`/api/leads`);
      const allLeads = await leadsRes.json();
      const sessionLeads = allLeads.filter((l: Lead & { sessionId?: number }) => l.sessionId === parseInt(sessionId));
      setLeads(sessionLeads);
      setFilteredLeads(sessionLeads);
    } catch (error) {
      console.error("Failed to fetch session data:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterLeads() {
    let filtered = [...leads];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.request.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Source filter
    if (filterSource !== "all") {
      filtered = filtered.filter((lead) => lead.source === filterSource);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((lead) => lead.priority === filterPriority);
    }

    setFilteredLeads(filtered);
  }

  function exportToPDF() {
    // Create CSV for now (PDF export would need a library)
    const csvContent = convertToCSV(filteredLeads);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${sessionId}-leads.csv`;
    link.click();
  }

  function convertToCSV(data: Lead[]) {
    const headers = ["Name", "Location", "Source", "Priority", "Score", "Phone", "Email", "Request"];
    const rows = data.map((lead) => [
      lead.name,
      lead.location,
      lead.source,
      lead.priority,
      lead.score,
      lead.phone || "",
      lead.email || "",
      lead.request,
    ]);

    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  const sources = Array.from(new Set(leads.map((l) => l.source)));
  const priorities = ["urgent", "high", "medium"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Session not found</p>
          <Button onClick={() => router.push("/scraping")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Live Scraping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/scraping")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session #{session.id}</h1>
            <p className="text-gray-600 mt-1">Detailed session report</p>
          </div>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Session Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-lg font-semibold">{session.location}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-lg font-semibold">{leads.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sources</p>
              <p className="text-lg font-semibold">{sources.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-semibold">{new Date(session.startedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, request, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </Card>

      {/* Leads Grid */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No leads found matching your filters</p>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{lead.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                    <span className="text-xs text-gray-500">Score: {lead.score}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Location</p>
                      <p className="text-sm font-medium">{lead.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Source</p>
                      <p className="text-sm font-medium">{lead.source}</p>
                    </div>
                    {lead.phone && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Phone</p>
                        <p className="text-sm font-medium">{lead.phone}</p>
                      </div>
                    )}
                    {lead.email && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-sm font-medium">{lead.email}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-1">Request</p>
                    <p className="text-sm">{lead.request}</p>
                  </div>

                  {lead.whyHot && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900">Why Hot</p>
                      <p className="text-sm text-yellow-800 mt-1">{lead.whyHot}</p>
                    </div>
                  )}

                  {lead.actionRequired && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Action Required</p>
                      <p className="text-sm text-blue-800 mt-1">{lead.actionRequired}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
