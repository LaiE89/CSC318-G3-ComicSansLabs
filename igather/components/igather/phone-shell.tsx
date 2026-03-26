"use client";

import type { ReactNode } from "react";

/** Design size 402x874; scales down on small viewports to fit */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-b from-neutral-100 via-neutral-200/95 to-neutral-300/90 p-3 sm:p-6">
      <div
        className="relative flex min-h-0 flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22),0_12px_28px_-8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.07]"
        style={{
          width:
            "min(402px, calc(100vw - 24px), calc((100dvh - 24px) * 402 / 874))",
          aspectRatio: "402 / 874",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
