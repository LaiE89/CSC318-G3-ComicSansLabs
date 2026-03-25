"use client";

import Link from "next/link";
import { MessageCircle, User } from "lucide-react";

type Active = "chat" | "profile";

export function BottomNav({ active }: { active: Active }) {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-10 flex gap-2 border-t border-neutral-200 bg-neutral-100 px-10 py-3"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center gap-1 ${
          active === "chat" ? "text-neutral-900" : "text-neutral-400"
        }`}
      >
        <MessageCircle className="size-6" strokeWidth={active === "chat" ? 2.25 : 1.5} />
        <span className="text-xs font-medium">Chat</span>
      </Link>
      <Link
        href="/profile"
        className={`flex flex-1 flex-col items-center gap-1 ${
          active === "profile" ? "text-neutral-900" : "text-neutral-400"
        }`}
      >
        <User className="size-6" strokeWidth={active === "profile" ? 2.25 : 1.5} />
        <span className="text-xs font-medium">Profile</span>
      </Link>
    </nav>
  );
}
