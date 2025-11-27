"use client";

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

interface YouTubeLeadsTableProps {
  leads: YouTubeLead[];
  onGenerateReply: (id: string) => void;
  onSkip: (id: string) => void;
  onPostReply: (id: string) => void;
}

export function YouTubeLeadsTable({ leads, onGenerateReply, onSkip, onPostReply }: YouTubeLeadsTableProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg overflow-hidden shadow-xl shadow-black/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User & Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Comment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.priority === 'Hot'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}
                    >
                      {lead.priority}
                    </span>
                    <span className="text-xs text-gray-400">Score: {lead.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <a
                      href={lead.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-400 hover:text-blue-300 truncate"
                    >
                      {lead.name}
                    </a>
                    <span className="text-sm text-gray-400 truncate">{lead.location}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(lead.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-md">
                    <p className="text-sm text-white line-clamp-2">{lead.message}</p>
                    <a
                      href={lead.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                    >
                      <Youtube className="h-3 w-3" />
                      View on YouTube
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    lead.status === 'posted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    lead.status === 'ready' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    lead.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {lead.status || 'pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {lead.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => onGenerateReply(lead.id)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onSkip(lead.id)}
                          size="sm"
                          variant="outline"
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <SkipForward className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    {lead.status === 'generating' && (
                      <Button disabled size="sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </Button>
                    )}

                    {lead.status === 'ready' && (
                      <>
                        <Button
                          onClick={() => onPostReply(lead.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onGenerateReply(lead.id)}
                          size="sm"
                          variant="outline"
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    {lead.status === 'posting' && (
                      <Button disabled size="sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="p-12 text-center text-gray-400">
          No leads to display
        </div>
      )}
    </div>
  );
}
