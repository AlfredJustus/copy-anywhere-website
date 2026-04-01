"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ThumbsUpIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const ThumbsDownIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);

type FeedbackState = "idle" | "thumbs-up-done" | "thumbs-down-form" | "submitting" | "done";

interface FeedbackWidgetProps {
  blocks: any[];
  sourceHtml?: string;
  inputSource?: string;
  pageUrl?: string;
}

export function FeedbackWidget({ blocks, sourceHtml, inputSource, pageUrl }: FeedbackWidgetProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [comment, setComment] = useState("");

  const submit = async (rating: "up" | "down", commentText?: string) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: commentText || undefined,
          blocksJson: rating === "down" ? blocks : undefined,
          sourceHtml: rating === "down" ? sourceHtml : undefined,
          inputSource,
          pageUrl: pageUrl || window.location.pathname,
        }),
      });
    } catch {
      // Silently fail — feedback is best-effort
    }
  };

  const handleThumbsUp = async () => {
    setState("thumbs-up-done");
    await submit("up");
  };

  const handleThumbsDown = () => {
    setState("thumbs-down-form");
  };

  const handleSubmitComment = async () => {
    setState("submitting");
    await submit("down", comment);
    setState("done");
  };

  if (state === "thumbs-up-done") {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
        <ThumbsUpIcon filled />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
        <span>Thanks for helping us improve!</span>
      </div>
    );
  }

  if (state === "thumbs-down-form" || state === "submitting") {
    return (
      <div className="flex flex-col gap-2 py-3 px-1">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went wrong? (optional)"
          className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          autoFocus
          disabled={state === "submitting"}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmitComment}
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "Sending..." : "Send feedback"}
          </Button>
          <button
            onClick={() => setState("idle")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={state === "submitting"}
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your converted content will be included to help us diagnose the issue.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <span className="text-sm text-muted-foreground">How was the result?</span>
      <button
        onClick={handleThumbsUp}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Good result"
      >
        <ThumbsUpIcon />
      </button>
      <button
        onClick={handleThumbsDown}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Bad result"
      >
        <ThumbsDownIcon />
      </button>
    </div>
  );
}
