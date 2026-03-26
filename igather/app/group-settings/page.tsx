"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { BorderedCard, primaryButtonClass } from "@/components/igather/page-surface";
import {
  clampTimerSeconds,
  readGroupSettings,
  writeGroupSettings,
} from "@/lib/group-settings";
import { PAST_SUCCESSFUL_HANGOUTS } from "@/lib/past-successful-hangouts";
import { readActiveChatGroupId } from "@/lib/active-chat-group";
import { getChatGroupName } from "@/lib/chat-groups";
import { readLockedPlanForGroup } from "@/lib/locked-plan";

const BLUE = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";
const MIN_S = 30;
const MAX_S = 180;

export default function GroupSettingsPage() {
  const router = useRouter();
  const [duration, setDuration] = useState(60);
  const [activeGroupId, setActiveGroupId] = useState(0);
  const [lockedPlan, setLockedPlan] = useState(false);

  const activeGroupName = useMemo(
    () => getChatGroupName(activeGroupId),
    [activeGroupId],
  );

  useEffect(() => {
    setDuration(readGroupSettings().startTimerSeconds);
    const id = readActiveChatGroupId(0);
    setActiveGroupId(id);
    setLockedPlan(!!readLockedPlanForGroup(id));
  }, []);

  const fillPct = useMemo(
    () => ((duration - MIN_S) / (MAX_S - MIN_S)) * 100,
    [duration],
  );

  const handleSave = () => {
    if (lockedPlan) return;
    writeGroupSettings({ startTimerSeconds: clampTimerSeconds(duration) });
    router.push(`/chat/${activeGroupId}`);
  };

  return (
    <PhoneShell>
      <div className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <header className="shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-5 pt-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <Link
              href={`/chat/${activeGroupId}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-900 transition hover:bg-black/[0.06] active:bg-black/[0.1]"
              aria-label="Back"
            >
              <ArrowLeft className="size-6" strokeWidth={2} />
            </Link>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-xl"
                aria-hidden
              >
                🦦
              </div>
              <span className="truncate text-sm font-semibold text-neutral-900">
                {activeGroupName}
              </span>
            </div>
            <div className="size-10 shrink-0" aria-hidden />
          </div>
        </header>

        <div className="igather-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <section>
            <h2 className="mb-3 text-sm font-bold text-neutral-900">
              iGather Start Timer
            </h2>
            <BorderedCard className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-neutral-900">
                  Timer Duration
                </span>
                <span className="text-sm font-bold" style={{ color: BLUE }}>
                  {duration}s
                </span>
              </div>
              <div>
                <input
                  type="range"
                  min={MIN_S}
                  max={MAX_S}
                  step={1}
                  value={duration}
                  onChange={(e) =>
                    setDuration(clampTimerSeconds(Number(e.target.value)))
                  }
                  disabled={lockedPlan}
                  className={`gather-timer-range block w-full cursor-pointer ${
                    lockedPlan ? "pointer-events-none opacity-50 blur-[0.5px]" : ""
                  }`}
                  style={
                    {
                      "--gather-fill": `${fillPct}%`,
                    } as CSSProperties
                  }
                  aria-valuemin={MIN_S}
                  aria-valuemax={MAX_S}
                  aria-valuenow={duration}
                  aria-label="Timer duration in seconds"
                />
                <div className="mt-2 flex justify-between text-xs font-semibold text-neutral-600">
                  <span>30s</span>
                  <span>180s</span>
                </div>
              </div>
            </BorderedCard>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-neutral-900">
              Past Successful Hangouts
            </h2>
            <div className="space-y-4">
              {PAST_SUCCESSFUL_HANGOUTS.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <Image
                      src={h.image}
                      alt={h.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900">{h.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-600">{h.date}</p>
                    <p
                      className="mt-0.5 text-xs font-semibold"
                      style={{ color: BLUE }}
                    >
                      {h.tag}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-neutral-900">
                    {h.people} people
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="shrink-0 px-4 pb-8 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className={primaryButtonClass}
            style={{ backgroundColor: BLUE }}
            disabled={lockedPlan}
          >
            Save Settings
          </button>
        </footer>
      </div>
    </PhoneShell>
  );
}
