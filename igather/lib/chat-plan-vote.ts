"use client";

type PollLike = {
  id?: unknown;
  type?: unknown;
  phase?: unknown;
  cancelledReason?: unknown;
};

const CHAT_LOG_PREFIX = "igather-chat-log-v1-";

/**
 * Mark the latest non-cancelled poll in a group's chat as complete.
 * We render this through the existing cancelled branch label.
 */
export function markGroupPlanVoteComplete(groupIndex: number): void {
  if (typeof window === "undefined") return;
  const key = `${CHAT_LOG_PREFIX}${groupIndex}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;

    const next = [...parsed];
    for (let i = next.length - 1; i >= 0; i--) {
      const item = next[i] as PollLike;
      if (item && item.type === "poll" && item.phase !== "cancelled") {
        next[i] = {
          ...(item as Record<string, unknown>),
          phase: "cancelled",
          cancelledReason: "Plan complete",
        };
        localStorage.setItem(key, JSON.stringify(next));
        return;
      }
    }
  } catch {
    /* ignore */
  }
}

