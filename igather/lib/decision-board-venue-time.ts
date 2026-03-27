"use client";

const STORAGE_KEY = "igather-decision-board-venue-times-v1";

type TimeStore = Record<string, string>;

function readAll(): TimeStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" && !Array.isArray(p)
      ? (p as TimeStore)
      : {};
  } catch {
    return {};
  }
}

export function readVenueTimeOverride(venueId: string): string | null {
  const v = readAll()[venueId];
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export function writeVenueTimeOverride(venueId: string, time: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readAll(), [venueId]: time.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("igather-venue-time-changed"));
}

export function getVenueTimeDisplay(venueId: string, fallback: string): string {
  return readVenueTimeOverride(venueId) ?? fallback;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Parse labels like "7:30 PM", "19:30", "7:30pm" → "HH:mm" (24h) */
function parseTimeToHHmm(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${pad2(h)}:${pad2(min)}`;
    }
  }

  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${pad2(h)}:${pad2(min)}`;
    }
  }

  const mH = t.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (mH) {
    let h = parseInt(mH[1], 10);
    const ap = mH[2].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h >= 0 && h <= 23) {
      return `${pad2(h)}:00`;
    }
  }

  return null;
}

function hhmmToDisplay(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = parseInt(hRaw ?? "", 10);
  const m = parseInt(mRaw ?? "", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function addMinutesToHHmm(hhmm: string, deltaMin: number): string {
  const [hRaw, mRaw] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return hhmm;
  let total = hRaw * 60 + mRaw + deltaMin;
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** Split stored display string into start/end HH:mm; default end is start + 2h */
export function parseStoredToRangeHHmm(
  stored: string,
  singleFallback: string,
): { start: string; end: string } {
  const parts = stored
    .split(/\s*[–—-]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const a = parseTimeToHHmm(parts[0]!);
    const b = parseTimeToHHmm(parts[1]!);
    if (a && b) return { start: a, end: b };
  }

  const one =
    parseTimeToHHmm(parts[0] ?? stored) ??
    parseTimeToHHmm(singleFallback);
  if (one) {
    return { start: one, end: addMinutesToHHmm(one, 120) };
  }

  return { start: "19:30", end: "21:30" };
}

export function formatTimeRangeForStorage(startHHmm: string, endHHmm: string): string {
  const s = (startHHmm || "19:30").slice(0, 5);
  const e = (endHHmm || "21:30").slice(0, 5);
  return `${hhmmToDisplay(s)} – ${hhmmToDisplay(e)}`;
}

/** Values for `<input type="time">` from override + venue default label */
export function getVenueTimeRangeHHmm(
  venueId: string,
  fallbackLabel: string,
): { start: string; end: string } {
  const stored = readVenueTimeOverride(venueId);
  if (stored) {
    return parseStoredToRangeHHmm(stored, fallbackLabel);
  }
  return parseStoredToRangeHHmm(fallbackLabel, fallbackLabel);
}
