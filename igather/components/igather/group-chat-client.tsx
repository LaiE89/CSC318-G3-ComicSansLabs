"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { readGroupSettings } from "@/lib/group-settings";
import { PAST_LOCATIONS } from "@/lib/past-successful-hangouts";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
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

const CHAT_MESSAGES: Msg[] = [
  { id: "1", role: "in", text: "guys", showAvatar: true },
  { id: "2", role: "in", text: "heyy" },
  { id: "3", role: "in", text: "Dinner this week?" },
  { id: "4", role: "out", text: "I'm down!" },
  { id: "5", role: "out", text: "Too many ideas..." },
  { id: "6", role: "in", text: "What Cuisine?", showAvatar: true },
];

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

function GroupChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const hidePlanningCard = searchParams.get("minimal") === "1";

  const [planningPhase, setPlanningPhase] = useState<PlanningPhase>("none");
  const [planSource, setPlanSource] = useState<PlanSource>("none");
  const [pastLocationId, setPastLocationId] = useState<string>(
    PAST_LOCATIONS[0].id,
  );
  const [pastSelectedDay, setPastSelectedDay] = useState(17);

  const [purpose, setPurpose] = useState<string>("restaurant");
  const [otherText, setOtherText] = useState("");

  const [selectedDay, setSelectedDay] = useState(28);
  const newPlanCalendarCells = useMemo(
    () => buildCalendarCells(2022, 2),
    [],
  );
  const pastCalendarCells = useMemo(() => buildCalendarCells(2026, 2), []);

  const [voteSecondsLeft, setVoteSecondsLeft] = useState(60);

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
      return `Ethan suggested ${venue} on March ${pastSelectedDay}, 2026`;
    }
    return `Ethan suggested a ${purposeLabel} plan on March ${selectedDay}, 2026`;
  }, [
    planSource,
    pastLocationId,
    pastSelectedDay,
    purposeLabel,
    selectedDay,
  ]);

  const closeOverlay = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    if (planningPhase !== "voting") return;
    setVoteSecondsLeft(readGroupSettings().startTimerSeconds);
    const id = window.setInterval(() => {
      setVoteSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [planningPhase]);

  useEffect(() => {
    if (planningPhase !== "voting" || voteSecondsLeft > 0) return;
    router.replace("/timeout");
  }, [planningPhase, voteSecondsLeft, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOverlay]);

  const onStartNewPlan = () => {
    setOverlay("purpose");
  };

  const onPurposeNext = () => {
    setOverlay("date");
  };

  const onDateNext = () => {
    setOverlay(null);
    setPlanSource("new");
    setPlanningPhase("voting");
  };

  const onPastDateNext = () => {
    setOverlay(null);
    setPlanSource("past");
    setPlanningPhase("voting");
  };

  const showPlanCard =
    !hidePlanningCard && planningPhase !== "none";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      {/* Header: light gray, rounded bottom (#F2F2F2) */}
      <header className="relative z-0 shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-4 pt-10">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex size-11 items-center justify-center rounded-full text-neutral-900"
            aria-label="Back"
          >
            <ArrowLeft className="size-6" strokeWidth={2} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <GroupHeaderAvatar />
            <span className="truncate text-sm font-semibold text-neutral-900 font-[family-name:var(--font-comic)]">
              Comic Sans Lab
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-neutral-900"
              aria-label="Start planning"
              onClick={() => setOverlay("start")}
            >
              <Play className="size-5 fill-current" />
            </button>
            <Link
              href="/group-settings"
              className="flex size-11 items-center justify-center rounded-full text-neutral-900"
              aria-label="Group settings"
            >
              <Settings className="size-5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4">
        <p className="shrink-0 pb-4 text-center text-xs text-neutral-400">
          Nov 30, 2023, 9:41 AM
        </p>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-3">
          {CHAT_MESSAGES.map((m) => (
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

      {/* Plan card after Purpose+Date; voting then full votes + CTA */}
      {showPlanCard && (
        <div className="shrink-0 px-4 pb-2">
          <div
            className="rounded-2xl px-4 py-4 text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            <p className="text-center text-sm font-medium leading-snug">
              {planCardTitle}
            </p>

            {planningPhase === "voting" && (
              <>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-full bg-neutral-200/90 px-4 py-3 text-left text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 active:scale-[0.99]"
                    onClick={() => setPlanningPhase("voting_complete")}
                  >
                    <span>Yes</span>
                    <span className="text-neutral-600">4 votes</span>
                  </button>
                  <div className="flex w-full items-center justify-between rounded-full bg-neutral-200/90 px-4 py-3 text-sm font-semibold text-neutral-900">
                    <span>No</span>
                    <span className="text-neutral-600">0 votes</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs italic text-white/95">
                  {voteSecondsLeft > 0
                    ? `1 vote left - ${voteSecondsLeft} sec remaining...`
                    : "Time's up..."}
                </p>
              </>
            )}

            {planningPhase === "voting_complete" && (
              <>
                <div className="mt-4 space-y-3">
                  <VoteProgressBar
                    label="Yes"
                    votesLabel="5 votes"
                    fillPct={80}
                  />
                  <VoteProgressBar
                    label="No"
                    votesLabel="0 votes"
                    fillPct={0}
                  />
                </div>
                <Link
                  href="/limits"
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 active:scale-[0.99] font-[family-name:var(--font-comic)]"
                >
                  Click to Start Plan
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Composer */}
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

      {/* Modal overlay */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
                  monthLabel="March, 2026"
                  selectedDay={pastSelectedDay}
                  setSelectedDay={setPastSelectedDay}
                  cells={pastCalendarCells}
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
                  monthLabel="March, 2022"
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  cells={newPlanCalendarCells}
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

export function GroupChatClient() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white text-sm text-neutral-400">
            Loading…
          </div>
        }
      >
        <GroupChatInner />
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
        className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          className="w-full rounded-full py-4 text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: PRIMARY }}
          onClick={onPast}
        >
          Use Past Successful Hangout Spots
        </button>
        <button
          type="button"
          className="w-full rounded-full py-4 text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
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
  onClose,
  onNext,
}: {
  monthLabel: string;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  cells: (number | null)[];
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
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="Next month"
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
