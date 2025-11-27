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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-lg shadow-black/50">
          <p className="text-white">No analytics data available</p>
        </Card>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-300 mt-1">Detailed insights and metrics to optimize your lead generation</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Leads</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {analytics.leadsBySource.reduce((sum: number, s: any) => sum + parseInt(s.totalLeads || "0"), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-green-500/20 transition-all hover:shadow-2xl hover:shadow-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Avg Lead Score</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {(
                  analytics.leadsBySource.reduce((sum: number, s: any) => sum + parseFloat(s.avgScore || "0"), 0) /
                  analytics.leadsBySource.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-purple-500/20 transition-all hover:shadow-2xl hover:shadow-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Success Rate</p>
              <p className="text-2xl font-bold mt-1 text-white">
                {(
                  (parseInt(analytics.sessionStats.completedSessions || "0") /
                    parseInt(analytics.sessionStats.totalSessions || "1")) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-orange-500/20 transition-all hover:shadow-2xl hover:shadow-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Contact Rate</p>
              <p className="text-2xl font-bold mt-1 text-white">
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
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-yellow-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-yellow-400" />
            AI-Powered Insights & Recommendations
          </h2>
          <div className="space-y-4">
            {analytics.insights.map((insight: Insight, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === "success"
                    ? "bg-green-500/10 border-green-500"
                    : insight.type === "warning"
                    ? "bg-yellow-500/10 border-yellow-500"
                    : insight.type === "danger"
                    ? "bg-red-500/10 border-red-500"
                    : "bg-blue-500/10 border-blue-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.type === "success" && <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />}
                  {insight.type === "warning" && <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />}
                  {insight.type === "danger" && <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                  {insight.type === "info" && <Info className="w-5 h-5 text-blue-400 mt-0.5" />}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{insight.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                    <p className="text-sm text-gray-400 mt-2 italic">
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
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-blue-500/20">
          <h2 className="text-xl font-bold mb-4 text-white">Leads by Source</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.leadsBySource}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
              <XAxis dataKey="source" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="totalLeads" fill="url(#colorLeads)" name="Total Leads" isAnimationActive={true} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Quality */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-purple-500/20">
          <h2 className="text-xl font-bold mb-4 text-white">Lead Quality by Source</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.sourceQuality}>
              <defs>
                <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="colorWarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.8}/>
                </linearGradient>
                <linearGradient id="colorCold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
              <XAxis dataKey="source" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="hotLeads" stackId="a" fill="url(#colorHot)" name="Hot" isAnimationActive={true} animationDuration={1500} />
              <Bar dataKey="warmLeads" stackId="a" fill="url(#colorWarm)" name="Warm" isAnimationActive={true} animationDuration={1500} animationDelay={200} />
              <Bar dataKey="coldLeads" stackId="a" fill="url(#colorCold)" name="Cold" isAnimationActive={true} animationDuration={1500} animationDelay={400} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Leads Over Time */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-green-500/20">
          <h2 className="text-xl font-bold mb-4 text-white">Leads Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.leadsOverTime}>
              <defs>
                <linearGradient id="colorTotalLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorHotLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="totalLeads" stroke="url(#colorTotalLine)" name="Total Leads" strokeWidth={3} isAnimationActive={true} animationDuration={2000} />
              <Line type="monotone" dataKey="hotLeads" stroke="url(#colorHotLine)" name="Hot Leads" strokeWidth={3} isAnimationActive={true} animationDuration={2000} animationDelay={300} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Priority Distribution */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-pink-500/20">
          <h2 className="text-xl font-bold mb-4 text-white">Lead Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={analytics.leadsByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.priority}: ${entry.totalLeads}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalLeads"
                isAnimationActive={true}
                animationDuration={1500}
              >
                {analytics.leadsByPriority.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Source Performance Table */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-cyan-500/20">
        <h2 className="text-xl font-bold mb-4 text-white">Source Performance Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 font-semibold text-gray-300">Source</th>
                <th className="text-right p-3 font-semibold text-gray-300">Total Leads</th>
                <th className="text-right p-3 font-semibold text-gray-300">Avg Score</th>
                <th className="text-right p-3 font-semibold text-gray-300">Hot</th>
                <th className="text-right p-3 font-semibold text-gray-300">Warm</th>
                <th className="text-right p-3 font-semibold text-gray-300">Cold</th>
                <th className="text-right p-3 font-semibold text-gray-300">Quality Rating</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sourceQuality.map((source: any, index: number) => {
                const avgScore = parseFloat(source.avgScore || "0");
                const rating =
                  avgScore >= 70 ? "Excellent" : avgScore >= 50 ? "Good" : avgScore >= 30 ? "Fair" : "Poor";
                const ratingColor =
                  avgScore >= 70
                    ? "text-green-400"
                    : avgScore >= 50
                    ? "text-blue-400"
                    : avgScore >= 30
                    ? "text-yellow-400"
                    : "text-red-400";

                return (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-medium text-white">{source.source}</td>
                    <td className="text-right p-3 text-gray-300">{source.totalLeads}</td>
                    <td className="text-right p-3 text-gray-300">{avgScore.toFixed(1)}</td>
                    <td className="text-right p-3 text-red-400 font-semibold">{source.hotLeads}</td>
                    <td className="text-right p-3 text-orange-400">{source.warmLeads}</td>
                    <td className="text-right p-3 text-blue-400">{source.coldLeads}</td>
                    <td className={`text-right p-3 font-semibold ${ratingColor}`}>{rating}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contact Information Stats */}
      <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-indigo-500/20">
        <h2 className="text-xl font-bold mb-4 text-white">Contact Information Availability</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
            <p className="text-3xl font-bold text-blue-400">{analytics.contactStats.withPhone}</p>
            <p className="text-sm text-gray-300 mt-1">With Phone</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all">
            <p className="text-3xl font-bold text-green-400">{analytics.contactStats.withEmail}</p>
            <p className="text-sm text-gray-300 mt-1">With Email</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
            <p className="text-3xl font-bold text-purple-400">{analytics.contactStats.withBoth}</p>
            <p className="text-sm text-gray-300 mt-1">With Both</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all">
            <p className="text-3xl font-bold text-red-400">{analytics.contactStats.noContact}</p>
            <p className="text-sm text-gray-300 mt-1">No Contact Info</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
