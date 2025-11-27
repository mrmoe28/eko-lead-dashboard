"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Lead } from "@/lib/db/schema";
import { LeadCard } from "@/components/lead-card";
import { LeadDetailModal } from "@/components/lead-detail-modal";
import { LeadsTableView } from "@/components/leads-table-view";
import { LeadsGridView } from "@/components/leads-grid-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Radio,
  LayoutGrid,
  Table,
  Grid2X2
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "grid" | "table";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

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
    <div className="relative">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's your lead overview.</p>
        </div>
        <Link href="/scraping">
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
            <Radio className="w-4 h-4" />
            Start Scraping
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeIn} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-blue-500/20 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Leads</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2">{leads.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span className="text-green-400 font-medium">+{hotLeads.length}</span> hot leads
          </p>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-red-500/20 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Hot Leads</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mt-2">{hotLeads.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Score 80+ ready to convert</p>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Est. Revenue</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mt-2">
                ${(estimatedRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">15% close rate estimate</p>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Conversion Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
                {leads.length > 0 ? Math.round((hotLeads.length / leads.length) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Hot leads vs total</p>
        </Card>
      </motion.div>

      {/* Lead Distribution */}
      <motion.div variants={fadeIn}>
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 text-white">Lead Distribution</h2>
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
      </motion.div>

      {/* Recent Hot Leads */}
      <motion.div variants={fadeIn}>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-white">Recent Hot Leads</h2>

          <div className="flex items-center gap-3">
            {/* View Mode Toolbar */}
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
                <Grid2X2 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
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

            <Link href="/leads">
              <Button variant="outline" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {recentLeads.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <p className="text-gray-400">No leads yet. Start scraping to find leads!</p>
            <Link href="/scraping">
              <Button className="mt-4 gap-2">
                <Radio className="w-4 h-4" />
                Start Scraping
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {viewMode === "card" && (
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

            {viewMode === "grid" && (
              <LeadsGridView
                leads={recentLeads}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            )}

            {viewMode === "table" && (
              <LeadsTableView
                leads={recentLeads}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </motion.div>

      {/* Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDelete}
      />
      </motion.div>
    </div>
  );
}
