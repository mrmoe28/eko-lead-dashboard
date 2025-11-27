"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, RefreshCw, Send, SkipForward, Loader2, CheckCircle2, XCircle, LayoutGrid, Table, List, MessageSquare } from "lucide-react";
import { YouTubeLeadsTable } from "@/components/youtube-leads-table";
import { YouTubeLeadsList } from "@/components/youtube-leads-list";
import { YouTubeReplyModal } from "@/components/youtube-reply-modal";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "list" | "table";

interface YouTubeLead {
  id: string;
  priority: string;
  score: number;
  source: string;
  name: string;
  location: string;
  message: string;
  profileUrl: string;
  postUrl: string;
  timestamp: string;
  intent: string;
  phone: string;
  email: string;
  generatedReply?: string;
  status?: 'pending' | 'generating' | 'ready' | 'posting' | 'posted' | 'skipped';
  youtubeUrl?: string;
}

export default function YouTubeLeadsPage() {
  const [leads, setLeads] = useState<YouTubeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<YouTubeLead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const response = await fetch('/api/leads/youtube');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setLeads(data.leads.map((lead: YouTubeLead) => ({ ...lead, status: 'pending' })));
    } catch (err) {
      setError('Failed to fetch YouTube leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateReply(leadId: string) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setLeads(leads.map(l =>
      l.id === leadId ? { ...l, status: 'generating' as const } : l
    ));

    try {
      const response = await fetch('/api/leads/youtube/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadMessage: lead.message,
          priority: lead.priority,
          intent: lead.intent,
          location: lead.location,
          leadName: lead.name,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        setLeads(leads.map(l =>
          l.id === leadId ? { ...l, status: 'pending' as const } : l
        ));
        return;
      }

      setLeads(leads.map(l =>
        l.id === leadId
          ? { ...l, generatedReply: data.reply, status: 'ready' as const }
          : l
      ));
    } catch (err) {
      console.error('Error generating reply:', err);
      alert('Failed to generate reply');
      setLeads(leads.map(l =>
        l.id === leadId ? { ...l, status: 'pending' as const } : l
      ));
    }
  }

  async function postReply(leadId: string) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.generatedReply) return;

    setLeads(leads.map(l =>
      l.id === leadId ? { ...l, status: 'posting' as const } : l
    ));

    try {
      // Extract comment ID from post URL
      const commentMatch = lead.postUrl.match(/lc=([^&]+)/);
      const commentId = commentMatch ? commentMatch[1] : lead.postUrl;

      const response = await fetch('/api/leads/youtube/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          replyText: lead.generatedReply,
          leadName: lead.name,
          priority: lead.priority,
          intent: lead.intent,
          videoUrl: lead.postUrl,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        setLeads(leads.map(l =>
          l.id === leadId ? { ...l, status: 'ready' as const } : l
        ));
        return;
      }

      setLeads(leads.map(l =>
        l.id === leadId
          ? { ...l, status: 'posted' as const, youtubeUrl: data.youtubeUrl }
          : l
      ));

      alert('Reply posted successfully to YouTube!');
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to post reply to YouTube');
      setLeads(leads.map(l =>
        l.id === leadId ? { ...l, status: 'ready' as const } : l
      ));
    }
  }

  function skipLead(leadId: string) {
    setLeads(leads.map(l =>
      l.id === leadId ? { ...l, status: 'skipped' as const } : l
    ));
  }

  function updateReply(leadId: string, newReply: string) {
    setLeads(leads.map(l =>
      l.id === leadId ? { ...l, generatedReply: newReply } : l
    ));
  }

  function openReplyModal(lead: YouTubeLead) {
    setSelectedLeadForModal(lead);
    setReplyModalOpen(true);
  }

  function updateModalReply(newReply: string) {
    if (selectedLeadForModal) {
      updateReply(selectedLeadForModal.id, newReply);
      setSelectedLeadForModal({ ...selectedLeadForModal, generatedReply: newReply });
    }
  }

  function extractVideoId(url: string): string | null {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  const activeLeads = leads.filter(l => l.status !== 'posted' && l.status !== 'skipped');
  const postedCount = leads.filter(l => l.status === 'posted').length;
  const skippedCount = leads.filter(l => l.status === 'skipped').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading YouTube leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Leads</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchLeads}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background Mesh Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-red-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-[40%] -left-[15%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] right-[20%] w-[650px] h-[650px] bg-pink-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950/50 to-black" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <Youtube className="h-8 w-8 text-red-500" />
              YouTube Lead Replies
            </h1>
            <p className="text-gray-400 mt-1">
              Review and post AI-generated replies to YouTube comments
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Controls */}
            <div className="flex items-center gap-1 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                  viewMode === "card"
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30"
                    : "text-gray-400 hover:text-white hover:bg-slate-700"
                )}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Card</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                  viewMode === "list"
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30"
                    : "text-gray-400 hover:text-white hover:bg-slate-700"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200",
                  viewMode === "table"
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30"
                    : "text-gray-400 hover:text-white hover:bg-slate-700"
                )}
                title="Table View"
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <Button
              onClick={fetchLeads}
              variant="outline"
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
            <div className="text-sm text-gray-400">Total Leads</div>
            <div className="text-2xl font-bold text-white">{leads.length}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-blue-500/30 shadow-xl shadow-black/50 hover:border-blue-500/50 transition-all">
            <div className="text-sm text-blue-400">Pending</div>
            <div className="text-2xl font-bold text-blue-400">{activeLeads.length}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-green-500/30 shadow-xl shadow-black/50 hover:border-green-500/50 transition-all">
            <div className="text-sm text-green-400">Posted</div>
            <div className="text-2xl font-bold text-green-400">{postedCount}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50 backdrop-blur-xl border-gray-500/30 shadow-xl shadow-black/50 hover:border-gray-500/50 transition-all">
            <div className="text-sm text-gray-400">Skipped</div>
            <div className="text-2xl font-bold text-gray-400">{skippedCount}</div>
          </Card>
        </div>

        {/* Lead Views */}
        {activeLeads.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
            <p className="text-gray-400 mb-4">
              You've reviewed all YouTube leads. Posted: {postedCount}, Skipped: {skippedCount}
            </p>
            <Button
              onClick={fetchLeads}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Check for New Leads
            </Button>
          </Card>
        ) : (
          <>
            {viewMode === "list" && (
              <YouTubeLeadsList
                leads={activeLeads}
                onGenerateReply={generateReply}
                onSkip={skipLead}
                onPostReply={postReply}
                onUpdateReply={updateReply}
              />
            )}

            {viewMode === "table" && (
              <YouTubeLeadsTable
                leads={activeLeads}
                onGenerateReply={generateReply}
                onSkip={skipLead}
                onPostReply={postReply}
              />
            )}

            {viewMode === "card" && (
              <div className="space-y-6">
                {activeLeads.map((lead) => (
                  <Card key={lead.id} className="p-6 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50 hover:border-slate-600/50 transition-all">
                    {/* Priority Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            lead.priority === 'Hot'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {lead.priority} Lead
                        </span>
                        <span className="text-sm text-gray-400">Score: {lead.score}</span>
                        <span className="text-sm text-gray-400">Intent: {lead.intent}</span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={lead.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-400 hover:text-blue-300"
                        >
                          {lead.name}
                        </a>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-400">{lead.location}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {new Date(lead.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={lead.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Youtube className="h-3 w-3" />
                        View on YouTube
                      </a>
                    </div>

                    {/* Original Comment */}
                    <div className="mb-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                      <p className="text-sm text-gray-400 mb-1 font-semibold">Their Comment:</p>
                      <p className="text-white">{lead.message}</p>
                    </div>

                    {/* Generated Reply */}
                    {lead.generatedReply && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2 font-semibold">Your Reply:</p>
                        <textarea
                          value={lead.generatedReply}
                          onChange={(e) => updateReply(lead.id, e.target.value)}
                          className="w-full p-3 bg-slate-900/50 border border-slate-600 text-white rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={lead.status === 'posting'}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {lead.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => generateReply(lead.id)}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate AI Reply
                          </Button>
                          <Button
                            onClick={() => skipLead(lead.id)}
                            variant="outline"
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Skip
                          </Button>
                        </>
                      )}

                      {lead.status === 'generating' && (
                        <Button disabled className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </Button>
                      )}

                      {lead.status === 'ready' && (
                        <>
                          <Button
                            onClick={() => postReply(lead.id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Approve & Post to YouTube
                          </Button>
                          <Button
                            onClick={() => generateReply(lead.id)}
                            variant="outline"
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button
                            onClick={() => skipLead(lead.id)}
                            variant="outline"
                            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Skip
                          </Button>
                        </>
                      )}

                      {lead.status === 'posting' && (
                        <Button disabled className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting to YouTube...
                        </Button>
                      )}
                    </div>

                    {/* Posted Success */}
                    {lead.status === 'posted' && lead.youtubeUrl && (
                      <div className="mt-4 space-y-4">
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2 text-green-400 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold">Posted Successfully!</span>
                          </div>
                          <a
                            href={lead.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View your reply on YouTube
                          </a>
                        </div>

                        {/* Embedded YouTube Video */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                          <p className="text-sm text-gray-400 mb-3 font-semibold">Your Reply on YouTube:</p>
                          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${extractVideoId(lead.postUrl)}?start=0`}
                              className="absolute top-0 left-0 w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Your reply is now visible in the comments section of this video
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
