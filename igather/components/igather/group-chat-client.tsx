"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { readGroupSettings } from "@/lib/group-settings";
import {
  readLockedPlanForGroup,
  type LockedPlanPayload,
} from "@/lib/locked-plan";
import { PAST_LOCATIONS } from "@/lib/past-successful-hangouts";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_PROFILE, readProfile } from "@/lib/profile-storage";
import {
  ensureAlignmentTimer,
  getAlignmentTimerDeadlineMs,
  getAlignmentTimerRemainingSeconds,
  setAlignmentTimerFromNow,
  setSummaryTimerFromNow,
} from "@/lib/alignment-timer";
import { writeTimeoutContinueContext } from "@/lib/timeout-continue-context";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Play,
  Plus,
  Settings,
  X,
} from "lucide-react";

const PRIMARY = "#568DED";

type Overlay =
  | null
  | "start"
  | "purpose"
  | "date"
  | "pastLocations"
  | "pastDate";

type PlanSource = "none" | "new" | "past";

/** none | voting (4/5) | all yes then Click to Start Plan */
type PlanningPhase = "none" | "voting" | "voting_complete";

type Msg = {
  id: string;
  role: "in" | "out";
  text: string;
  /** Show avatar only on first message in an incoming run */
  showAvatar?: boolean;
};

const PURPOSE_OPTIONS = [
  { id: "restaurant", label: "Restaurant" },
  { id: "basketball", label: "Basketball" },
  { id: "arcade", label: "Arcade" },
  { id: "gym", label: "Gym" },
] as const;

function SmallAvatar({ label }: { label: string }) {
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-xs font-normal lowercase text-neutral-800"
      aria-hidden
    >
      {label}
    </div>
  );
}

function GroupHeaderAvatar() {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-xl"
      aria-hidden
    >
      🦦
    </div>
  );
}

function VoteProgressBar({
  label,
  votesLabel,
  fillPct,
}: {
  label: string;
  votesLabel: string;
  fillPct: number;
}) {
  return (
    <div className="relative h-11 w-full overflow-hidden rounded-full bg-neutral-200/90">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/55"
        style={{ width: `${fillPct}%` }}
      />
      <div className="relative flex h-full items-center justify-between px-4 text-sm font-semibold text-neutral-900">
        <span>{label}</span>
        <span>{votesLabel}</span>
      </div>
    </div>
  );
}

function buildCalendarCells(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const startPad = first.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function formatMonthLabel(year: number, monthIndex: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, monthIndex, 1));
  } catch {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  }
}

function formatFullDateLabel(year: number, monthIndex: number, day: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(year, monthIndex, day));
  } catch {
    return `${formatMonthLabel(year, monthIndex)} ${day}, ${year}`;
  }
}

function shiftMonth(
  year: number,
  monthIndex: number,
  deltaMonths: number,
): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + deltaMonths, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

type PollPhase = "active" | "complete" | "cancelled";

type PollMsg = {
  id: string;
  type: "poll";
  question: string;
  phase: PollPhase;
  myChoice?: "yes" | "no";
  cancelledReason?: string;
};

type ChatItem = Msg | PollMsg;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function GroupChatInner({
  groupName,
  groupIndex,
}: {
  groupName: string;
  groupIndex: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const hidePlanningCard = searchParams.get("minimal") === "1";

  const [profileName, setProfileName] = useState(() => DEFAULT_PROFILE.name);

  const [planningPhase, setPlanningPhase] = useState<PlanningPhase>("none");
  const [planSource, setPlanSource] = useState<PlanSource>("none");
  const [pastLocationId, setPastLocationId] = useState<string>(
    PAST_LOCATIONS[0].id,
  );
  const [pastSelectedDay, setPastSelectedDay] = useState(17);

  const [purpose, setPurpose] = useState<string>("restaurant");
  const [otherText, setOtherText] = useState("");

  const today = useMemo(() => new Date(), []);

  const [newPlanMonth, setNewPlanMonth] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));
  const [pastPlanMonth, setPastPlanMonth] = useState(() => ({
    year: 2026,
    monthIndex: 2, // March
  }));

  const [selectedDay, setSelectedDay] = useState(() => today.getDate());

  const newPlanCalendarCells = useMemo(
    () => buildCalendarCells(newPlanMonth.year, newPlanMonth.monthIndex),
    [newPlanMonth.monthIndex, newPlanMonth.year],
  );
  const pastCalendarCells = useMemo(
    () => buildCalendarCells(pastPlanMonth.year, pastPlanMonth.monthIndex),
    [pastPlanMonth.monthIndex, pastPlanMonth.year],
  );

  const newPlanMonthLabel = useMemo(
    () => formatMonthLabel(newPlanMonth.year, newPlanMonth.monthIndex),
    [newPlanMonth.monthIndex, newPlanMonth.year],
  );
  const pastPlanMonthLabel = useMemo(
    () => formatMonthLabel(pastPlanMonth.year, pastPlanMonth.monthIndex),
    [pastPlanMonth.monthIndex, pastPlanMonth.year],
  );

  const [voteSecondsLeft, setVoteSecondsLeft] = useState(60);
  const [lockedPlan, setLockedPlan] = useState<LockedPlanPayload | null>(null);

  const CHAT_LOG_STORAGE_KEY = useMemo(
    () => `igather-chat-log-v1-${groupIndex}`,
    [groupIndex],
  );

  const [chatLog, setChatLog] = useState<ChatItem[]>([]);
  const [didLoadChatLog, setDidLoadChatLog] = useState(false);
  const [draft, setDraft] = useState("");
  const [activePollId, setActivePollId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isPlanActive = useMemo(() => {
    if (lockedPlan) return true;
    if (planningPhase !== "none") return true;
    return chatLog.some(
      (item) =>
        "type" in item && item.type === "poll" && item.phase !== "cancelled",
    );
  }, [lockedPlan, planningPhase, chatLog]);

  // The vote timer should only run while the poll is actually accepting votes.
  const hasActivePoll = useMemo(() => {
    return chatLog.some(
      (item) =>
        "type" in item && item.type === "poll" && item.phase === "active",
    );
  }, [chatLog]);

  const refreshLockedPlan = useCallback(() => {
    setLockedPlan(readLockedPlanForGroup(groupIndex));
  }, [groupIndex]);

  const purposeLabel = useMemo(() => {
    if (purpose === "other") return otherText.trim() || "Other";
    const opt = PURPOSE_OPTIONS.find((o) => o.id === purpose);
    return opt?.label ?? "Hangout";
  }, [purpose, otherText]);

  const planCardTitle = useMemo(() => {
    if (planSource === "past") {
      const venue =
        PAST_LOCATIONS.find((l) => l.id === pastLocationId)?.name ??
        "Koh Lipe Thai";
      return `${profileName} suggested ${venue} on ${formatFullDateLabel(
        pastPlanMonth.year,
        pastPlanMonth.monthIndex,
        pastSelectedDay,
      )}`;
    }
    return `${profileName} suggested a ${purposeLabel} plan on ${formatFullDateLabel(
      newPlanMonth.year,
      newPlanMonth.monthIndex,
      selectedDay,
    )}`;
  }, [
    planSource,
    pastLocationId,
    pastSelectedDay,
    pastPlanMonth.monthIndex,
    pastPlanMonth.year,
    purposeLabel,
    profileName,
    selectedDay,
    newPlanMonth.monthIndex,
    newPlanMonth.year,
  ]);

  const closeOverlay = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    if (!hasActivePoll) return;
    setVoteSecondsLeft(getAlignmentTimerRemainingSeconds());
    const id = window.setInterval(() => {
      setVoteSecondsLeft(getAlignmentTimerRemainingSeconds());
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasActivePoll]);

  useEffect(() => {
    if (!hasActivePoll || voteSecondsLeft > 0) return;
    router.replace("/timeout");
  }, [hasActivePoll, voteSecondsLeft, router]);

  useEffect(() => {
    if (!hasActivePoll) return;
    const deadline = getAlignmentTimerDeadlineMs();
    if (!deadline) return;
    if (getAlignmentTimerRemainingSeconds() <= 0) {
      router.replace("/timeout");
    }
  }, [hasActivePoll, router, chatLog, voteSecondsLeft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOverlay]);

  useEffect(() => {
    refreshLockedPlan();
  }, [refreshLockedPlan]);

  useEffect(() => {
    const onFocus = () => refreshLockedPlan();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshLockedPlan();
    };
    const onStorage = () => refreshLockedPlan();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshLockedPlan]);

  useEffect(() => {
    setProfileName(readProfile().name);
  }, []);

  useEffect(() => {
    // Load per-group chat log after mount.
    setDidLoadChatLog(false);
    try {
      const raw = localStorage.getItem(CHAT_LOG_STORAGE_KEY);
      if (!raw) {
        setChatLog([]);
        setDidLoadChatLog(true);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;

      const normalized = (parsed as ChatItem[]).filter((item) => {
        if (typeof item !== "object" || item === null) return false;
        if ("type" in item && (item as PollMsg).type === "poll") {
          const p = item as PollMsg;
          return (
            typeof p.id === "string" &&
            typeof p.question === "string" &&
            (p.phase === "active" ||
              p.phase === "complete" ||
              p.phase === "cancelled")
          );
        }

        const m = item as Msg;
        return (
          typeof m.id === "string" &&
          (m.role === "in" || m.role === "out") &&
          typeof m.text === "string" &&
          (m.showAvatar === undefined || typeof m.showAvatar === "boolean")
        );
      });

      setChatLog(normalized);
      const activePoll = normalized.find(
        (i) =>
          "type" in i && i.type === "poll" && i.phase === "active",
      ) as PollMsg | undefined;
      const anyPoll = normalized.find((i) => "type" in i && i.type === "poll") as
        | PollMsg
        | undefined;

      if (activePoll) {
        setActivePollId(activePoll.id);
        setPlanningPhase("voting");
        setVoteSecondsLeft(getAlignmentTimerRemainingSeconds());
        // If timer already expired, immediately go to timeout on return.
        if (getAlignmentTimerRemainingSeconds() <= 0) {
          router.replace("/timeout");
        }
      } else if (anyPoll && anyPoll.phase !== "cancelled") {
        setActivePollId(anyPoll.id);
        setPlanningPhase("voting_complete");
      } else {
        setActivePollId(null);
        setPlanningPhase("none");
      }
      setDidLoadChatLog(true);
    } catch {
      setChatLog([]);
      setActivePollId(null);
      setPlanningPhase("none");
      setDidLoadChatLog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CHAT_LOG_STORAGE_KEY]);

  useEffect(() => {
    // Persist per-group chat log.
    if (!didLoadChatLog) return;
    try {
      localStorage.setItem(CHAT_LOG_STORAGE_KEY, JSON.stringify(chatLog));
    } catch {
      /* ignore */
    }
  }, [CHAT_LOG_STORAGE_KEY, chatLog, didLoadChatLog]);

  useEffect(() => {
    // Keep scrolled to newest message.
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatLog, planningPhase, voteSecondsLeft]);

  const BOT_REPLIES = useMemo(
    () => [
      "Cool",
      "Very nice!!!",
      "Lmao",
      "Nah I'm good",
      "Hahaha",
      "LOL",
    ],
    [],
  );

  const maybeInsertPoll = useCallback(() => {
    if (planningPhase !== "voting") return;
    // Insert poll once per voting run.
    if (activePollId) return;
    const pollId = newId();
    setActivePollId(pollId);
    setChatLog((prev) => [
      ...prev,
      {
        id: pollId,
        type: "poll",
        question: planCardTitle,
        phase: "active",
      },
    ]);
  }, [activePollId, planningPhase, planCardTitle]);

  useEffect(() => {
    maybeInsertPoll();
  }, [maybeInsertPoll]);

  const resolvePoll = useCallback(
    (choice: "yes" | "no") => {
      if (!activePollId) {
        setPlanningPhase("voting_complete");
        return;
      }
      setChatLog((prev) =>
        prev.map((item) => {
          if (!("type" in item) || item.type !== "poll" || item.id !== activePollId) {
            return item;
          }
          return { ...item, phase: "complete", myChoice: choice } as PollMsg;
        }),
      );
      setPlanningPhase("voting_complete");
    },
    [activePollId],
  );

  const cancelNoVotePlan = useCallback((pollId: string) => {
    setChatLog((prev) =>
      prev.map((item) => {
        if (!("type" in item) || item.type !== "poll" || item.id !== pollId) {
          return item;
        }
        return {
          ...item,
          phase: "cancelled",
          cancelledReason: "Plan cancelled.",
        } as PollMsg;
      }),
    );
    setActivePollId(null);
    setPlanningPhase("none");
  }, []);

  const sendBotResponse = useCallback(
    (userText: string) => {
      const t = userText.toLowerCase();
      let reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];

      if (t.includes("budget")) {
        reply = "Budget noted. I can keep suggestions within your range.";
      } else if (t.includes("travel") || t.includes("minute")) {
        reply = "Travel time considered. Let's pick something within the limit.";
      } else if (t.includes("when") || t.includes("time")) {
        reply = "What time window works best for everyone?";
      }

      setChatLog((prev) => [
        ...prev,
        {
          id: newId(),
          role: "in",
          text: reply,
          showAvatar: true,
        },
      ]);
    },
    [BOT_REPLIES],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setChatLog((prev) => [
      ...prev,
      {
        id: newId(),
        role: "out",
        text,
      },
    ]);
    setDraft("");

    window.setTimeout(() => sendBotResponse(text), 500);
  }, [draft, sendBotResponse]);

  const onStartNewPlan = () => {
    setOverlay("purpose");
  };

  const onPurposeNext = () => {
    setOverlay("date");
  };

  const onDateNext = () => {
    setOverlay(null);
    setPlanSource("new");
    setActivePollId(null);
    writeTimeoutContinueContext({
      planSource: "new",
      pastLocationId: null,
    });
    {
      const seconds = readGroupSettings().startTimerSeconds;
      setAlignmentTimerFromNow(seconds);
      setSummaryTimerFromNow(seconds);
    }
    setPlanningPhase("voting");
  };

  const onPastDateNext = () => {
    setOverlay(null);
    setPlanSource("past");
    setActivePollId(null);
    writeTimeoutContinueContext({
      planSource: "past",
      pastLocationId,
    });
    {
      const seconds = readGroupSettings().startTimerSeconds;
      setAlignmentTimerFromNow(seconds);
      setSummaryTimerFromNow(seconds);
    }
    setPlanningPhase("voting");
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      {/* Header: light gray, rounded bottom (#F2F2F2) */}
      <header className="relative z-0 shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-4 pt-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex size-11 items-center justify-center rounded-full text-neutral-900 transition hover:bg-black/[0.06] active:bg-black/[0.1]"
            aria-label="Back"
          >
            <ArrowLeft className="size-6" strokeWidth={2} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <GroupHeaderAvatar />
            <span className="truncate text-sm font-semibold text-neutral-900 font-[family-name:var(--font-comic)]">
              {groupName}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`flex size-11 items-center justify-center rounded-full transition ${
                isPlanActive
                  ? "cursor-not-allowed text-neutral-400 opacity-55 grayscale"
                  : "text-neutral-900 hover:bg-black/[0.06] active:bg-black/[0.1]"
              }`}
              aria-label="Start planning"
              disabled={isPlanActive}
              onClick={() => {
                if (isPlanActive) return;
                setOverlay("start");
              }}
            >
              <Play className="size-5 fill-current" />
            </button>
            <Link
              href="/group-settings"
              className={`flex size-11 items-center justify-center rounded-full transition ${
                isPlanActive
                  ? "cursor-not-allowed text-neutral-400 opacity-55 grayscale hover:bg-transparent"
                  : "text-neutral-900 hover:bg-black/[0.06] active:bg-black/[0.1]"
              }`}
              aria-label="Group settings"
              aria-disabled={isPlanActive}
              onClick={(e) => {
                if (!isPlanActive) return;
                e.preventDefault();
              }}
              title={isPlanActive ? "Disabled while a plan is active" : undefined}
            >
              <Settings className="size-5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {lockedPlan && (
        <div className="shrink-0 px-4 pt-3">
          <div
            className="rounded-2xl px-4 py-4 text-white shadow-[0_8px_24px_rgba(86,141,237,0.35)] ring-1 ring-white/20"
            style={{ backgroundColor: PRIMARY }}
          >
            <p className="text-center text-sm font-bold leading-snug">
              ✅ {lockedPlan.name}
            </p>
            <p className="mt-2 text-center text-xs font-medium leading-snug">
              {lockedPlan.location}
            </p>
            <p className="mt-1 text-center text-xs font-medium leading-snug">
              {lockedPlan.time}
            </p>
            <p className="mt-1 text-center text-xs font-medium leading-snug">
              Who: {lockedPlan.who}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3">
          {chatLog.map((item) => {
            if ("type" in item && item.type === "poll") {
              const totalVotes = 5;
              const yesVotes = item.myChoice === "no" ? 4 : 5;
              const noVotes = item.myChoice === "no" ? 1 : 0;
              const yesPct = (yesVotes / totalVotes) * 100;
              const noPct = (noVotes / totalVotes) * 100;

              return (
                <div
                  key={item.id}
                  className="flex w-full justify-start gap-2"
                >
                  <div className="w-8 shrink-0" aria-hidden />
                  <div
                    className={`max-w-[min(100%,18rem)] rounded-[1.5rem] px-4 py-2.5 text-sm leading-snug shadow-[0_1px_2px_rgba(0,0,0,0.06)] bg-[#ECECEC] text-neutral-900 ring-1 ring-black/[0.04]`}
                  >
                    <p className="font-semibold text-sm">{item.question}</p>

                    {item.phase === "active" ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[11px] italic text-neutral-600">
                          {voteSecondsLeft > 0
                            ? `1 vote left - ${voteSecondsLeft} sec remaining...`
                            : "Time's up..."}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!!item.myChoice}
                            onClick={() => resolvePoll("yes")}
                            className="flex-1 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            disabled={!!item.myChoice}
                            onClick={() => resolvePoll("no")}
                            className="flex-1 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : item.phase === "complete" ? (
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <VoteProgressBar
                            label="Yes"
                            votesLabel={`${yesVotes} votes`}
                            fillPct={yesPct}
                          />
                          <VoteProgressBar
                            label="No"
                            votesLabel={`${noVotes} votes`}
                            fillPct={noPct}
                          />
                        </div>
                        <Link
                          href="/limits"
                          className="flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 active:scale-[0.99] font-[family-name:var(--font-comic)]"
                        >
                          {item.myChoice === "no"
                            ? "Continue plan with 4"
                            : "Click to Start Plan"}
                        </Link>
                        {item.myChoice === "no" && (
                          <button
                            type="button"
                            onClick={() => cancelNoVotePlan(item.id)}
                            className="flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 active:scale-[0.99] font-[family-name:var(--font-comic)]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-center text-sm font-semibold text-neutral-700">
                        {item.cancelledReason ?? "Plan cancelled."}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            const m = item as Msg;
            return (
              <div
                key={m.id}
                className={`flex w-full gap-2 ${m.role === "out" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "in" && m.showAvatar && <SmallAvatar label="s" />}
                {m.role === "in" && !m.showAvatar && (
                  <div className="w-8 shrink-0" aria-hidden />
                )}
                <div
                  className={`max-w-[min(100%,18rem)] rounded-[1.5rem] px-4 py-2.5 text-sm leading-snug shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                    m.role === "out"
                      ? "bg-neutral-900 text-white"
                      : "bg-[#ECECEC] text-neutral-900 ring-1 ring-black/[0.04]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Composer */}
      <footer className="shrink-0 rounded-t-[24px] border-t border-neutral-200/80 bg-[#F5F5F5] px-4 pb-6 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition hover:bg-neutral-800 active:scale-95"
            aria-label="More"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </button>
          <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-4 shadow-inner">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
              aria-label="Message input"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </footer>

      {/* Modal overlay */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOverlay}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {overlay === "start" && (
                <StartPlanContent
                  onClose={closeOverlay}
                  onPast={() => setOverlay("pastLocations")}
                  onNew={onStartNewPlan}
                />
              )}
              {overlay === "pastLocations" && (
                <PastLocationsContent
                  selectedId={pastLocationId}
                  onSelect={setPastLocationId}
                  onClose={closeOverlay}
                  onNext={() => setOverlay("pastDate")}
                />
              )}
              {overlay === "pastDate" && (
                <DateContent
                  monthLabel={pastPlanMonthLabel}
                  selectedDay={pastSelectedDay}
                  setSelectedDay={setPastSelectedDay}
                  cells={pastCalendarCells}
                  onPrevMonth={() =>
                    setPastPlanMonth((m) => shiftMonth(m.year, m.monthIndex, -1))
                  }
                  onNextMonth={() =>
                    setPastPlanMonth((m) => shiftMonth(m.year, m.monthIndex, +1))
                  }
                  onClose={closeOverlay}
                  onNext={onPastDateNext}
                />
              )}
              {overlay === "purpose" && (
                <PurposeContent
                  purpose={purpose}
                  setPurpose={setPurpose}
                  otherText={otherText}
                  setOtherText={setOtherText}
                  onClose={closeOverlay}
                  onNext={onPurposeNext}
                />
              )}
              {overlay === "date" && (
                <DateContent
                  monthLabel={newPlanMonthLabel}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  cells={newPlanCalendarCells}
                  onPrevMonth={() =>
                    setNewPlanMonth((m) => shiftMonth(m.year, m.monthIndex, -1))
                  }
                  onNextMonth={() =>
                    setNewPlanMonth((m) => shiftMonth(m.year, m.monthIndex, +1))
                  }
                  onClose={closeOverlay}
                  onNext={onDateNext}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GroupChatClient({
  groupName = "Comic Sans Lab",
  groupIndex = 0,
}: {
  groupName?: string;
  groupIndex?: number;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white text-sm text-neutral-400">
            Loading…
          </div>
        }
      >
        <GroupChatInner groupName={groupName} groupIndex={groupIndex} />
      </Suspense>
    </div>
  );
}

function StartPlanContent({
  onClose,
  onPast,
  onNew,
}: {
  onClose: () => void;
  onPast: () => void;
  onNew: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="absolute right-2 top-3 z-10 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <div className="flex flex-col gap-3 pt-11">
        <button
          type="button"
          className="h-14 w-full rounded-full text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: PRIMARY }}
          onClick={onPast}
        >
          Use Past Successful Hangout Spots
        </button>
        <button
          type="button"
          className="h-14 w-full rounded-full text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: PRIMARY }}
          onClick={onNew}
        >
          Start a New Plan
        </button>
      </div>
    </>
  );
}

function PastLocationsContent({
  selectedId,
  onSelect,
  onClose,
  onNext,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <h2 className="text-center text-xl font-bold text-neutral-900">
        Past Successful Hangout Locations
      </h2>
      <div className="mt-6 space-y-3">
        {PAST_LOCATIONS.map((loc) => (
          <label
            key={loc.id}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 transition hover:bg-neutral-50"
          >
            <input
              type="radio"
              name="pastLocation"
              className="sr-only"
              checked={selectedId === loc.id}
              onChange={() => onSelect(loc.id)}
            />
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedId === loc.id
                  ? "border-[#568DED]"
                  : "border-neutral-300"
              }`}
            >
              {selectedId === loc.id && (
                <span className="size-2.5 rounded-full bg-[#568DED]" />
              )}
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {loc.name}
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="mt-8 w-full rounded-full py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        style={{ backgroundColor: PRIMARY }}
        onClick={onNext}
      >
        Next
      </button>
    </>
  );
}

function PurposeContent({
  purpose,
  setPurpose,
  otherText,
  setOtherText,
  onClose,
  onNext,
}: {
  purpose: string;
  setPurpose: (v: string) => void;
  otherText: string;
  setOtherText: (v: string) => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <h2 className="text-center text-xl font-bold text-neutral-900">
        Hangout Purpose
      </h2>
      <div className="mt-6 space-y-3">
        {PURPOSE_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 transition hover:bg-neutral-50"
          >
            <input
              type="radio"
              name="purpose"
              className="sr-only"
              checked={purpose === opt.id}
              onChange={() => setPurpose(opt.id)}
            />
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                purpose === opt.id
                  ? "border-[#568DED]"
                  : "border-neutral-300"
              }`}
            >
              {purpose === opt.id && (
                <span className="size-2.5 rounded-full bg-[#568DED]" />
              )}
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {opt.label}
            </span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 transition hover:bg-neutral-50">
          <input
            type="radio"
            name="purpose"
            className="sr-only"
            checked={purpose === "other"}
            onChange={() => setPurpose("other")}
          />
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
              purpose === "other" ? "border-[#568DED]" : "border-neutral-300"
            }`}
          >
            {purpose === "other" && (
              <span className="size-2.5 rounded-full bg-[#568DED]" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-neutral-900">
            Other:
            <input
              type="text"
              value={otherText}
              onFocus={() => setPurpose("other")}
              onChange={(e) => {
                setPurpose("other");
                setOtherText(e.target.value);
              }}
              className="min-w-0 flex-1 border-b border-neutral-400 bg-transparent py-1 text-sm outline-none focus:border-[#568DED]"
              placeholder=" "
            />
          </span>
        </label>
      </div>
      <button
        type="button"
        className="mt-8 w-full rounded-full py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        style={{ backgroundColor: PRIMARY }}
        onClick={onNext}
      >
        Next
      </button>
    </>
  );
}

function DateContent({
  monthLabel,
  selectedDay,
  setSelectedDay,
  cells,
  onPrevMonth,
  onNextMonth,
  onClose,
  onNext,
}: {
  monthLabel: string;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  cells: (number | null)[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <h2 className="text-center text-xl font-bold text-neutral-900">Date</h2>
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-neutral-900">{monthLabel}</span>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              className="rounded p-0.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="Previous month"
              onClick={onPrevMonth}
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="Next month"
              onClick={onNextMonth}
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-neutral-400">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
          {cells.map((cell, i) => (
            <div key={i} className="flex h-9 items-center justify-center p-0.5">
              {cell === null ? (
                <span />
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDay(cell)}
                  className={`flex size-9 items-center justify-center rounded-full text-sm font-medium transition ${
                    selectedDay === cell
                      ? "bg-[#568DED] text-white"
                      : "text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {cell}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        style={{ backgroundColor: PRIMARY }}
        onClick={onNext}
      >
        Next
      </button>
    </>
  );
}
