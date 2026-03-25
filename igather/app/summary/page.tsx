"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
  SecondaryButton,
} from "@/components/igather/page-surface";

const BLUE = "#568DED";

/** 1:58 */
const INITIAL_TIMEOUT_SECONDS = 118;

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SummaryPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_TIMEOUT_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace("/timeout");
      return;
    }
    const t = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, router]);

  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-white font-[family-name:var(--font-comic)]">
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
              <p>Budget: $30-50</p>
              <p>Time: 6:00pm to 8:00pm</p>
              <p>Travel: ≤ 30 min</p>
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
          <SecondaryButton href="/chat">
            Send Reminder (Organizer Only)
          </SecondaryButton>
        </footer>
      </div>
    </PhoneShell>
  );
}
