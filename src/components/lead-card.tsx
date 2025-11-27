"use client";

import { useState } from "react";
import type { Lead } from "@/lib/db/schema";
import { Card, CardHeader, CardBody, Chip, Button } from "@heroui/react";
import { Phone, Mail, MapPin, DollarSign, Clock, Trash2 } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onViewDetails: (lead: Lead) => void;
  onDelete?: (id: number) => void;
}

function getPriorityColor(priority: string): "danger" | "warning" | "default" {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    default:
      return "default";
  }
}

function getScoreGradient(score: number): string {
  if (score >= 80) return "from-red-500 to-orange-500"; // Hot
  if (score >= 60) return "from-orange-400 to-yellow-400"; // Warm
  return "from-blue-400 to-cyan-400"; // Cold
}

export function LeadCard({ lead, onViewDetails, onDelete }: LeadCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const revenue = lead.revenueMin && lead.revenueMax
    ? `$${(lead.revenueMin / 1000).toFixed(0)}k-$${(lead.revenueMax / 1000).toFixed(0)}k`
    : "Not specified";

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
      return;
    }

    setIsDeleting(true);
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
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className="w-full hover:shadow-lg transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor: lead.score >= 80 ? "#ef4444" : lead.score >= 60 ? "#f97316" : "#3b82f6"
      }}
      isPressable
      onPress={() => onViewDetails(lead)}
    >
      <CardHeader className="flex flex-col items-start gap-2 pb-2">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">{lead.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{lead.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className={`bg-gradient-to-r ${getScoreGradient(lead.score)} text-white font-bold rounded-full px-3 py-1 text-sm`}>
                {lead.score}
              </div>
              {onDelete && (
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Chip color={getPriorityColor(lead.priority)} size="sm" variant="flat">
              {lead.priority.toUpperCase()}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{lead.postedTime}</span>
          <span className="mx-1">•</span>
          <span className="font-medium text-blue-600">{lead.source}</span>
        </div>

        <p className="text-sm line-clamp-2">{lead.request}</p>

        {lead.whyHot && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
            <p className="text-xs text-amber-800 line-clamp-2 break-words">
              <span className="font-semibold">Why Hot:</span> {lead.whyHot}
            </p>
          </div>
        )}

        {lead.actionRequired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <p className="text-xs text-red-800 line-clamp-2 break-words">
              <span className="font-semibold">Action Required:</span> {lead.actionRequired}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-medium whitespace-nowrap">{revenue}</span>
          </div>

          {lead.phone && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Phone className="h-3 w-3" />}
              as="a"
              href={`tel:${lead.phone}`}
            >
              Call
            </Button>
          )}

          {lead.email && (
            <Button
              size="sm"
              color="default"
              variant="flat"
              startContent={<Mail className="h-3 w-3" />}
              as="a"
              href={`mailto:${lead.email}`}
            >
              Email
            </Button>
          )}
        </div>

        {lead.autoSubmitted === 1 && (
          <Chip size="sm" color="success" variant="dot">
            Auto-submitted
          </Chip>
        )}
      </CardBody>
    </Card>
  );
}
