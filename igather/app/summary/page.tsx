"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  DEFAULT_PROFILE,
  readProfile,
  type StoredProfile,
} from "@/lib/profile-storage";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
  secondaryButtonClass,
} from "@/components/igather/page-surface";
import {
  DEFAULT_GROUP_SETTINGS,
  readGroupSettings,
} from "@/lib/group-settings";
import {
  ensureAlignmentTimer,
  getAlignmentTimerRemainingSeconds,
} from "@/lib/alignment-timer";

const BLUE = "#568DED";

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SummaryPage() {
  const router = useRouter();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [profile, setProfile] = useState<StoredProfile>(() => DEFAULT_PROFILE);
  const [timeRange, setTimeRange] = useState<string>("6:00pm to 8:30pm");
  const [secondsLeft, setSecondsLeft] = useState(
    DEFAULT_GROUP_SETTINGS.startTimerSeconds,
  );

  useEffect(() => {
    setSecondsLeft(getAlignmentTimerRemainingSeconds());
  }, []);

  useEffect(() => {
    // Keep summary in sync with the user's profile edits.
    setProfile(readProfile());
  }, []);

  useEffect(() => {
    // Keep time display in sync with the "limits" page state.
    // "limits" persists it to sessionStorage under this key.
    try {
      const raw = sessionStorage.getItem("igather-limits");
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<{
        timeRange: string;
      }>;
      if (p.timeRange) setTimeRange(p.timeRange);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace("/timeout");
      return;
    }
    const t = window.setTimeout(() => {
      setSecondsLeft(getAlignmentTimerRemainingSeconds());
    }, 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, router]);

  return (
    <PhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col bg-white font-[family-name:var(--font-comic)]">
        <PageHeaderCentered title="Alignment Summary" backHref="/limits" />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <BorderedCard>
            <h2 className="text-sm font-bold text-neutral-900">Purpose</h2>
            <p className="mt-2 text-sm font-semibold" style={{ color: BLUE }}>
              Restaurant
            </p>
          </BorderedCard>

          <BorderedCard>
            <h2 className="text-sm font-bold text-neutral-900">Limits</h2>
            <div
              className="mt-2 space-y-1 text-sm font-semibold"
              style={{ color: BLUE }}
            >
              <p>Name: {profile.name}</p>
              <p>Budget: {profile.budget}</p>
              <p>Time: {timeRange}</p>
              <p>Travel: ≤ {profile.travel.replace(/[^0-9]/g, "") || "0"} min</p>
            </div>
          </BorderedCard>

          <BorderedCard>
            <h2 className="text-sm font-bold text-neutral-900">
              Response Window
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              Auto timeout in {formatCountdown(secondsLeft)}
            </p>
            <p className="mt-3 text-sm text-neutral-700">Waiting for:</p>
            <div className="mt-3 flex justify-center">
              <div
                className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-3xl"
                aria-hidden
              >
                🦎
              </div>
            </div>
          </BorderedCard>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <PrimaryButton href="/timeout">Force Timeout (Organizer Only)</PrimaryButton>
          <button
            type="button"
            onClick={() => setReminderOpen(true)}
            className={secondaryButtonClass}
          >
            Send Reminder (Organizer Only)
          </button>
        </footer>

        {reminderOpen && (
          <div
            className="absolute inset-0 z-20 flex flex-col bg-black/45 p-4 pt-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-popup-title"
          >
            <div className="pointer-events-auto shrink-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <span
                  id="reminder-popup-title"
                  className="text-sm font-bold text-neutral-900"
                >
                  iGather
                </span>
                <button
                  type="button"
                  onClick={() => setReminderOpen(false)}
                  className="rounded-full p-1 text-neutral-600 transition hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <X className="size-5" strokeWidth={2} />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-800">
                David has been notified to submit his personal constraints.
              </p>
            </div>
            <button
              type="button"
              className="min-h-0 flex-1 w-full cursor-default"
              aria-label="Dismiss"
              onClick={() => setReminderOpen(false)}
            />
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
