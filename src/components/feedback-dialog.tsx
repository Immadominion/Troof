"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export async function sendFeedback(payload: {
  message?: string;
  rating?: "up" | "down";
  page?: string;
  mode?: string;
}) {
  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, page: payload.page ?? (typeof window !== "undefined" ? window.location.pathname : undefined) }),
    });
  } catch {
    /* ignore */
  }
}

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    await sendFeedback({ message: text.trim() });
    setBusy(false);
    setText("");
    onOpenChange(false);
    toast.success("Thanks, feedback sent.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Give us feedback</DialogTitle>
          <DialogDescription>
            What worked, what didn&apos;t, what you&apos;d want next. Troof is early, this shapes it.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Your thoughts…"
          className="w-full resize-none rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !text.trim()}>
            {busy ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
