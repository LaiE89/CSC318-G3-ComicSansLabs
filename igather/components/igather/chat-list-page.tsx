"use client";

import Link from "next/link";
import { BottomNav } from "@/components/igather/bottom-nav";

const GROUPS = [
  "Comic Sans Lab",
  "The Inner Circle",
  "Chaos Committee",
  "No Context Needed",
  "Main Character Energy",
  "Braincell Exchange",
  "The Vibe Department",
  "Delulu Headquarters",
  "Unpaid Therapists",
];

function GroupAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200/90 text-sm font-bold text-neutral-700 shadow-inner ring-2 ring-white"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function ChatListPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#FAFAFA]">
      <header className="shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-5 pb-5 pt-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Find Groups
        </h1>
        <p className="mt-1 text-xs font-medium text-neutral-500">
          Tap a group to open chat
        </p>
      </header>

      <div className="igather-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-28 pt-4">
        {GROUPS.map((name) => (
          <Link
            key={name}
            href="/chat"
            className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-neutral-300 hover:shadow-md active:scale-[0.99]"
          >
            <GroupAvatar name={name} />
            <span className="text-sm font-semibold text-neutral-900">{name}</span>
          </Link>
        ))}
      </div>

      <BottomNav active="chat" />
    </div>
  );
}
