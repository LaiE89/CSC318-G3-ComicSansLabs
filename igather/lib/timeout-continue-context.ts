"use client";

const KEY = "igather-timeout-continue-v1";

export type TimeoutContinueContext = {
  planSource: "new" | "past";
  pastLocationId: string | null;
};

export function writeTimeoutContinueContext(ctx: TimeoutContinueContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

export function readTimeoutContinueContext():
  | TimeoutContinueContext
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<TimeoutContinueContext>;
    if (p.planSource !== "new" && p.planSource !== "past") return null;
    const pastLocationId =
      typeof p.pastLocationId === "string" && p.pastLocationId.trim()
        ? p.pastLocationId.trim()
        : null;
    return {
      planSource: p.planSource,
      pastLocationId: p.planSource === "past" ? pastLocationId : null,
    };
  } catch {
    return null;
  }
}

export function clearTimeoutContinueContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
