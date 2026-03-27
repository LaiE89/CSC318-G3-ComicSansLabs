"use client";

const PREFIX = "igather-decision-board-chat-v1-";

export type VenueChatMsg = {
  id: string;
  role: "in" | "out";
  text: string;
  showAvatar?: boolean;
};

function storageKey(venueId: string): string {
  return `${PREFIX}${venueId}`;
}

export function readVenueChatLog(venueId: string): VenueChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(venueId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is VenueChatMsg => {
      if (typeof item !== "object" || item === null) return false;
      const m = item as Partial<VenueChatMsg>;
      return (
        typeof m.id === "string" &&
        (m.role === "in" || m.role === "out") &&
        typeof m.text === "string" &&
        (m.showAvatar === undefined || typeof m.showAvatar === "boolean")
      );
    });
  } catch {
    return [];
  }
}

export function writeVenueChatLog(
  venueId: string,
  messages: VenueChatMsg[],
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(venueId), JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}
