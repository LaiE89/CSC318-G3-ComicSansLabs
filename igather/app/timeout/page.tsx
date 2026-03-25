import { AlarmClock, Clock } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  PageHeaderCentered,
  PrimaryButton,
  SecondaryButton,
} from "@/components/igather/page-surface";

const BLUE = "#568DED";

export default function TimeoutPage() {
  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-white font-[family-name:var(--font-comic)]">
        <PageHeaderCentered title="Alignment Summary" backHref="/summary" />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
          <div className="flex justify-center">
            <span className="rounded-full bg-red-500 px-6 py-2 text-sm font-bold text-white">
              Time&apos;s Up
            </span>
          </div>

          <div
            className="relative mt-6 flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#568DED]/25 bg-gradient-to-b from-[#EAF1FD] to-[#F5F5F5]"
            role="img"
            aria-label="Time is up — alarm clock illustration"
          >
            <div className="relative flex items-center justify-center">
              <Clock
                className="absolute size-28 text-[#568DED]/25"
                strokeWidth={1.5}
                aria-hidden
              />
              <AlarmClock
                className="relative size-24 drop-shadow-sm"
                style={{ color: BLUE }}
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <p className="text-center text-sm font-bold text-neutral-700">
              Voting time has ended
            </p>
          </div>

          <p className="mt-6 text-center text-sm leading-relaxed text-neutral-800">
            As the organizer, you have the authority to choose the following...
          </p>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <PrimaryButton href="/suggestions">Continue with Plan</PrimaryButton>
          <SecondaryButton href="/chat">Cancel Plan</SecondaryButton>
        </footer>
      </div>
    </PhoneShell>
  );
}
