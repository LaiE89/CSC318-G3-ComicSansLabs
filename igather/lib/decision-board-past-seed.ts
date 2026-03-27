"use client";

const KEY = "igather-decision-board-past-location-v1";

/** Persist the past-hangout location id the user chose (localStorage survives navigation/remounts). */
export function writePastHangoutLocationId(id: string): void {
  if (typeof window === "undefined" || !id.trim()) return;
  try {
    localStorage.setItem(KEY, id.trim());
  } catch {
    /* ignore */
  }
}

export function readPastHangoutLocationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v?.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearPastHangoutLocationId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
