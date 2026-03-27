"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { getVenueForBoardDetail } from "@/lib/decision-board";
import {
  formatTimeRangeForStorage,
  getVenueTimeRangeHHmm,
  writeVenueTimeOverride,
} from "@/lib/decision-board-venue-time";
import {
  readVenueChatLog,
  writeVenueChatLog,
  type VenueChatMsg,
} from "@/lib/decision-board-venue-chat";
import { DEFAULT_PROFILE, readProfile } from "@/lib/profile-storage";

const COMIC = "font-[family-name:var(--font-comic)]";
const PRIMARY = "#568DED";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const OTHER_REPLIES = [
  "Sounds good to me!",
  "I'm in if we lock a time.",
  "Maybe weekend works better?",
  "What about parking there?",
  "I've been before—food was solid.",
  "Can we do a bit earlier?",
  "Let me check my calendar.",
  "Works for me 👍",
  "Anyone allergic to anything there?",
  "I'm neutral either way.",
  "Let's vote in the main chat too.",
  "Count me in!",
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
  const venueIdRaw = typeof params.venueId === "string" ? params.venueId : "";
  const venueId = venueIdRaw.trim();

  const [organizerName, setOrganizerName] = useState(
    () => DEFAULT_PROFILE.name,
  );

  const [messages, setMessages] = useState<VenueChatMsg[]>([]);
  const [didLoadChatLog, setDidLoadChatLog] = useState(false);
  const [draft, setDraft] = useState("");
  const [timeStart, setTimeStart] = useState("19:30");
  const [timeEnd, setTimeEnd] = useState("21:30");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOrganizerName(readProfile().name);
  }, []);

  useEffect(() => {
    if (!venueId) {
      setDidLoadChatLog(true);
      return;
    }
    setDidLoadChatLog(false);
    try {
      setMessages(readVenueChatLog(venueId));
    } catch {
      setMessages([]);
    }
    setDidLoadChatLog(true);
  }, [venueId]);

  useEffect(() => {
    if (!venueId || !didLoadChatLog) return;
    writeVenueChatLog(venueId, messages);
  }, [venueId, messages, didLoadChatLog]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const venue = useMemo(
    () =>
      venueId !== "" ? getVenueForBoardDetail(venueId, organizerName) : null,
    [venueId, organizerName],
  );

  useEffect(() => {
    if (!venueId || !venue) return;
    const { start, end } = getVenueTimeRangeHHmm(venueId, venue.timeLabel);
    setTimeStart(start);
    setTimeEnd(end);
  }, [venueId, venue]);

  const saveTimeRange = useCallback(
    (nextStart: string, nextEnd: string) => {
      if (!venueId) return;
      writeVenueTimeOverride(
        venueId,
        formatTimeRangeForStorage(nextStart, nextEnd),
      );
    },
    [venueId],
  );

  const sendOtherReply = useCallback((userText: string) => {
    const t = userText.toLowerCase();
    let reply =
      OTHER_REPLIES[Math.floor(Math.random() * OTHER_REPLIES.length)];

    if (t.includes("time") || t.includes("when")) {
      reply =
        "Good question on timing—I’m free most evenings after 6.";
    } else if (t.includes("price") || t.includes("budget") || t.includes("$")) {
      reply = "Price-wise I’m okay if the group is.";
    } else if (t.includes("where") || t.includes("location") || t.includes("address")) {
      reply = "I can look up directions once we pick this spot.";
    }

    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "in",
        text: reply,
        showAvatar: true,
      },
    ]);
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "out", text },
    ]);
    setDraft("");
    window.setTimeout(() => sendOtherReply(text), 450);
  }, [draft, sendOtherReply]);

  if (!venueId || !venue) {
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
          <div className="mt-3 space-y-3 text-sm font-semibold">
            <p className="text-neutral-900">
              <span className="font-bold">Price: </span>
              <span className="font-semibold" style={{ color: PRIMARY }}>
                {venue.priceLabel}
              </span>
            </p>
            <p className="text-neutral-900">
              <span className="font-bold">Location: </span>
              <span className="font-semibold" style={{ color: PRIMARY }}>
                {venue.location}
              </span>
            </p>
            <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 text-neutral-900">
              <span className="shrink-0 font-bold">Time: </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTimeStart(v);
                    saveTimeRange(v, timeEnd);
                  }}
                  className="min-h-[2.75rem] min-w-[6.5rem] flex-1 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-semibold outline-none focus:border-[#568DED]/45 focus:ring-2 focus:ring-[#568DED]/25 [color-scheme:light]"
                  style={{ color: PRIMARY }}
                  aria-label="Start of preferred time range"
                />
                <span className="shrink-0 text-xs font-semibold text-neutral-500">
                  to
                </span>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTimeEnd(v);
                    saveTimeRange(timeStart, v);
                  }}
                  className="min-h-[2.75rem] min-w-[6.5rem] flex-1 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-semibold outline-none focus:border-[#568DED]/45 focus:ring-2 focus:ring-[#568DED]/25 [color-scheme:light]"
                  style={{ color: PRIMARY }}
                  aria-label="End of preferred time range"
                />
              </div>
            </div>
            <p className="text-neutral-900">
              <span className="font-bold">Proposer: </span>
              <span className="font-semibold" style={{ color: PRIMARY }}>
                {organizerName}
              </span>
            </p>
            <p className="text-neutral-900">
              <span className="font-bold">Organizer: </span>
              <span className="font-semibold" style={{ color: PRIMARY }}>
                {organizerName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-3">
          <p className="shrink-0 text-sm font-bold text-neutral-900">Discussion</p>
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-2">
            <div className="flex flex-col gap-2.5 pr-1">
              {messages.length === 0 && (
                <p className="py-6 text-center text-xs text-neutral-400">
                  No messages yet. Say something below to start the thread for
                  this venue.
                </p>
              )}
              {messages.map((m) => (
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
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        <footer className="shrink-0 rounded-t-[24px] bg-[#F0F0F0] px-4 pb-6 pt-3">
          <div className="mx-auto flex w-full max-w-[19rem] items-center gap-2">
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white"
              aria-label="More"
            >
              <Plus className="size-5" strokeWidth={2.5} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-neutral-200 bg-white py-1 pl-3 pr-1 shadow-sm">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:ring-0"
                aria-label="Message"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-45"
                style={{ backgroundColor: PRIMARY }}
              >
                Send
              </button>
            </div>
          </div>
        </footer>
      </div>
    </PhoneShell>
  );
}
