"use client";

import { useState } from "react";
import type { Lead } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, DollarSign, Clock, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsGridViewProps {
  leads: Lead[];
  onViewDetails: (lead: Lead) => void;
  onDelete?: (id: number) => void;
}

function getScoreGradient(score: number): string {
  if (score >= 80) return "from-red-500 to-orange-500";
  if (score >= 60) return "from-orange-400 to-yellow-400";
  return "from-blue-400 to-cyan-400";
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function LeadsGridView({ leads, onViewDetails, onDelete }: LeadsGridViewProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
      return;
    }

    setDeletingId(lead.id);
    try {
      const response = await fetch(`/api/leads?id=${lead.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(lead.id);
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    } finally {
      setDeletingId(null);
    }
  };

  const revenue = (lead: Lead) => {
    if (lead.revenueMin && lead.revenueMax) {
      return `$${(lead.revenueMin / 1000).toFixed(0)}k-$${(lead.revenueMax / 1000).toFixed(0)}k`;
    }
    return "Not specified";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {leads.map((lead) => (
        <Card
          key={lead.id}
          className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4"
          style={{
            borderLeftColor: lead.score >= 80 ? "#ef4444" : lead.score >= 60 ? "#f97316" : "#3b82f6"
          }}
          onClick={() => onViewDetails(lead)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{lead.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{lead.location}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full font-bold text-lg text-white bg-gradient-to-r",
                getScoreGradient(lead.score)
              )}>
                {lead.score}
              </div>
              <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border uppercase", getPriorityColor(lead.priority))}>
                {lead.priority}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">{lead.postedTime}</span>
            </div>
            <span>•</span>
            <span className="font-medium text-blue-600">{lead.source}</span>
          </div>

          {/* Request */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3 break-words">{lead.request}</p>
          </div>

          {/* Why Hot */}
          {lead.whyHot && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-900 line-clamp-2 break-words">
                <span className="font-semibold">Why Hot:</span> {lead.whyHot}
              </p>
            </div>
          )}

          {/* Action Required */}
          {lead.actionRequired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-900 line-clamp-2 break-words">
                <span className="font-semibold">Action Required:</span> {lead.actionRequired}
              </p>
            </div>
          )}

          {/* Revenue & Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 flex-wrap">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
              <span className="whitespace-nowrap">{revenue(lead)}</span>
            </div>

            <div className="flex-1"></div>

            {lead.phone && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${lead.phone}`;
                }}
                className="gap-1"
              >
                <Phone className="h-3 w-3" />
                Call
              </Button>
            )}

            {lead.email && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `mailto:${lead.email}`;
                }}
                className="gap-1"
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleDelete(lead, e)}
                disabled={deletingId === lead.id}
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <Trash2 className="h-3 w-3" />
                {deletingId === lead.id ? "..." : "Delete"}
              </Button>
            )}
          </div>

          {/* Auto-submitted badge */}
          {lead.autoSubmitted === 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Auto-submitted
              </span>
            </div>
          )}
        </Card>
      ))}

      {leads.length === 0 && (
        <div className="col-span-2 p-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          No leads to display
        </div>
      )}
    </div>
  );
}
