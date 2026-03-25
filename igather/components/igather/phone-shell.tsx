"use client";

import type { ReactNode } from "react";

/** Design size 402x874; scales down on small viewports to fit */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-200 p-3 sm:p-4">
      <div
        className="relative flex min-h-0 flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
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
