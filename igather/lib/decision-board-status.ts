"use client";

export type DecisionCardStatus = "discussing" | "ready";

const KEY = "igather-decision-board-status-v1";

type StatusMap = Record<string, DecisionCardStatus>;

export function readDecisionBoardStatusMap(): StatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object" || Array.isArray(p)) return {};
    const out: StatusMap = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      if (v === "ready" || v === "discussing") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeDecisionBoardStatusMap(statuses: StatusMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(statuses));
  } catch {
    /* ignore */
  }
}

export function clearDecisionBoardStatusMap(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

