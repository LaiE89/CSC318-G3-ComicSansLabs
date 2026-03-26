"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { PageHeaderCentered } from "@/components/igather/page-surface";
import { readGroupSettings } from "@/lib/group-settings";
import { writeLockedPlanForGroup } from "@/lib/locked-plan";
import { DEFAULT_PROFILE, readProfile } from "@/lib/profile-storage";
import { readActiveChatGroupId } from "@/lib/active-chat-group";
import { DECISION_VENUES, type DecisionVenue } from "@/lib/decision-board";

const PRIMARY = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";

type BoardView = "initial" | "locked" | "failed";

type BoardRow = {
  venue: DecisionVenue;
  votes: number;
  max: number;
};

function DiscussingCard({
  row,
  onArrow,
  showArrow,
}: {
  row: BoardRow;
  onArrow: (venue: DecisionVenue) => void;
  showArrow: boolean;
}) {
  const href = `/decision-board/${row.venue.id}`;
  return (
    <div className="relative">
      <div
        className="relative flex min-h-[4.25rem] min-w-0 flex-1 items-stretch overflow-hidden rounded-xl text-white shadow-sm"
        style={{ backgroundColor: PRIMARY }}
      >
        <Link
          href={href}
          className={`flex min-w-0 flex-1 flex-col justify-center py-3 pl-3 ${showArrow ? "pr-[3.25rem]" : "pr-3"}`}
        >
          <p className="text-sm font-bold leading-tight">{row.venue.name}</p>
          <p className="mt-1 text-xs font-semibold text-white/95">
            {row.votes}/{row.max}
          </p>
        </Link>
        {showArrow && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onArrow(row.venue);
            }}
            className="absolute bottom-2 right-2 z-10 flex size-9 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-neutral-100 active:scale-95"
            style={{ color: PRIMARY }}
            aria-label={`Move ${row.venue.name} to Ready and start vote`}
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

function ReadyCard({ row }: { row: BoardRow }) {
  const href = `/decision-board/${row.venue.id}`;
  return (
    <div className="flex items-stretch gap-1">
      <span
        className="flex w-6 shrink-0 items-center justify-center text-white/90"
        aria-hidden
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} />
      </span>
      <Link
        href={href}
        className="flex min-w-0 flex-1 flex-col justify-center rounded-xl px-3 py-3 text-white shadow-[0_4px_16px_rgba(86,141,237,0.28)] ring-1 ring-white/15"
        style={{ backgroundColor: PRIMARY }}
      >
        <p className="text-sm font-bold leading-tight">{row.venue.name}</p>
        <p className="mt-1 text-xs font-semibold text-white/95">
          {row.votes}/{row.max}
        </p>
      </Link>
    </div>
  );
}

export default function DecisionBoardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as BoardView | null) ?? "initial";

  const [profileName, setProfileName] = useState(() => DEFAULT_PROFILE.name);

  const koh = useMemo(
    () => DECISION_VENUES.find((v) => v.id === "koh")!,
    [],
  );
  const fox = useMemo(
    () => DECISION_VENUES.find((v) => v.id === "fox")!,
    [],
  );
  const dear = useMemo(
    () => DECISION_VENUES.find((v) => v.id === "dear")!,
    [],
  );

  useEffect(() => {
    setProfileName(readProfile().name);
  }, []);

  const kohDisplay = useMemo(
    () => ({ ...koh, organizer: profileName, proposer: profileName }),
    [koh, profileName],
  );
  const foxDisplay = useMemo(
    () => ({ ...fox, organizer: profileName, proposer: profileName }),
    [fox, profileName],
  );
  const dearDisplay = useMemo(
    () => ({ ...dear, organizer: profileName, proposer: profileName }),
    [dear, profileName],
  );

  const defaultDiscussing = useMemo<BoardRow[]>(
    () => [
      { venue: kohDisplay, votes: 0, max: 5 },
      { venue: foxDisplay, votes: 0, max: 5 },
      { venue: dearDisplay, votes: 0, max: 5 },
    ],
    [kohDisplay, foxDisplay, dearDisplay],
  );

  const [discussing, setDiscussing] = useState<BoardRow[]>(defaultDiscussing);
  const [ready, setReady] = useState<BoardRow[]>([]);

  const [voteOpen, setVoteOpen] = useState(false);
  const [voteModalVenue, setVoteModalVenue] = useState<DecisionVenue | null>(
    null,
  );
  const [voteSecondsLeft, setVoteSecondsLeft] = useState(60);
  const [voteChoice, setVoteChoice] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    if (voteOpen) setVoteChoice(null);
  }, [voteOpen]);

  useEffect(() => {
    if (view === "initial") {
      setDiscussing(defaultDiscussing);
      setReady([]);
    }
  }, [view, defaultDiscussing]);

  const staticLayout = useMemo(() => {
    if (view === "locked") {
      return {
        discussing: [{ venue: foxDisplay, votes: 0, max: 5 }],
        ready: [{ venue: kohDisplay, votes: 5, max: 5 }],
      };
    }
    if (view === "failed") {
      return {
        discussing: [{ venue: foxDisplay, votes: 0, max: 5 }],
        ready: [{ venue: kohDisplay, votes: 4, max: 5 }],
      };
    }
    return null;
  }, [view, kohDisplay, foxDisplay, dearDisplay]);

  const displayDiscussing =
    view === "initial" ? discussing : staticLayout!.discussing;
  const displayReady = view === "initial" ? ready : staticLayout!.ready;

  const onPressArrow = useCallback((venue: DecisionVenue) => {
    setDiscussing((prev) => prev.filter((r) => r.venue.id !== venue.id));
    setReady((prev) => [...prev, { venue, votes: 5, max: 5 }]);
    setVoteModalVenue(venue);
    setVoteOpen(true);
  }, []);

  useEffect(() => {
    if (!voteOpen) return;
    setVoteSecondsLeft(readGroupSettings().startTimerSeconds);
    const id = window.setInterval(() => {
      setVoteSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [voteOpen]);

  const closeVoteModal = useCallback(() => {
    setVoteOpen(false);
    setVoteModalVenue(null);
  }, []);

  const onVoteYes = useCallback(() => {
    if (!voteModalVenue) return;
    setVoteChoice("yes");
    setReady((prev) =>
      prev.map((r) =>
        r.venue.id === voteModalVenue.id
          ? { ...r, votes: 5, max: 5 }
          : r,
      ),
    );
    writeLockedPlanForGroup(readActiveChatGroupId(0), {
      name: voteModalVenue.name,
      location: voteModalVenue.location,
      time: "8PM, March 17, 2026",
      who: "Everyone",
      image: voteModalVenue.image,
    });
    closeVoteModal();
    router.push("/plan-locked");
  }, [voteModalVenue, closeVoteModal, router]);

  return (
    <PhoneShell>
      <div className={`relative flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Decision Board" backHref="/chat" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h2 className="mb-2 text-center text-xs font-bold text-neutral-800">
                Discussing
              </h2>
              <div className="min-h-[12rem] space-y-3 rounded-2xl border border-neutral-200 bg-neutral-100/80 p-3">
                {displayDiscussing.map((row) => (
                  <DiscussingCard
                    key={row.venue.id}
                    row={row}
                    onArrow={onPressArrow}
                    showArrow={view === "initial"}
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-center text-xs font-bold text-neutral-800">
                Ready
              </h2>
              <div className="min-h-[12rem] space-y-3 rounded-2xl border border-neutral-200 bg-neutral-100/80 p-3">
                {displayReady.length === 0 ? (
                  <p className="px-1 py-8 text-center text-xs text-neutral-400">
                    Nothing here yet
                  </p>
                ) : (
                  displayReady.map((row) => (
                    <ReadyCard key={row.venue.id} row={row} />
                  ))
                )}
              </div>
            </div>
          </div>

          {view === "locked" && (
            <div className="mt-6">
              <Link
                href="/plan-locked"
                className="flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                Continue to Plan Locked
              </Link>
            </div>
          )}
        </div>

        {voteOpen && voteModalVenue && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-modal-title"
            onClick={closeVoteModal}
          >
            <div
              className="relative z-10 w-full max-w-[min(100%,20rem)] rounded-2xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="vote-modal-title"
                className="text-center text-base font-bold text-neutral-900"
              >
                Decision for {voteModalVenue.name} at {voteModalVenue.timeLabel}
              </h2>
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={onVoteYes}
                  aria-pressed={voteChoice === "yes"}
                  className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-neutral-200/90 px-4 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300/90 active:scale-[0.99] ${
                    voteChoice === "yes"
                      ? "ring-2 ring-[#568DED] ring-offset-1"
                      : ""
                  }`}
                >
                  <span>Yes</span>
                  <span className="text-neutral-600">5 votes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoteChoice("no")}
                  aria-pressed={voteChoice === "no"}
                  className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-neutral-200/90 px-4 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300/90 active:scale-[0.99] ${
                    voteChoice === "no"
                      ? "ring-2 ring-[#568DED] ring-offset-1"
                      : ""
                  }`}
                >
                  <span>No</span>
                  <span className="text-neutral-600">0 votes</span>
                </button>
              </div>
              <p
                className="mt-3 text-center text-xs italic"
                style={{ color: PRIMARY }}
              >
                {voteSecondsLeft > 0
                  ? `1 vote left - ${voteSecondsLeft} sec remaining...`
                  : "Time's up..."}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeVoteModal();
                  router.push("/decision-board/view-pending");
                }}
                className="mt-5 w-full text-center text-sm font-semibold underline"
                style={{ color: PRIMARY }}
              >
                View Pending
              </button>
              <button
                type="button"
                onClick={closeVoteModal}
                className="mt-4 w-full rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
