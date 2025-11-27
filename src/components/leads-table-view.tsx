"use client";

import type { Lead } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsTableViewProps {
  leads: Lead[];
  onViewDetails: (lead: Lead) => void;
  onDelete?: (id: number) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-red-600 bg-red-50";
  if (score >= 60) return "text-orange-600 bg-orange-50";
  return "text-blue-600 bg-blue-50";
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "text-red-700 bg-red-100";
    case "high":
      return "text-orange-700 bg-orange-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
}

export function LeadsTableView({ leads, onViewDetails, onDelete }: LeadsTableViewProps) {
  const handleDelete = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
      return;
    }

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
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name & Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onViewDetails(lead)}
              >
                <td className="px-4 py-3">
                  <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm", getScoreColor(lead.score))}>
                    {lead.score}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <div className="font-semibold text-gray-900 truncate">{lead.name}</div>
                    <div className="text-sm text-gray-500 truncate">{lead.location}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-md">
                    <p className="text-sm text-gray-700 line-clamp-2 break-words">{lead.request}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex px-2 py-1 text-xs font-medium rounded-full uppercase", getPriorityColor(lead.priority))}>
                    {lead.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{lead.source}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(lead);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={(e) => handleDelete(lead, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          No leads to display
        </div>
      )}
    </div>
  );
}
