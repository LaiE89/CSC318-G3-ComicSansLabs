"use client";

const KEY = "igather-decision-board-active-proposal-ids-v1";

/** Persist which proposal rows survived private constraints (for Decision Board). */
export function writeActiveProposalIdsForBoard(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = [...new Set(ids)];
    sessionStorage.setItem(KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
}

export function readActiveProposalIdsForBoard(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return null;
    const raw2 = p.filter((x): x is string => typeof x === "string");
    return [...new Set(raw2)];
  } catch {
    return null;
  }
}

export function clearActiveProposalIdsForBoard(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
