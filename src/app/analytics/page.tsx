"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
} from "lucide-react";

interface Insight {
  type: "success" | "warning" | "info" | "danger";
  title: string;
  description: string;
  recommendation: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </Card>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed insights and metrics to optimize your lead generation</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold mt-1">
                {analytics.leadsBySource.reduce((sum: number, s: any) => sum + parseInt(s.totalLeads || "0"), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Lead Score</p>
              <p className="text-2xl font-bold mt-1">
                {(
                  analytics.leadsBySource.reduce((sum: number, s: any) => sum + parseFloat(s.avgScore || "0"), 0) /
                  analytics.leadsBySource.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold mt-1">
                {(
                  (parseInt(analytics.sessionStats.completedSessions || "0") /
                    parseInt(analytics.sessionStats.totalSessions || "1")) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contact Rate</p>
              <p className="text-2xl font-bold mt-1">
                {(
                  ((analytics.contactStats.withPhone + analytics.contactStats.withEmail) /
                    (analytics.contactStats.withPhone +
                      analytics.contactStats.withEmail +
                      analytics.contactStats.noContact || 1)) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI-Powered Insights & Recommendations
          </h2>
          <div className="space-y-4">
            {analytics.insights.map((insight: Insight, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === "success"
                    ? "bg-green-50 border-green-500"
                    : insight.type === "warning"
                    ? "bg-yellow-50 border-yellow-500"
                    : insight.type === "danger"
                    ? "bg-red-50 border-red-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.type === "success" && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                  {insight.type === "warning" && <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                  {insight.type === "danger" && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                  {insight.type === "info" && <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                    <p className="text-sm text-gray-600 mt-2 italic">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Leads by Source</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.leadsBySource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLeads" fill="#3b82f6" name="Total Leads" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Quality */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Lead Quality by Source</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.sourceQuality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hotLeads" stackId="a" fill="#ef4444" name="Hot" />
              <Bar dataKey="warmLeads" stackId="a" fill="#f59e0b" name="Warm" />
              <Bar dataKey="coldLeads" stackId="a" fill="#3b82f6" name="Cold" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Leads Over Time */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Leads Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalLeads" stroke="#3b82f6" name="Total Leads" strokeWidth={2} />
              <Line type="monotone" dataKey="hotLeads" stroke="#ef4444" name="Hot Leads" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Priority Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Lead Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.leadsByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.priority}: ${entry.totalLeads}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalLeads"
              >
                {analytics.leadsByPriority.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Source Performance Table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Source Performance Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Source</th>
                <th className="text-right p-3 font-semibold">Total Leads</th>
                <th className="text-right p-3 font-semibold">Avg Score</th>
                <th className="text-right p-3 font-semibold">Hot</th>
                <th className="text-right p-3 font-semibold">Warm</th>
                <th className="text-right p-3 font-semibold">Cold</th>
                <th className="text-right p-3 font-semibold">Quality Rating</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sourceQuality.map((source: any, index: number) => {
                const avgScore = parseFloat(source.avgScore || "0");
                const rating =
                  avgScore >= 70 ? "Excellent" : avgScore >= 50 ? "Good" : avgScore >= 30 ? "Fair" : "Poor";
                const ratingColor =
                  avgScore >= 70
                    ? "text-green-600"
                    : avgScore >= 50
                    ? "text-blue-600"
                    : avgScore >= 30
                    ? "text-yellow-600"
                    : "text-red-600";

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{source.source}</td>
                    <td className="text-right p-3">{source.totalLeads}</td>
                    <td className="text-right p-3">{avgScore.toFixed(1)}</td>
                    <td className="text-right p-3 text-red-600 font-semibold">{source.hotLeads}</td>
                    <td className="text-right p-3 text-orange-600">{source.warmLeads}</td>
                    <td className="text-right p-3 text-blue-600">{source.coldLeads}</td>
                    <td className={`text-right p-3 font-semibold ${ratingColor}`}>{rating}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contact Information Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Contact Information Availability</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{analytics.contactStats.withPhone}</p>
            <p className="text-sm text-gray-600 mt-1">With Phone</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{analytics.contactStats.withEmail}</p>
            <p className="text-sm text-gray-600 mt-1">With Email</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{analytics.contactStats.withBoth}</p>
            <p className="text-sm text-gray-600 mt-1">With Both</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{analytics.contactStats.noContact}</p>
            <p className="text-sm text-gray-600 mt-1">No Contact Info</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
