"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Send, SkipForward, Loader2, Youtube } from "lucide-react";

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

interface YouTubeLeadsListProps {
  leads: YouTubeLead[];
  onGenerateReply: (id: string) => void;
  onSkip: (id: string) => void;
  onPostReply: (id: string) => void;
  onUpdateReply: (id: string, reply: string) => void;
}

export function YouTubeLeadsList({ leads, onGenerateReply, onSkip, onPostReply, onUpdateReply }: YouTubeLeadsListProps) {
  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <Card key={lead.id} className="p-4 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50 hover:border-slate-600/50 transition-all">
          <div className="flex items-start gap-4">
            {/* Priority & Score */}
            <div className="flex flex-col gap-2 items-center shrink-0">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  lead.priority === 'Hot'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {lead.priority}
              </span>
              <span className="text-xs text-gray-400">{lead.score}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* User Info */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                <span className="text-xs text-gray-500">
                  {new Date(lead.timestamp).toLocaleDateString()}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-400">{lead.intent}</span>
              </div>

              {/* Comment */}
              <div className="bg-slate-900/50 p-3 rounded-lg mb-2">
                <p className="text-sm text-white line-clamp-2">{lead.message}</p>
              </div>

              {/* Generated Reply */}
              {lead.generatedReply && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1 font-medium">Your Reply:</p>
                  <textarea
                    value={lead.generatedReply}
                    onChange={(e) => onUpdateReply(lead.id, e.target.value)}
                    className="w-full p-2 bg-slate-900/50 border border-slate-600 text-white text-sm rounded-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={lead.status === 'posting'}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={lead.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Youtube className="h-3 w-3" />
                  View on YouTube
                </a>

                <div className="flex-1"></div>

                {lead.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => onGenerateReply(lead.id)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                    <Button
                      onClick={() => onSkip(lead.id)}
                      size="sm"
                      variant="outline"
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <SkipForward className="h-3 w-3 mr-1" />
                      Skip
                    </Button>
                  </>
                )}

                {lead.status === 'generating' && (
                  <Button disabled size="sm">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </Button>
                )}

                {lead.status === 'ready' && (
                  <>
                    <Button
                      onClick={() => onPostReply(lead.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Post
                    </Button>
                    <Button
                      onClick={() => onGenerateReply(lead.id)}
                      size="sm"
                      variant="outline"
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => onSkip(lead.id)}
                      size="sm"
                      variant="outline"
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      Skip
                    </Button>
                  </>
                )}

                {lead.status === 'posting' && (
                  <Button disabled size="sm">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Posting...
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {leads.length === 0 && (
        <Card className="p-12 text-center bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/50">
          <p className="text-gray-400">No leads to display</p>
        </Card>
      )}
    </div>
  );
}
