"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/db/schema";
import { LeadCard } from "@/components/lead-card";
import { LeadDetailModal } from "@/components/lead-detail-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Radio
} from "lucide-react";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch("/api/leads");
        const data = await response.json();
        setLeads(data);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const hotLeads = leads.filter((l) => l.score >= 80);
  const warmLeads = leads.filter((l) => l.score >= 60 && l.score < 80);
  const coldLeads = leads.filter((l) => l.score < 60);

  const avgDealSize = 15000;
  const estimatedRevenue = Math.round(hotLeads.length * avgDealSize * 0.15);

  const recentLeads = leads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your lead overview.</p>
        </div>
        <Link href="/scraping">
          <Button className="gap-2">
            <Radio className="w-4 h-4" />
            Start Scraping
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{leads.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-600 font-medium">+{hotLeads.length}</span> hot leads
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{hotLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Score 80+ ready to convert</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Est. Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${(estimatedRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">15% close rate estimate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {leads.length > 0 ? Math.round((hotLeads.length / leads.length) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Hot leads vs total</p>
        </Card>
      </div>

      {/* Lead Distribution */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Lead Distribution</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">Hot Leads</span>
              <span className="text-2xl font-bold text-red-700">{hotLeads.length}</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{
                  width: `${leads.length > 0 ? (hotLeads.length / leads.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-red-700 mt-2">Score 80+</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Warm Leads</span>
              <span className="text-2xl font-bold text-orange-700">{warmLeads.length}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{
                  width: `${leads.length > 0 ? (warmLeads.length / leads.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-orange-700 mt-2">Score 60-79</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Cold Leads</span>
              <span className="text-2xl font-bold text-blue-700">{coldLeads.length}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${leads.length > 0 ? (coldLeads.length / leads.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">Score &lt;60</p>
          </div>
        </div>
      </Card>

      {/* Recent Hot Leads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Hot Leads</h2>
          <Link href="/leads">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No leads yet. Start scraping to find leads!</p>
            <Link href="/scraping">
              <Button className="mt-4 gap-2">
                <Radio className="w-4 h-4" />
                Start Scraping
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDelete}
      />
    </div>
  );
}
