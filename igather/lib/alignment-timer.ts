const ALIGNMENT_TIMER_DEADLINE_KEY = "igather-alignment-timer-deadline-v1";

function nowMs(): number {
  return Date.now();
}

export function getAlignmentTimerDeadlineMs(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ALIGNMENT_TIMER_DEADLINE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setAlignmentTimerFromNow(seconds: number): number {
  const deadline = nowMs() + Math.max(0, seconds) * 1000;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(ALIGNMENT_TIMER_DEADLINE_KEY, String(deadline));
    } catch {
      /* ignore */
    }
  }
  return deadline;
}

export function ensureAlignmentTimer(seconds: number): number {
  const existing = getAlignmentTimerDeadlineMs();
  // IMPORTANT: don't reset an existing deadline (even if expired).
  if (existing) return existing;
  return setAlignmentTimerFromNow(seconds);
}

export function getAlignmentTimerRemainingSeconds(): number {
  const deadline = getAlignmentTimerDeadlineMs();
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - nowMs()) / 1000));
}

