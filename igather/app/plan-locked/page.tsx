"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { PageHeaderCentered, PrimaryButton } from "@/components/igather/page-surface";
import { getVenueById } from "@/lib/decision-board";
import {
  readLockedPlanForGroup,
  writeLockedPlanForGroup,
  type LockedPlanPayload,
} from "@/lib/locked-plan";
import { readActiveChatGroupId } from "@/lib/active-chat-group";
import { markGroupPlanVoteComplete } from "@/lib/chat-plan-vote";

const COMIC = "font-[family-name:var(--font-comic)]";
const BLUE = "#568DED";

const KOH = getVenueById("koh")!;

const FALLBACK_PLAN: LockedPlanPayload = {
  name: KOH.name,
  location: KOH.location,
  time: "8PM, March 17, 2026",
  who: "Everyone",
  image: KOH.image,
};

export default function PlanLockedPage() {
  const router = useRouter();

  const [plan] = useState<LockedPlanPayload>(() => {
    if (typeof window === "undefined") return FALLBACK_PLAN;
    const groupId = readActiveChatGroupId(0);
    return readLockedPlanForGroup(groupId) ?? FALLBACK_PLAN;
  });

  const heroSrc = useMemo(
    () =>
      plan.image ??
      "https://images.unsplash.com/photo-1455619453084-ce027a087568?w=800&q=80",
    [plan.image],
  );

  const pinInChat = () => {
    const groupId = readActiveChatGroupId(0);
    writeLockedPlanForGroup(groupId, plan);
    markGroupPlanVoteComplete(groupId);
    router.push(`/chat/${groupId}`);
  };

  return (
    <PhoneShell>
      <div className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Plan Locked" />

        <div className="igather-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
          <h2 className="text-center text-lg font-bold text-neutral-900">
            ✅ {plan.name}
          </h2>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-200">
            <Image
              src={heroSrc}
              alt={plan.name}
              fill
              className="object-cover"
              sizes="360px"
              priority
            />
          </div>
          <div className="space-y-2 text-sm font-semibold" style={{ color: BLUE }}>
            <p>Location: {plan.location}</p>
            <p>Time: {plan.time}</p>
            <p>Who: {plan.who}</p>
          </div>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <PrimaryButton href="/decision-board">
            View Decision Board
          </PrimaryButton>
          <button
            type="button"
            onClick={pinInChat}
            className="flex w-full items-center justify-center rounded-2xl border border-neutral-200/95 bg-white py-3.5 text-sm font-semibold text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
          >
            📌 Pin in Group Chat
          </button>
        </footer>
      </div>
    </PhoneShell>
  );
}
