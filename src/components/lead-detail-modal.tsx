"use client";

import { useState } from "react";
import type { Lead } from "@/lib/db/schema";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { Phone, Mail, MapPin, DollarSign, Clock, ExternalLink, User, Trash2 } from "lucide-react";

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

export function LeadDetailModal({ lead, isOpen, onClose, onDelete }: LeadDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!lead) return null;

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
        onClose();
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

  const revenue = lead.revenueMin && lead.revenueMax
    ? `$${lead.revenueMin.toLocaleString()} - $${lead.revenueMax.toLocaleString()}`
    : "Not specified";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-start justify-between w-full">
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                {lead.location}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`bg-gradient-to-r ${
                lead.score >= 80 ? "from-red-500 to-orange-500" :
                lead.score >= 60 ? "from-orange-400 to-yellow-400" :
                "from-blue-400 to-cyan-400"
              } text-white font-bold rounded-full px-4 py-2 text-lg`}>
                Score: {lead.score}
              </div>
              <Chip
                color={
                  lead.priority === "urgent" ? "danger" :
                  lead.priority === "high" ? "warning" :
                  "default"
                }
                variant="flat"
              >
                {lead.priority.toUpperCase()}
              </Chip>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600 pb-4 border-b">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{lead.postedTime}</span>
              </div>
              <span>•</span>
              <span className="font-medium text-blue-600">{lead.source}</span>
              {lead.autoSubmitted === 1 && (
                <>
                  <span>•</span>
                  <Chip size="sm" color="success" variant="dot">
                    Auto-submitted
                  </Chip>
                </>
              )}
            </div>

            {/* Request */}
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">REQUEST</h3>
              <p className="text-base">{lead.request}</p>
            </div>

            {/* Why Hot */}
            {lead.whyHot && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-amber-900 mb-2">WHY THIS IS HOT</h3>
                <p className="text-sm text-amber-800">{lead.whyHot}</p>
              </div>
            )}

            {/* Action Required */}
            {lead.actionRequired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-red-900 mb-2">ACTION REQUIRED</h3>
                <p className="text-sm text-red-800">{lead.actionRequired}</p>
              </div>
            )}

            {/* Revenue */}
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-sm text-green-900">ESTIMATED REVENUE</h3>
                <p className="text-lg font-bold text-green-700">{revenue}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              {lead.phone && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Phone</span>
                  </div>
                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}

              {lead.email && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                  </div>
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline break-all">
                    {lead.email}
                  </a>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="space-y-2">
              {lead.profileUrl && (
                <Button
                  variant="flat"
                  color="default"
                  startContent={<User className="h-4 w-4" />}
                  endContent={<ExternalLink className="h-4 w-4" />}
                  as="a"
                  href={lead.profileUrl}
                  target="_blank"
                  className="w-full"
                >
                  View Profile
                </Button>
              )}

              {lead.originalPostUrl && (
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<ExternalLink className="h-4 w-4" />}
                  as="a"
                  href={lead.originalPostUrl}
                  target="_blank"
                  className="w-full"
                >
                  View Original Post
                </Button>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 pt-4 border-t">
              <div>Created: {new Date(lead.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(lead.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex w-full items-center justify-between">
            <div>
              {onDelete && (
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Trash2 className="h-4 w-4" />}
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete Lead
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button color="default" variant="light" onPress={onClose}>
                Close
              </Button>
              {lead.phone && (
                <Button
                  color="primary"
                  startContent={<Phone className="h-4 w-4" />}
                  as="a"
                  href={`tel:${lead.phone}`}
                >
                  Call Now
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
