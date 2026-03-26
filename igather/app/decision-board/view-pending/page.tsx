"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  primaryButtonClass,
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
const COMIC = "font-[family-name:var(--font-comic)]";

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ViewPendingPage() {
  const [secondsLeft, setSecondsLeft] = useState(
    DEFAULT_GROUP_SETTINGS.startTimerSeconds,
  );
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    setSecondsLeft(getAlignmentTimerRemainingSeconds());
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(
      () => setSecondsLeft(getAlignmentTimerRemainingSeconds()),
      1000,
    );
    return () => window.clearTimeout(t);
  }, [secondsLeft]);

  return (
    <PhoneShell>
      <div className={`relative flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Decision Board" backHref="/decision-board" />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <BorderedCard>
            <h2 className="text-sm font-bold text-neutral-900">Koh Lipe Thai</h2>
            <p className="mt-2 text-sm font-semibold" style={{ color: BLUE }}>
              8:00pm
            </p>
          </BorderedCard>

          <BorderedCard>
            <h2 className="text-sm font-bold text-neutral-900">Response Window</h2>
            <p className="mt-2 text-sm font-semibold" style={{ color: BLUE }}>
              Auto timeout in {formatCountdown(secondsLeft)}
            </p>
            <p className="mt-3 text-sm text-neutral-700">Waiting for:</p>
            <div className="mt-3 flex justify-center">
              <div
                className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-3xl"
                aria-hidden
              >
                🕵️
              </div>
            </div>
          </BorderedCard>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <Link
            href="/group-settings"
            className={primaryButtonClass}
            style={{ backgroundColor: BLUE }}
          >
            Set Auto-time out (Organizer Only)
          </Link>
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
            aria-labelledby="pending-reminder-title"
            onClick={() => setReminderOpen(false)}
          >
            <div
              className="pointer-events-auto shrink-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  id="pending-reminder-title"
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
