"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { getVenueById } from "@/lib/decision-board";

const COMIC = "font-[family-name:var(--font-comic)]";
const PRIMARY = "#568DED";

const THREAD: { id: string; role: "in" | "out"; text: string; showAvatar?: boolean }[] = [
  { id: "1", role: "in", text: "guys", showAvatar: true },
  { id: "2", role: "in", text: "heyy" },
  { id: "3", role: "in", text: "Dinner this week?" },
  { id: "4", role: "out", text: "I'm down!" },
  { id: "5", role: "out", text: "Too many ideas..." },
  { id: "6", role: "in", text: "What Cuisine?", showAvatar: true },
];

function SmallAvatar({ label }: { label: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-xs font-normal lowercase text-neutral-800">
      {label}
    </div>
  );
}

export default function VenueDiscussionPage() {
  const params = useParams();
  const venueId = typeof params.venueId === "string" ? params.venueId : "";
  const venue = getVenueById(venueId);

  if (!venue) {
    return (
      <PhoneShell>
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 px-6 ${COMIC}`}>
          <p className="text-center text-sm text-neutral-600">Venue not found.</p>
          <Link
            href="/decision-board"
            className="text-sm font-semibold underline"
            style={{ color: PRIMARY }}
          >
            Back to Decision Board
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <header className="shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-4 pt-10">
          <div className="flex items-center gap-2">
            <Link
              href="/decision-board"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-900"
              aria-label="Back"
            >
              <span className="text-xl" aria-hidden>
                ←
              </span>
            </Link>
            <h1 className="flex-1 text-center text-lg font-bold text-neutral-900">
              Decision Board
            </h1>
            <div className="size-10 shrink-0" aria-hidden />
          </div>
        </header>

        <div className="shrink-0 border-b border-neutral-100 px-4 py-4">
          <h2 className="text-lg font-bold text-neutral-900">{venue.name}</h2>
          <div className="mt-3 space-y-1.5 text-sm font-semibold" style={{ color: PRIMARY }}>
            <p>Price: {venue.priceLabel}</p>
            <p>Location: {venue.location}</p>
            <p>Time: {venue.timeLabel}</p>
            <p className="text-neutral-800">
              Proposer: <span style={{ color: PRIMARY }}>{venue.proposer}</span>
            </p>
            <p className="text-neutral-800">
              Organizer: <span style={{ color: PRIMARY }}>{venue.organizer}</span>
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-4 pt-3">
          <p className="text-sm font-bold text-neutral-900">Comments:</p>
          <p className="mt-2 pb-3 text-center text-xs text-neutral-400">
            Nov 30, 2023, 9:41 AM
          </p>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3">
            {THREAD.map((m) => (
              <div
                key={m.id}
                className={`flex w-full gap-2 ${m.role === "out" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "in" && m.showAvatar && <SmallAvatar label="s" />}
                {m.role === "in" && !m.showAvatar && (
                  <div className="w-8 shrink-0" aria-hidden />
                )}
                <div
                  className={`max-w-[min(100%,18rem)] rounded-[1.5rem] px-4 py-2.5 text-sm leading-snug ${
                    m.role === "out"
                      ? "bg-black text-white"
                      : "bg-[#E8E8E8] text-neutral-900"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 rounded-t-[24px] bg-[#F0F0F0] px-4 pb-6 pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white"
              aria-label="More"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </button>
            <div className="h-12 flex-1 rounded-full border border-neutral-200 bg-white" />
          </div>
        </footer>
      </div>
    </PhoneShell>
  );
}
