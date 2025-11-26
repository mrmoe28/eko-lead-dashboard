"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/lib/db/schema";
import { LeadCard } from "@/components/lead-card";
import { LeadDetailModal } from "@/components/lead-detail-modal";
import { Input, Select, SelectItem, Button, Spinner } from "@heroui/react";
import { Search, Filter } from "lucide-react";

export default function DashboardPage() {
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

  const sources = ["Nextdoor", "HomeAdvisor", "Thumbtack", "Angi"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Eko Lead Dashboard</h1>
          <p className="text-sm text-gray-600">AI-powered lead generation for contractors</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              isClearable
              onClear={() => setSearchQuery("")}
            />

            <Select
              label="Priority"
              placeholder="All priorities"
              selectedKeys={priorityFilter ? [priorityFilter] : []}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <SelectItem key="all">All Priorities</SelectItem>
              <SelectItem key="urgent">Urgent</SelectItem>
              <SelectItem key="high">High</SelectItem>
              <SelectItem key="medium">Medium</SelectItem>
            </Select>

            <Select
              label="Source"
              placeholder="All sources"
              selectedKeys={sourceFilter ? [sourceFilter] : []}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <SelectItem key="all">All Sources</SelectItem>
              <SelectItem key="Nextdoor">Nextdoor</SelectItem>
              <SelectItem key="HomeAdvisor">HomeAdvisor</SelectItem>
              <SelectItem key="Thumbtack">Thumbtack</SelectItem>
              <SelectItem key="Angi">Angi</SelectItem>
            </Select>
          </div>

          {(searchQuery || priorityFilter !== "all" || sourceFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">Total Leads</div>
            <div className="text-2xl font-bold">{leads.length}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-4 border border-red-200">
            <div className="text-sm text-red-600">Hot Leads (80+)</div>
            <div className="text-2xl font-bold text-red-700">
              {leads.filter((l) => l.score >= 80).length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm p-4 border border-orange-200">
            <div className="text-sm text-orange-600">Warm Leads (60-79)</div>
            <div className="text-2xl font-bold text-orange-700">
              {leads.filter((l) => l.score >= 60 && l.score < 80).length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="text-sm text-blue-600">Cold Leads (&lt;60)</div>
            <div className="text-2xl font-bold text-blue-700">
              {leads.filter((l) => l.score < 60).length}
            </div>
          </div>
        </div>

        {/* Lead Cards */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No leads found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onViewDetails={handleViewDetails} />
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
