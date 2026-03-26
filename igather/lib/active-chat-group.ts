const STORAGE_KEY = "igather-active-chat-group-v1";

export function readActiveChatGroupId(defaultId = 0): number {
  if (typeof window === "undefined") return defaultId;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultId;
    const id = Number(raw);
    return Number.isFinite(id) ? Math.max(0, Math.floor(id)) : defaultId;
  } catch {
    return defaultId;
  }
}

export function writeActiveChatGroupId(groupId: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(groupId));
  } catch {
    /* ignore */
  }
}

