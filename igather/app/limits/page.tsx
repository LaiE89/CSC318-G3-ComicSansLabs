"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderWithBack,
} from "@/components/igather/page-surface";
import { readProfile, updateProfile } from "@/lib/profile-storage";
import type { Segment } from "@/components/igather/availability-editor";

const PRIMARY = "#568DED";
const STORAGE_KEY = "igather-limits";
const DEFAULT_TIME_WINDOW_MINUTES = 150; // 2.5 hours

// AvailabilityEditor chart mapping: 0..1 maps to 7am..11pm (16 hours).
const AVAIL_START_MINUTES = 7 * 60;
const AVAIL_END_MINUTES = 23 * 60;
const AVAIL_SPAN_MINUTES = AVAIL_END_MINUTES - AVAIL_START_MINUTES;

type LimitsState = {
  budget: string;
  timeRange: string;
  travel: string;
  availabilityFingerprint?: string;
};

type EditingField = "budget" | "time" | "travel" | null;

function parseTravelMinutes(travel: string): number {
  const m = travel.match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 30;
  return Number.isFinite(n) ? Math.min(120, Math.max(5, n)) : 30;
}

export default function LimitsPage() {
  const router = useRouter();
  const [budget, setBudget] = useState("$30-$50");
  const [timeRange, setTimeRange] = useState("6:00pm to 8:30pm");
  const [travel, setTravel] = useState("30 minutes");
  const [editing, setEditing] = useState<EditingField>(null);
  const [travelMinutes, setTravelMinutes] = useState(30);
  const [availabilityFingerprint, setAvailabilityFingerprint] =
    useState<string>("");
  const budgetInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  const formatTime = (minutesFromMidnight: number) => {
    const m = Math.floor(minutesFromMidnight);
    const h24 = ((Math.floor(m / 60) % 24) + 24) % 24;
    const mins = ((m % 60) + 60) % 60;
    const ampm = h24 < 12 ? "am" : "pm";
    const h12Raw = h24 % 12;
    const h12 = h12Raw === 0 ? 12 : h12Raw;
    return `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  };

  const defaultTimeRangeFromAvailability = (availability: Segment[][]) => {
    let best: { startMin: number; endMin: number } | null = null;

    for (const day of availability) {
      for (const seg of day) {
        const startMin = AVAIL_START_MINUTES + seg.start * AVAIL_SPAN_MINUTES;
        const endMin = AVAIL_START_MINUTES + seg.end * AVAIL_SPAN_MINUTES;
        if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;
        if (endMin <= startMin) continue;

        if (!best || startMin < best.startMin) {
          best = { startMin, endMin };
        }
      }
    }

    if (!best) return "6:00pm to 8:30pm";
    // Default should mirror an actual availability slot.
    return `${formatTime(best.startMin)} to ${formatTime(best.endMin)}`;
  };

  useEffect(() => {
    try {
      const profile = readProfile();
      if (profile.budget) setBudget(profile.budget);
      if (profile.travel) {
        setTravel(profile.travel);
        setTravelMinutes(parseTravelMinutes(profile.travel));
      }

      const fingerprintAvailability = (
        availability: Segment[][],
      ): string => {
        // Ignore Segment `id` so the fingerprint only depends on start/end.
        const normalized = availability.map((day) =>
          day
            .map((s) => ({
              start: Math.round(s.start * 10000) / 10000,
              end: Math.round(s.end * 10000) / 10000,
            }))
            .sort((a, b) => a.start - b.start),
        );

        // Simple stable hash to keep storage small.
        const str = JSON.stringify(normalized);
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(16);
      };

      const computedFingerprint = fingerprintAvailability(
        profile.availability,
      );
      setAvailabilityFingerprint(computedFingerprint);

      const computedDefaultTime = defaultTimeRangeFromAvailability(
        profile.availability,
      );

      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setTimeRange(computedDefaultTime);
        return;
      }
      const p = JSON.parse(raw) as Partial<LimitsState>;

      const shouldUseStoredTime =
        typeof p.availabilityFingerprint === "string" &&
        p.availabilityFingerprint === computedFingerprint;

      if (!shouldUseStoredTime) {
        setTimeRange(computedDefaultTime);
      } else if (p.timeRange) {
        setTimeRange(p.timeRange);
      } else {
        setTimeRange(computedDefaultTime);
      }

      if (p.budget) setBudget(p.budget);
      if (p.travel) {
        setTravel(p.travel);
        setTravelMinutes(parseTravelMinutes(p.travel));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (editing === "budget") {
      budgetInputRef.current?.focus();
      budgetInputRef.current?.select();
    } else if (editing === "time") {
      timeInputRef.current?.focus();
      timeInputRef.current?.select();
    }
  }, [editing]);

  const persistState = useCallback(
    (overrides?: Partial<LimitsState>) => {
      const payload: LimitsState = {
        budget,
        timeRange,
        travel,
        ...overrides,
        availabilityFingerprint,
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }

      // Keep budget/travel in the shared profile so other screens pre-fill.
      try {
        updateProfile({
          budget: payload.budget,
          travel: payload.travel,
        });
      } catch {
        /* ignore */
      }
    },
    [budget, timeRange, travel, availabilityFingerprint],
  );

  const commitTravelFromSlider = useCallback(() => {
    const t = `${travelMinutes} minutes`;
    setTravel(t);
    persistState({ travel: t });
  }, [travelMinutes, persistState]);

  const finishTextEdit = useCallback(() => {
    setEditing(null);
    persistState();
  }, [persistState]);

  const onKeyDownText = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") finishTextEdit();
    if (e.key === "Escape") setEditing(null);
  };

  const openEdit = (field: NonNullable<EditingField>) => {
    if (editing === "travel" && field !== "travel") {
      commitTravelFromSlider();
    }
    if (editing === field) {
      if (field === "travel") commitTravelFromSlider();
      persistState();
      setEditing(null);
      return;
    }
    setEditing(field);
    if (field === "travel") {
      setTravelMinutes(parseTravelMinutes(travel));
    }
  };

  const handleNext = () => {
    const travelFinal =
      editing === "travel" ? `${travelMinutes} minutes` : travel;
    persistState({ travel: travelFinal });
    router.push("/summary");
  };

  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-white font-[family-name:var(--font-comic)]">
        <PageHeaderWithBack
          title="Review your personal constraints."
          backHref="/chat"
          subtitle={
            <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
              <p>pre-filled from your profile</p>
              <p>click to modify.</p>
            </div>
          }
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <button
            type="button"
            onClick={() => openEdit("budget")}
            className="w-full text-left"
          >
            <BorderedCard
              className={`transition hover:bg-neutral-50 active:bg-neutral-100 ${
                editing === "budget" ? "ring-2 ring-[#568DED]" : ""
              }`}
            >
              <h2 className="text-sm font-bold text-neutral-900">Budget</h2>
              {editing === "budget" ? (
                <input
                  ref={budgetInputRef}
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onBlur={finishTextEdit}
                  onKeyDown={onKeyDownText}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#568DED]/40"
                  style={{ color: PRIMARY, borderColor: PRIMARY }}
                  aria-label="Budget"
                />
              ) : (
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: PRIMARY }}
                >
                  {budget}
                </p>
              )}
            </BorderedCard>
          </button>

          <button
            type="button"
            onClick={() => openEdit("time")}
            className="w-full text-left"
          >
            <BorderedCard
              className={`transition hover:bg-neutral-50 active:bg-neutral-100 ${
                editing === "time" ? "ring-2 ring-[#568DED]" : ""
              }`}
            >
              <h2 className="text-sm font-bold text-neutral-900">Time</h2>
              {editing === "time" ? (
                <input
                  ref={timeInputRef}
                  type="text"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  onBlur={finishTextEdit}
                  onKeyDown={onKeyDownText}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#568DED]/40"
                  style={{ color: PRIMARY, borderColor: PRIMARY }}
                  placeholder="e.g. 6:00pm to 8:00pm"
                  aria-label="Time window"
                />
              ) : (
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: PRIMARY }}
                >
                  {timeRange}
                </p>
              )}
            </BorderedCard>
          </button>

          <button
            type="button"
            onClick={() => openEdit("travel")}
            className="w-full text-left"
          >
            <BorderedCard
              className={`transition hover:bg-neutral-50 active:bg-neutral-100 ${
                editing === "travel" ? "ring-2 ring-[#568DED]" : ""
              }`}
            >
              <h2 className="text-sm font-bold text-neutral-900">Travel</h2>
              {editing === "travel" ? (
                <div className="mt-3 space-y-3">
                  <p
                    className="text-center text-sm font-semibold"
                    style={{ color: PRIMARY }}
                  >
                    {travelMinutes} minutes
                  </p>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={travelMinutes}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTravelMinutes(v);
                    }}
                    className="w-full accent-[#568DED]"
                    aria-label="Max travel time in minutes"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>5 min</span>
                    <span>120 min</span>
                  </div>
                </div>
              ) : (
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: PRIMARY }}
                >
                  {travel}
                </p>
              )}
            </BorderedCard>
          </button>
        </div>

        <footer className="shrink-0 px-4 pb-8 pt-2">
          <button
            type="button"
            onClick={handleNext}
            className="flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
            style={{ backgroundColor: PRIMARY }}
          >
            Next
          </button>
        </footer>
      </div>
    </PhoneShell>
  );
}
