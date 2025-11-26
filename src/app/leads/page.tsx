"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/lib/db/schema";
import { LeadCard } from "@/components/lead-card";
import { LeadDetailModal } from "@/components/lead-detail-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

export default function LeadsLibraryPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads Library</h1>
        <p className="text-gray-600 mt-1">
          Browse and filter all your leads
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold">Filters</h2>
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
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            >
              Clear Filters
            </Button>
            <span className="text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </span>
          </div>
        )}
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Showing</div>
          <div className="text-2xl font-bold">{filteredLeads.length}</div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-600">Hot (80+)</div>
          <div className="text-2xl font-bold text-red-700">
            {filteredLeads.filter((l) => l.score >= 80).length}
          </div>
        </Card>
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="text-sm text-orange-600">Warm (60-79)</div>
          <div className="text-2xl font-bold text-orange-700">
            {filteredLeads.filter((l) => l.score >= 60 && l.score < 80).length}
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600">Cold (&lt;60)</div>
          <div className="text-2xl font-bold text-blue-700">
            {filteredLeads.filter((l) => l.score < 60).length}
          </div>
        </Card>
      </div>

      {/* Lead Cards Grid */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No leads found matching your filters.</p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setSourceFilter("all");
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
