"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface YouTubeReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reply: string;
  onUpdate: (newReply: string) => void;
  isDisabled?: boolean;
}

export function YouTubeReplyModal({ isOpen, onClose, reply, onUpdate, isDisabled }: YouTubeReplyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Linkify function to convert URLs to hyperlinks
  const linkifyText = (text: string) => {
    // Replace website URLs with onboarding form link
    const websitePattern = /(www\.ekosolarpros\.com|ekosolarpros\.com)/gi;
    let linkedText = text.replace(websitePattern, (match) => {
      return `<a href="https://www.ekosolarpros.com/onboarding" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${match}</a>`;
    });

    // Replace other URLs with clickable links
    const urlPattern = /(?<!href=")(https?:\/\/[^\s<]+)/gi;
    linkedText = linkedText.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${url}</a>`;
    });

    // Replace email addresses
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    linkedText = linkedText.replace(emailPattern, (email) => {
      return `<a href="mailto:${email}" class="text-blue-400 hover:text-blue-300 underline">${email}</a>`;
    });

    // Replace phone numbers
    const phonePattern = /(\d{3}[-.]?\d{3}[-.]?\d{4})/g;
    linkedText = linkedText.replace(phonePattern, (phone) => {
      return `<a href="tel:${phone.replace(/[-\.]/g, '')}" class="text-blue-400 hover:text-blue-300 underline">${phone}</a>`;
    });

    return linkedText;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-purple-500/20 m-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Your Reply</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Editable Textarea */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Edit Reply:</label>
              <textarea
                value={reply}
                onChange={(e) => onUpdate(e.target.value)}
                className="w-full p-4 bg-slate-800 border border-slate-600 text-white rounded-lg min-h-[200px] focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={isDisabled}
                placeholder="Your AI-generated reply will appear here..."
              />
            </div>

            {/* Preview with Hyperlinks */}
            <div className="border-t border-slate-700 pt-4">
              <label className="text-sm text-gray-400 mb-2 block">Preview (with clickable links):</label>
              <div
                className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: linkifyText(reply) }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>
              💡 Links to your website will redirect to the onboarding form
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
