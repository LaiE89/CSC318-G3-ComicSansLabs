"use client";

import Link from "next/link";
import { MessageCircle, User } from "lucide-react";

type Active = "chat" | "profile";

export function BottomNav({ active }: { active: Active }) {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-10 flex gap-2 border-t border-neutral-200/80 bg-white/90 px-10 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center gap-1 transition-colors ${
          active === "chat"
            ? "text-[#568DED]"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        <MessageCircle className="size-6" strokeWidth={active === "chat" ? 2.25 : 1.5} />
        <span className="text-xs font-semibold">Chat</span>
      </Link>
      <Link
        href="/profile"
        className={`flex flex-1 flex-col items-center gap-1 transition-colors ${
          active === "profile"
            ? "text-[#568DED]"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        <User className="size-6" strokeWidth={active === "profile" ? 2.25 : 1.5} />
        <span className="text-xs font-medium">Profile</span>
      </Link>
    </nav>
  );
}
