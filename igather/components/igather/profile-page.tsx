"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { BottomNav } from "@/components/igather/bottom-nav";
import {
  AvailabilityEditor,
  DEFAULT_AVAILABILITY,
  type Segment,
} from "@/components/igather/availability-editor";

const SAVE_CORAL = "#FF6B6B";
const STORAGE_KEY = "igather-profile-v1";

type StoredProfile = {
  availability: Segment[][];
  budget: string;
  travel: string;
};

function loadProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredProfile;
    if (!p || !Array.isArray(p.availability)) return null;
    return p;
  } catch {
    return null;
  }
}

export function ProfilePage() {
  const [budget, setBudget] = useState("$100");
  const [travel, setTravel] = useState("30 min");
  const [availability, setAvailability] =
    useState<Segment[][]>(DEFAULT_AVAILABILITY);
  const [hydrated, setHydrated] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setBudget(p.budget);
      setTravel(p.travel);
      setAvailability(p.availability);
    }
    setHydrated(true);
  }, []);

  const handleSave = useCallback(() => {
    const payload: StoredProfile = {
      availability,
      budget,
      travel,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveHint("Saved locally");
      window.setTimeout(() => setSaveHint(null), 2500);
    } catch {
      setSaveHint("Save failed");
    }
  }, [availability, budget, travel]);

  return (
    <PhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col bg-[#FAFAFA]">
        <header className="shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-4 pt-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
          <h1 className="text-center text-lg font-bold text-neutral-900">
            Profile
          </h1>
        </header>

        <div className="igather-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-36 pt-4">
          <div className="flex flex-col items-center">
            <div
              className="flex size-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-b from-sky-100 to-indigo-100 text-5xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] ring-1 ring-neutral-200/80"
              aria-hidden
            >
              🪽
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
              Ethan
            </p>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold text-neutral-900">
              Availability
            </h2>
            {hydrated && (
              <AvailabilityEditor
                value={availability}
                onChange={setAvailability}
              />
            )}
            {!hydrated && (
              <div
                className="h-[240px] animate-pulse rounded-2xl bg-neutral-100"
                aria-hidden
              />
            )}
          </section>

          <section className="mt-8 space-y-5">
            <div>
              <h2 className="mb-2 text-sm font-bold text-neutral-900">Budget</h2>
              <label className="sr-only" htmlFor="budget">
                Budget
              </label>
              <input
                id="budget"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-full border border-black bg-white px-4 py-3.5 text-center text-sm font-medium text-neutral-900 outline-none transition focus:ring-2 focus:ring-[#568DED]/40"
              />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-bold text-neutral-900">Travel</h2>
              <label className="sr-only" htmlFor="travel">
                Travel
              </label>
              <input
                id="travel"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                className="w-full rounded-full border border-neutral-200 bg-white px-4 py-3.5 text-center text-sm font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#568DED]/50 focus:ring-2 focus:ring-[#568DED]/35"
              />
            </div>
          </section>

          <div className="mt-10 space-y-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,107,0.4)] transition hover:brightness-[1.03] active:scale-[0.99]"
              style={{ backgroundColor: SAVE_CORAL }}
            >
              Save Settings
            </button>
            {saveHint && (
              <p className="text-center text-xs text-neutral-500">{saveHint}</p>
            )}
          </div>
        </div>

        <BottomNav active="profile" />
      </div>
    </PhoneShell>
  );
}
