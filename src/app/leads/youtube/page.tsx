"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, RefreshCw, Send, SkipForward, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-600" />
            YouTube Lead Replies
          </h1>
          <p className="text-gray-600 mt-1">
            Review and post AI-generated replies to YouTube comments
          </p>
        </div>
        <Button onClick={fetchLeads} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold">{leads.length}</div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-600">Pending</div>
          <div className="text-2xl font-bold text-blue-700">{activeLeads.length}</div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-sm text-green-600">Posted</div>
          <div className="text-2xl font-bold text-green-700">{postedCount}</div>
        </Card>
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-sm text-gray-600">Skipped</div>
          <div className="text-2xl font-bold text-gray-700">{skippedCount}</div>
        </Card>
      </div>

      {/* Lead Cards */}
      {activeLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
          <p className="text-gray-600 mb-4">
            You've reviewed all YouTube leads. Posted: {postedCount}, Skipped: {skippedCount}
          </p>
          <Button onClick={fetchLeads} variant="outline">
            Check for New Leads
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeLeads.map((lead) => (
            <Card key={lead.id} className="p-6">
              {/* Priority Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      lead.priority === 'Hot'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {lead.priority} Lead
                  </span>
                  <span className="text-sm text-gray-600">Score: {lead.score}</span>
                  <span className="text-sm text-gray-600">Intent: {lead.intent}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={lead.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {lead.name}
                  </a>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{lead.location}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {new Date(lead.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={lead.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Youtube className="h-3 w-3" />
                  View on YouTube
                </a>
              </div>

              {/* Original Comment */}
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Their Comment:</p>
                <p className="text-gray-900">{lead.message}</p>
              </div>

              {/* Generated Reply */}
              {lead.generatedReply && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Your Reply:</p>
                  <textarea
                    value={lead.generatedReply}
                    onChange={(e) => updateReply(lead.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate AI Reply
                    </Button>
                    <Button
                      onClick={() => skipLead(lead.id)}
                      variant="outline"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </>
                )}

                {lead.status === 'generating' && (
                  <Button disabled className="flex-1">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </Button>
                )}

                {lead.status === 'ready' && (
                  <>
                    <Button
                      onClick={() => postReply(lead.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Approve & Post to YouTube
                    </Button>
                    <Button
                      onClick={() => generateReply(lead.id)}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => skipLead(lead.id)}
                      variant="outline"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </>
                )}

                {lead.status === 'posting' && (
                  <Button disabled className="flex-1">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting to YouTube...
                  </Button>
                )}
              </div>

              {/* Posted Success */}
              {lead.status === 'posted' && lead.youtubeUrl && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Posted Successfully!</span>
                    </div>
                    <a
                      href={lead.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View your reply on YouTube
                    </a>
                  </div>

                  {/* Embedded YouTube Video */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Your Reply on YouTube:</p>
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
    </div>
  );
}
