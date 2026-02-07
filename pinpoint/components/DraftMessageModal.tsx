"use client";

import { useState, useEffect } from "react";
import { Pin } from "@/lib/types";
import { useApp } from "@/lib/context";

interface DraftMessageModalProps {
  pin: Pin;
  onClose: () => void;
}

export function DraftMessageModal({ pin, onClose }: DraftMessageModalProps) {
  const { unit, trackPin } = useApp();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generate() {
      setLoading(true);
      try {
        const res = await fetch("/api/draft-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, unit }),
        });
        const data = await res.json();
        setMessage(data.message);
      } catch {
        setMessage(
          "Hi! I'm interested in your listing. Could we schedule a viewing?"
        );
      }
      setLoading(false);
    }
    generate();
  }, [pin, unit]);

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMarkSent() {
    trackPin(pin.id, "messaged");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold">Draft Message</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-border hover:text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <p className="mb-2 text-xs text-muted">
            AI-generated message for &quot;{pin.title}&quot; — feel free to edit
          </p>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted">
              Generating message...
            </div>
          ) : (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={handleMarkSent}
            disabled={loading}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            Mark as Sent
          </button>
        </div>
      </div>
    </div>
  );
}
