"use client";

import type { DecisionVenue } from "@/lib/decision-board";

/** Prefer localStorage so board layout survives SPA navigations reliably. */
const KEY = "igather-decision-board-snapshot-v1";
const LEGACY_SESSION_KEY = "igather-decision-board-snapshot-v1";

export type BoardRowPersisted = {
  venue: DecisionVenue;
  votes: number;
  max: number;
};

export type BoardSnapshot = {
  /** Sorted joined active proposal ids, or "" when using default venues. */
  proposalIdsSig: string;
  discussing: BoardRowPersisted[];
  ready: BoardRowPersisted[];
};

function normalizeSig(s: string): string {
  return s.trim();
}

export function proposalIdsSignature(ids: string[] | null | undefined): string {
  if (!ids?.length) return "";
  return [...ids].map(String).sort().join(",");
}

export function snapshotSignatureMatches(
  stored: string | undefined,
  current: string,
): boolean {
  return normalizeSig(stored ?? "") === normalizeSig(current);
}

export function readBoardSnapshot(): BoardSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (legacy) {
        localStorage.setItem(KEY, legacy);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        raw = legacy;
      }
    }
    if (!raw) return null;
    const p = JSON.parse(raw) as BoardSnapshot & Record<string, unknown>;
    if (!p || typeof p !== "object") return null;
    if (typeof p.proposalIdsSig !== "string") return null;
    const discussing = Array.isArray(p.discussing) ? p.discussing : [];
    const ready = Array.isArray(p.ready) ? p.ready : [];
    return {
      proposalIdsSig: p.proposalIdsSig,
      discussing: discussing as BoardRowPersisted[],
      ready: ready as BoardRowPersisted[],
    };
  } catch {
    return null;
  }
}

export function writeBoardSnapshot(snapshot: BoardSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    const payload: BoardSnapshot = {
      proposalIdsSig: normalizeSig(snapshot.proposalIdsSig),
      discussing: snapshot.discussing,
      ready: snapshot.ready,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function clearBoardSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
