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
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function ChatListPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 px-5 pb-4 pt-10">
        <h1 className="text-2xl font-bold text-neutral-900">Find Groups</h1>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-28">
        {GROUPS.map((name) => (
          <Link
            key={name}
            href="/chat"
            className="flex w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            <GroupAvatar name={name} />
            <span className="text-sm font-medium text-neutral-900">{name}</span>
          </Link>
        ))}
      </div>

      <BottomNav active="chat" />
    </div>
  );
}
