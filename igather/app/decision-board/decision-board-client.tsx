"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import { PageHeaderCentered } from "@/components/igather/page-surface";
import { readGroupSettings } from "@/lib/group-settings";
import { DEFAULT_PROFILE, readProfile } from "@/lib/profile-storage";
import {
  boardRowsFromActiveProposalIds,
  DECISION_VENUES,
  getDecisionVenueFromPlanSeed,
  type DecisionVenue,
} from "@/lib/decision-board";
import {
  clearBoardSnapshot,
  proposalIdsSignature,
  readBoardSnapshot,
  writeBoardSnapshot,
} from "@/lib/decision-board-snapshot";
import { clearActiveProposalIdsForBoard, readActiveProposalIdsForBoard } from "@/lib/decision-board-active-proposals";
import { getVenueTimeDisplay } from "@/lib/decision-board-venue-time";
import { writeLockedPlanForGroup } from "@/lib/locked-plan";
import { readActiveChatGroupId } from "@/lib/active-chat-group";
import {
  clearDecisionBoardStatusMap,
  readDecisionBoardStatusMap,
  type DecisionCardStatus,
  writeDecisionBoardStatusMap,
} from "@/lib/decision-board-status";
import {
  clearPastHangoutLocationId,
  readPastHangoutLocationId,
  writePastHangoutLocationId,
} from "@/lib/decision-board-past-seed";

const PRIMARY = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";

/** Demo names for “still need a yes” (same order as simulated Yes taps). */
const PENDING_VOTE_MEMBER_NAMES = [
  "David",
  "Maya",
  "Sam",
  "Jordan",
  "Alex",
] as const;

function waitingMemberNames(yesCount: number, max: number): string[] {
  const labels: string[] = [...PENDING_VOTE_MEMBER_NAMES];
  while (labels.length < max) {
    labels.push(`Member ${labels.length + 1}`);
  }
  return labels.slice(yesCount, max);
}

type BoardView = "initial" | "locked" | "failed";

type BoardRow = {
  venue: DecisionVenue;
  votes: number;
  max: number;
  status: DecisionCardStatus;
};

function mergeBoardRowsWithTemplates(
  prev: BoardRow[],
  templates: BoardRow[],
  profileName: string,
): BoardRow[] {
  return prev.map((row) => {
    const template = templates.find((d) => d.venue.id === row.venue.id);
    if (!template) {
      return {
        ...row,
        venue: {
          ...row.venue,
          proposer: profileName,
          organizer: profileName,
        },
      };
    }
    return {
      ...row,
      venue: template.venue,
      votes: row.votes,
      max: row.max,
      status: row.status,
    };
  });
}

function splitRowsByStatus(templates: BoardRow[], statuses: Record<string, DecisionCardStatus>) {
  const discussingRows: BoardRow[] = [];
  const readyRows: BoardRow[] = [];
  for (const row of templates) {
    if (statuses[row.venue.id] === "ready") {
      readyRows.push({
        ...row,
        status: "ready",
        votes: row.max,
      });
      continue;
    }
    discussingRows.push({
      ...row,
      status: "discussing",
      votes: 0,
    });
  }
  return { discussingRows, readyRows };
}

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
    <div className="relative w-full min-w-0">
      <div
        className="relative flex min-h-[4.25rem] min-w-0 w-full items-stretch overflow-hidden rounded-xl text-white shadow-sm"
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
            aria-label={`Vote to move ${row.venue.name} to Ready`}
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

function ReadyCard({
  row,
  onOpenPlan,
  onRequestMoveBack,
  showMoveBack,
}: {
  row: BoardRow;
  onOpenPlan: (venue: DecisionVenue) => void;
  onRequestMoveBack: (row: BoardRow) => void;
  showMoveBack: boolean;
}) {
  return (
    <div className="relative w-full min-w-0">
      <div
        className="relative flex min-h-[4.25rem] min-w-0 w-full items-stretch overflow-hidden rounded-xl text-white shadow-[0_4px_16px_rgba(86,141,237,0.28)] ring-1 ring-white/15"
        style={{ backgroundColor: PRIMARY }}
      >
        {showMoveBack && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestMoveBack(row);
            }}
            className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-neutral-100 active:scale-95"
            style={{ color: PRIMARY }}
            aria-label={`Move ${row.venue.name} back to Discussing`}
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenPlan(row.venue)}
          className={`flex min-w-0 w-full flex-1 flex-col items-end justify-center py-3 pr-3 text-right ${showMoveBack ? "pl-[3.25rem]" : "pl-3"}`}
        >
          <p className="max-w-full text-sm font-bold leading-tight">
            {row.venue.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/95">
            {row.votes}/{row.max}
          </p>
        </button>
      </div>
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
      { venue: kohDisplay, votes: 0, max: 5, status: "discussing" },
      { venue: foxDisplay, votes: 0, max: 5, status: "discussing" },
      { venue: dearDisplay, votes: 0, max: 5, status: "discussing" },
    ],
    [kohDisplay, foxDisplay, dearDisplay],
  );

  const [discussing, setDiscussing] = useState<BoardRow[]>(defaultDiscussing);
  const [ready, setReady] = useState<BoardRow[]>([]);
  const discussingRef = useRef(discussing);
  const readyRef = useRef(ready);
  discussingRef.current = discussing;
  readyRef.current = ready;
  const appliedPastSeedIdRef = useRef<string | null>(null);
  const lastProposalFilterSerializedRef = useRef<string | null>(null);

  const [voteOpen, setVoteOpen] = useState(false);
  const [voteModalVenue, setVoteModalVenue] = useState<DecisionVenue | null>(
    null,
  );
  const [voteSecondsLeft, setVoteSecondsLeft] = useState(60);
  const [voteYesCount, setVoteYesCount] = useState(0);
  const [voteModalMax, setVoteModalMax] = useState(5);
  const [voteWaitingExpanded, setVoteWaitingExpanded] = useState(true);
  const [votePingNotice, setVotePingNotice] = useState<string | null>(null);
  const votePingClearRef = useRef<number | null>(null);
  const [venueTimeRevision, setVenueTimeRevision] = useState(0);
  const [moveBackRow, setMoveBackRow] = useState<BoardRow | null>(null);

  useEffect(() => {
    const onVenueTime = () => setVenueTimeRevision((n) => n + 1);
    window.addEventListener("igather-venue-time-changed", onVenueTime);
    return () =>
      window.removeEventListener("igather-venue-time-changed", onVenueTime);
  }, []);

  useEffect(() => {
    if (!voteOpen) return;
    setVoteYesCount(0);
    setVoteWaitingExpanded(true);
    setVotePingNotice(null);
    if (votePingClearRef.current) {
      window.clearTimeout(votePingClearRef.current);
      votePingClearRef.current = null;
    }
  }, [voteOpen]);

  useEffect(() => {
    return () => {
      if (votePingClearRef.current) {
        window.clearTimeout(votePingClearRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (view !== "initial") return;

    const activeProposalIds = readActiveProposalIdsForBoard();
    if (activeProposalIds?.length) {
      clearPastHangoutLocationId();
      appliedPastSeedIdRef.current = null;
    }

    const seedFromQuery = searchParams.get("seedPast");
    if (seedFromQuery?.trim()) {
      writePastHangoutLocationId(seedFromQuery.trim());
    }
    const seedPast =
      seedFromQuery?.trim() || readPastHangoutLocationId() || null;

    // Past hangout flow: one card for the selected location (from URL and/or localStorage).
    if (seedPast && !activeProposalIds?.length) {
      if (appliedPastSeedIdRef.current !== seedPast) {
        appliedPastSeedIdRef.current = seedPast;
        lastProposalFilterSerializedRef.current = null;
        clearActiveProposalIdsForBoard();
        const venue = getDecisionVenueFromPlanSeed(
          seedPast,
          readProfile().name,
        );
        const template: BoardRow[] = [
          { venue, votes: 0, max: 5, status: "discussing" },
        ];
        let statuses = readDecisionBoardStatusMap();
        if (
          Object.keys(statuses).length > 0 &&
          statuses[venue.id] == null
        ) {
          clearDecisionBoardStatusMap();
          statuses = {};
        }
        if (Object.keys(statuses).length > 0 && statuses[venue.id]) {
          const split = splitRowsByStatus(template, statuses);
          setDiscussing(split.discussingRows);
          setReady(split.readyRows);
        } else {
          clearBoardSnapshot();
          clearDecisionBoardStatusMap();
          setDiscussing(template);
          setReady([]);
        }
      }
      return;
    }

    appliedPastSeedIdRef.current = null;
    const serialized = proposalIdsSignature(activeProposalIds);

    const templatesForMerge: BoardRow[] =
      activeProposalIds && activeProposalIds.length > 0
        ? boardRowsFromActiveProposalIds(activeProposalIds, profileName)
            .map((r) => ({ ...r, status: "discussing" as const }))
        : defaultDiscussing;

    const statuses = readDecisionBoardStatusMap();
    const hasStatuses = Object.keys(statuses).length > 0;
    if (hasStatuses) {
      const split = splitRowsByStatus(templatesForMerge, statuses);
      setDiscussing(split.discussingRows);
      setReady(split.readyRows);
      lastProposalFilterSerializedRef.current = serialized || null;
      return;
    }

    const snapshot = readBoardSnapshot();
    // Always prefer restoring persisted board state when available.
    // Fresh proposal flows clear this snapshot before navigating here.
    if (snapshot) {
      setDiscussing(
        mergeBoardRowsWithTemplates(
          snapshot.discussing as BoardRow[],
          templatesForMerge,
          profileName,
        ),
      );
      setReady(
        mergeBoardRowsWithTemplates(
          snapshot.ready as BoardRow[],
          templatesForMerge,
          profileName,
        ),
      );
      lastProposalFilterSerializedRef.current = serialized || null;
      return;
    }

    if (
      !appliedPastSeedIdRef.current &&
      activeProposalIds &&
      activeProposalIds.length > 0
    ) {
      if (serialized !== lastProposalFilterSerializedRef.current) {
        const snapRetry = readBoardSnapshot();
        if (snapRetry) {
          lastProposalFilterSerializedRef.current = serialized;
          setDiscussing(
            mergeBoardRowsWithTemplates(
              snapRetry.discussing as BoardRow[],
              templatesForMerge,
              profileName,
            ),
          );
          setReady(
            mergeBoardRowsWithTemplates(
              snapRetry.ready as BoardRow[],
              templatesForMerge,
              profileName,
            ),
          );
          return;
        }
        lastProposalFilterSerializedRef.current = serialized;
        setDiscussing(
          boardRowsFromActiveProposalIds(activeProposalIds, profileName).map(
            (r) => ({ ...r, status: "discussing" as const }),
          ),
        );
        setReady([]);
      } else {
        setDiscussing((prev) =>
          mergeBoardRowsWithTemplates(prev, templatesForMerge, profileName),
        );
        setReady((prev) =>
          mergeBoardRowsWithTemplates(prev, templatesForMerge, profileName),
        );
      }
      return;
    }

    if (!activeProposalIds?.length) {
      lastProposalFilterSerializedRef.current = null;
    }

    setDiscussing(defaultDiscussing);
    setReady([]);
  }, [view, defaultDiscussing, profileName, router, searchParams]);

  useEffect(() => {
    if (view !== "initial") return;
    const statusMap: Record<string, DecisionCardStatus> = {};
    for (const row of discussing) statusMap[row.venue.id] = "discussing";
    for (const row of ready) statusMap[row.venue.id] = "ready";
    writeDecisionBoardStatusMap(statusMap);
    writeBoardSnapshot({
      proposalIdsSig: proposalIdsSignature(readActiveProposalIdsForBoard()),
      discussing,
      ready,
    });
  }, [view, discussing, ready]);

  const staticLayout = useMemo<{ discussing: BoardRow[]; ready: BoardRow[] } | null>(() => {
    if (view === "locked") {
      return {
        discussing: [{ venue: foxDisplay, votes: 0, max: 5, status: "discussing" }],
        ready: [{ venue: kohDisplay, votes: 5, max: 5, status: "ready" }],
      };
    }
    if (view === "failed") {
      return {
        discussing: [{ venue: foxDisplay, votes: 0, max: 5, status: "discussing" }],
        ready: [{ venue: kohDisplay, votes: 4, max: 5, status: "ready" }],
      };
    }
    return null;
  }, [view, kohDisplay, foxDisplay, dearDisplay]);

  const displayDiscussing =
    view === "initial" ? discussing : staticLayout!.discussing;
  const displayReady = view === "initial" ? ready : staticLayout!.ready;

  const onPressArrow = useCallback(
    (venue: DecisionVenue) => {
      setVoteModalMax(
        discussing.find((r) => r.venue.id === venue.id)?.max ?? 5,
      );
      setVoteModalVenue(venue);
      setVoteOpen(true);
    },
    [discussing],
  );

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
    setVoteYesCount(0);
  }, []);

  const finishMoveToReady = useCallback(
    (venue: DecisionVenue, max: number) => {
      setDiscussing((prev) => prev.filter((r) => r.venue.id !== venue.id));
      setReady((prev) =>
        prev.some((r) => r.venue.id === venue.id)
          ? prev
          : [...prev, { venue, votes: max, max, status: "ready" }],
      );
      setVoteOpen(false);
      setVoteModalVenue(null);
      setVoteYesCount(0);
    },
    [],
  );

  const onVoteNo = useCallback(() => {
    closeVoteModal();
  }, [closeVoteModal]);

  const onPingWaitingMembers = useCallback(() => {
    const names = waitingMemberNames(voteYesCount, voteModalMax);
    if (names.length === 0) return;
    if (votePingClearRef.current) {
      window.clearTimeout(votePingClearRef.current);
    }
    setVotePingNotice(`Reminder ping sent to ${names.join(", ")}.`);
    votePingClearRef.current = window.setTimeout(() => {
      setVotePingNotice(null);
      votePingClearRef.current = null;
    }, 4000);
  }, [voteYesCount, voteModalMax]);

  const onMemberVoteYes = useCallback(() => {
    if (!voteModalVenue) return;
    setVoteYesCount((prev) => {
      if (prev >= voteModalMax) return prev;
      const next = prev + 1;
      if (next >= voteModalMax) {
        const v = voteModalVenue;
        const cap = voteModalMax;
        queueMicrotask(() => finishMoveToReady(v, cap));
      }
      return next;
    });
  }, [voteModalVenue, voteModalMax, finishMoveToReady]);

  useEffect(() => {
    if (!voteOpen || voteSecondsLeft > 0) return;
    closeVoteModal();
  }, [voteOpen, voteSecondsLeft, closeVoteModal]);

  const openPlanFromReady = useCallback(
    (venue: DecisionVenue) => {
      writeLockedPlanForGroup(readActiveChatGroupId(0), {
        name: venue.name,
        location: venue.location,
        time: getVenueTimeDisplay(venue.id, venue.timeLabel),
        who: "Everyone",
        image: venue.image,
      });
      writeBoardSnapshot({
        proposalIdsSig: proposalIdsSignature(
          readActiveProposalIdsForBoard(),
        ),
        discussing: discussingRef.current,
        ready: readyRef.current,
      });
      router.push("/plan-locked");
    },
    [router],
  );

  const confirmMoveBackToDiscussing = useCallback(() => {
    if (!moveBackRow) return;
    const { venue, max } = moveBackRow;
    setReady((prev) => prev.filter((r) => r.venue.id !== venue.id));
    setDiscussing((prev) => [...prev, { venue, votes: 0, max, status: "discussing" }]);
    setMoveBackRow(null);
  }, [moveBackRow]);

  return (
    <PhoneShell>
      <div className={`relative flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Decision Board" />

        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4"
          data-venue-time-rev={venueTimeRevision}
        >
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
            <div className="flex min-h-0 min-w-0 flex-col">
              <h2 className="mb-2 shrink-0 text-center text-xs font-bold text-neutral-800">
                Discussing
              </h2>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-100/80 p-3">
                {displayDiscussing.map((row, index) => (
                  <DiscussingCard
                    key={`${row.venue.id}-${index}`}
                    row={row}
                    onArrow={onPressArrow}
                    showArrow={view === "initial"}
                  />
                ))}
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col">
              <h2 className="mb-2 shrink-0 text-center text-xs font-bold text-neutral-800">
                Ready
              </h2>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-100/80 p-3">
                {displayReady.length === 0 ? (
                  <p className="px-1 py-8 text-center text-xs text-neutral-400">
                    Nothing here yet
                  </p>
                ) : (
                  displayReady.map((row, index) => (
                    <ReadyCard
                      key={`${row.venue.id}-${index}`}
                      row={row}
                      onOpenPlan={openPlanFromReady}
                      onRequestMoveBack={setMoveBackRow}
                      showMoveBack={view === "initial"}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {view === "locked" && (
            <div className="mt-4 shrink-0">
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
          >
            <div className="relative z-10 w-full max-w-[min(100%,20rem)] rounded-2xl bg-white p-5 shadow-xl">
              <h2
                id="vote-modal-title"
                className="text-center text-base font-bold text-neutral-900"
              >
                Vote: move {voteModalVenue.name} to Ready?{" "}
                <span className="block pt-1 text-sm font-semibold">
                  <span style={{ color: PRIMARY }}>
                    {getVenueTimeDisplay(
                      voteModalVenue.id,
                      voteModalVenue.timeLabel,
                    )}
                  </span>
                </span>
              </h2>
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={onMemberVoteYes}
                  disabled={voteYesCount >= voteModalMax}
                  className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-neutral-200/90 px-4 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
                    voteYesCount > 0
                      ? "ring-2 ring-[#568DED] ring-offset-1"
                      : ""
                  }`}
                >
                  <span>Yes</span>
                  <span className="text-neutral-600">
                    {voteYesCount} / {voteModalMax} yes
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onVoteNo}
                  className="flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-neutral-200/90 px-4 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300/90 active:scale-[0.99]"
                >
                  <span>No</span>
                  <span className="text-neutral-600">Stays in Discussing</span>
                </button>
              </div>
              <p
                className="mt-3 text-center text-xs italic"
                style={{ color: PRIMARY }}
              >
                {voteSecondsLeft > 0
                  ? `${voteSecondsLeft} sec left — need all ${voteModalMax} yes votes`
                  : "Time's up — vote closed"}
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 text-left">
                <button
                  type="button"
                  onClick={() => setVoteWaitingExpanded((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-neutral-900"
                  aria-expanded={voteWaitingExpanded}
                >
                  <span>Who we&apos;re waiting for</span>
                  <ChevronDown
                    className={`size-[1.125rem] shrink-0 text-neutral-600 transition-transform duration-200 ${
                      voteWaitingExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {voteWaitingExpanded && (
                  <div className="space-y-3 border-t border-neutral-200/90 px-3 pb-3 pt-2">
                    <ul className="space-y-2 text-sm text-neutral-800">
                      {waitingMemberNames(voteYesCount, voteModalMax).map(
                        (name) => (
                          <li
                            key={`${voteYesCount}-${name}`}
                            className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full bg-amber-400"
                              aria-hidden
                            />
                            <span className="font-medium">{name}</span>
                            <span className="ml-auto text-xs font-normal text-neutral-500">
                              Pending yes
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                    <button
                      type="button"
                      onClick={onPingWaitingMembers}
                      disabled={
                        waitingMemberNames(voteYesCount, voteModalMax).length ===
                        0
                      }
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-neutral-300/95 bg-white text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Ping them
                    </button>
                    {votePingNotice && (
                      <p className="text-center text-xs leading-snug text-neutral-600">
                        {votePingNotice}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {moveBackRow && (
          <div
            className="absolute inset-0 z-[25] flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-back-prompt-title"
          >
            <div className="w-full max-w-[min(100%,20rem)] rounded-2xl bg-white p-5 shadow-xl">
              <p
                id="move-back-prompt-title"
                className="text-center text-sm font-semibold leading-snug text-neutral-900"
              >
                Are you sure you want to move the card back to discussing?
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={confirmMoveBackToDiscussing}
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-neutral-200/90 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300/90"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setMoveBackRow(null)}
                  className="flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
