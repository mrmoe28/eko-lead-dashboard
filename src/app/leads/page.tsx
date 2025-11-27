"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/lib/db/schema";
import { LeadCard } from "@/components/lead-card";
import { LeadDetailModal } from "@/components/lead-detail-modal";
import { LeadsTableView } from "@/components/leads-table-view";
import { LeadsGridView } from "@/components/leads-grid-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, X, LayoutGrid, Table, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "grid" | "table";

export default function LeadsLibraryPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Fetch leads on mount
  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch("/api/leads");
        const data = await response.json();
        setLeads(data);
        setFilteredLeads(data);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // Filter leads when filters change
  useEffect(() => {
    let filtered = [...leads];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((lead) =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.request.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    // Sort by score (highest first)
    filtered.sort((a, b) => b.score - a.score);

    setFilteredLeads(filtered);
  }, [searchQuery, priorityFilter, sourceFilter, leads]);

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const sources = Array.from(new Set(leads.map(l => l.source))).sort();
  const hasActiveFilters = searchQuery || priorityFilter !== "all" || sourceFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-[40%] -left-[15%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] right-[20%] w-[650px] h-[650px] bg-pink-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950/50 to-black" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header with View Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Leads Library
            </h1>
            <p className="text-gray-400 mt-1">
              Browse and filter all your leads
            </p>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center gap-1 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                viewMode === "card"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              )}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Card</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              )}
              title="Grid View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                viewMode === "table"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              )}
              title="Table View"
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, location, or request..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Info */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setSourceFilter("all");
                }}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Clear Filters
              </Button>
              <span className="text-sm text-gray-400">
                Showing {filteredLeads.length} of {leads.length} leads
              </span>
            </div>
          )}
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
            <div className="text-sm text-gray-400">Showing</div>
            <div className="text-2xl font-bold text-white">{filteredLeads.length}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-red-500/30 shadow-xl shadow-black/50 hover:border-red-500/50 transition-all">
            <div className="text-sm text-red-400">Hot (80+)</div>
            <div className="text-2xl font-bold text-red-400">
              {filteredLeads.filter((l) => l.score >= 80).length}
            </div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-orange-500/30 shadow-xl shadow-black/50 hover:border-orange-500/50 transition-all">
            <div className="text-sm text-orange-400">Warm (60-79)</div>
            <div className="text-2xl font-bold text-orange-400">
              {filteredLeads.filter((l) => l.score >= 60 && l.score < 80).length}
            </div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-blue-500/30 shadow-xl shadow-black/50 hover:border-blue-500/50 transition-all">
            <div className="text-sm text-blue-400">Cold (&lt;60)</div>
            <div className="text-2xl font-bold text-blue-400">
              {filteredLeads.filter((l) => l.score < 60).length}
            </div>
          </Card>
        </div>

        {/* Lead Views */}
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
            <p className="text-gray-400">No leads found matching your filters.</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setSourceFilter("all");
                }}
                className="mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            {viewMode === "card" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {viewMode === "grid" && (
              <LeadsGridView
                leads={filteredLeads}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            )}

            {viewMode === "table" && (
              <LeadsTableView
                leads={filteredLeads}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            )}
          </>
        )}

        {/* Detail Modal */}
        <LeadDetailModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
