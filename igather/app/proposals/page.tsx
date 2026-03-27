"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
  secondaryButtonClass,
} from "@/components/igather/page-surface";
import { cancelGroupPlan } from "@/lib/cancel-group-plan";
import { readActiveChatGroupId } from "@/lib/active-chat-group";
import {
  clearActiveProposalIdsForBoard,
  writeActiveProposalIdsForBoard,
} from "@/lib/decision-board-active-proposals";
import { clearBoardSnapshot } from "@/lib/decision-board-snapshot";
import { clearDecisionBoardStatusMap } from "@/lib/decision-board-status";
import {
  ALL_PROPOSALS_BOARD,
  type ProposalBoardItem,
} from "@/lib/proposals-board-data";
import {
  addIgnoredProposalId,
  clearPrivateConstraintsSession,
  formatBudgetCapLabel,
  parseBudgetCapPerPerson,
  type PrivateConstraintsPayload,
  proposalViolatesBudget,
  readIgnoredProposalIds,
  readPrivateConstraints,
} from "@/lib/private-constraints";

const BLUE = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";

const INITIAL_COUNT = 3;

function proposalShortName(title: string): string {
  const i = title.indexOf("(");
  return (i === -1 ? title : title.slice(0, i)).trim();
}

function isProposalRejected(
  item: ProposalBoardItem,
  constraints: PrivateConstraintsPayload | null,
  ignoredIds: Set<string>,
): { rejected: boolean; budgetReason: string | null } {
  if (!constraints) {
    return { rejected: false, budgetReason: null };
  }
  const cap = parseBudgetCapPerPerson(constraints.budget);
  const violatesBudget = proposalViolatesBudget(item.price, cap);
  if (!violatesBudget || ignoredIds.has(item.id)) {
    return { rejected: false, budgetReason: null };
  }
  const reason =
    cap !== null
      ? `This option's listed price starts above your private budget of ${formatBudgetCapLabel(cap)} per person.`
      : null;
  return { rejected: true, budgetReason: reason };
}

export default function ProposalsPage() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [removedDetail, setRemovedDetail] = useState<ProposalBoardItem | null>(
    null,
  );
  const [constraints, setConstraints] = useState<PrivateConstraintsPayload | null>(
    null,
  );
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);

  useEffect(() => {
    setConstraints(readPrivateConstraints());
    setIgnoredIds(readIgnoredProposalIds());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "suggestions") {
      try {
        clearPrivateConstraintsSession();
        clearActiveProposalIdsForBoard();
      } catch {
        /* ignore */
      }
      setConstraints(null);
      setIgnoredIds([]);
      const n = params.get("n");
      const clean = n
        ? `/proposals?n=${encodeURIComponent(n)}`
        : "/proposals";
      window.history.replaceState(null, "", clean);
    }
  }, []);

  const ignoredSet = useMemo(() => new Set(ignoredIds), [ignoredIds]);

  const budgetCap = useMemo(
    () => (constraints ? parseBudgetCapPerPerson(constraints.budget) : null),
    [constraints],
  );

  const constraintsApplied = constraints !== null;

  const rejectedMeta = useMemo(() => {
    const map = new Map<
      string,
      { rejected: boolean; budgetReason: string | null }
    >();
    for (const item of ALL_PROPOSALS_BOARD) {
      map.set(
        item.id,
        isProposalRejected(item, constraints, ignoredSet),
      );
    }
    return map;
  }, [constraints, ignoredSet]);

  const activeCount = useMemo(() => {
    return ALL_PROPOSALS_BOARD.filter(
      (item) => !rejectedMeta.get(item.id)?.rejected,
    ).length;
  }, [rejectedMeta]);

  const allCrossedOut =
    constraintsApplied &&
    activeCount === 0 &&
    ALL_PROPOSALS_BOARD.length > 0;

  const visibleItems = useMemo(
    () =>
      showAll
        ? ALL_PROPOSALS_BOARD
        : ALL_PROPOSALS_BOARD.slice(0, INITIAL_COUNT),
    [showAll],
  );

  const onIgnorePrivateConstraint = useCallback(() => {
    if (!removedDetail) return;
    addIgnoredProposalId(removedDetail.id);
    setIgnoredIds(readIgnoredProposalIds());
    setRemovedDetail(null);
  }, [removedDetail]);

  const onCancelPlan = useCallback(() => {
    const groupId = readActiveChatGroupId(0);
    cancelGroupPlan(groupId);
    clearPrivateConstraintsSession();
    router.push(`/chat/${groupId}`);
  }, [router]);

  const goToDecisionBoard = useCallback(() => {
    const activeIds = ALL_PROPOSALS_BOARD.filter(
      (p) => !rejectedMeta.get(p.id)?.rejected,
    ).map((p) => p.id);
    clearBoardSnapshot();
    clearDecisionBoardStatusMap();
    writeActiveProposalIdsForBoard(activeIds);
    router.push("/decision-board");
  }, [rejectedMeta, router]);

  return (
    <PhoneShell>
      <div className={`relative flex min-h-0 flex-1 flex-col bg-[#FAFAFA] ${COMIC}`}>
        <PageHeaderCentered title="Proposals" />

        <div className="igather-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="rounded-2xl border border-[#90CAF9]/35 bg-gradient-to-b from-[#F8FAFF] to-white p-3 shadow-[0_1px_2px_rgba(86,141,237,0.08)]">
            <div className="space-y-4">
              {visibleItems.map((item) => {
                const { rejected, budgetReason } =
                  rejectedMeta.get(item.id) ?? {
                    rejected: false,
                    budgetReason: null,
                  };
                const canExplainRemoval = rejected && !!budgetReason;
                const shortName = proposalShortName(item.title);

                const cardInner = (
                  <>
                    <h2 className="text-sm font-bold text-neutral-900">
                      {item.rank}. {item.title}
                    </h2>
                    {canExplainRemoval && (
                      <p className="mt-2 text-center text-xs font-semibold text-neutral-600">
                        Tap to see why this option was removed
                      </p>
                    )}
                    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-200">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    </div>
                    <p
                      className="mt-3 text-sm font-semibold"
                      style={{ color: BLUE }}
                    >
                      {item.price}
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: BLUE }}
                    >
                      {item.location}
                    </p>
                  </>
                );

                const strikeOverlay = rejected && (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    aria-hidden
                  >
                    <div className="h-[6px] w-[125%] max-w-none rotate-[-32deg] bg-red-500 shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
                  </div>
                );

                return (
                  <div key={item.id} className="relative">
                    {canExplainRemoval ? (
                      <button
                        type="button"
                        onClick={() => setRemovedDetail(item)}
                        className="relative w-full cursor-pointer text-left"
                        aria-label={`Why was ${shortName} removed?`}
                      >
                        <BorderedCard
                          className={
                            rejected
                              ? "relative overflow-hidden opacity-95"
                              : ""
                          }
                        >
                          <div className="pointer-events-none">{cardInner}</div>
                        </BorderedCard>
                        {strikeOverlay}
                      </button>
                    ) : (
                      <>
                        <BorderedCard
                          className={
                            rejected
                              ? "relative overflow-hidden opacity-95"
                              : ""
                          }
                        >
                          {cardInner}
                        </BorderedCard>
                        {strikeOverlay}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {!showAll && ALL_PROPOSALS_BOARD.length > INITIAL_COUNT && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-6 w-full text-center text-sm font-semibold underline"
                style={{ color: BLUE }}
              >
                Click Here to View More
              </button>
            )}
          </div>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <PrimaryButton href="/add-constraint">
            Add Private Constraint(s)
          </PrimaryButton>
          {allCrossedOut ? (
            <button
              type="button"
              onClick={onCancelPlan}
              className={secondaryButtonClass}
            >
              Cancel plan
            </button>
          ) : (
            <button
              type="button"
              onClick={goToDecisionBoard}
              className={secondaryButtonClass}
            >
              Next
            </button>
          )}
        </footer>

        {removedDetail &&
          budgetCap !== null &&
          proposalViolatesBudget(removedDetail.price, budgetCap) && (
            <RemovalModal
              item={removedDetail}
              removalReason={`This option's listed price starts above your private budget of ${formatBudgetCapLabel(budgetCap)} per person.`}
              shortName={proposalShortName(removedDetail.title)}
              onClose={() => setRemovedDetail(null)}
              onIgnore={onIgnorePrivateConstraint}
            />
          )}
      </div>
    </PhoneShell>
  );
}

function RemovalModal({
  item,
  removalReason,
  shortName,
  onClose,
  onIgnore,
}: {
  item: ProposalBoardItem;
  removalReason: string;
  shortName: string;
  onClose: () => void;
  onIgnore: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removed-option-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[min(100%,19rem)] rounded-2xl border-2 border-[#568DED] bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-neutral-600 transition hover:bg-neutral-100"
          aria-label="Close"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
        <h2
          id="removed-option-title"
          className="pr-10 text-center text-lg font-bold text-neutral-900"
        >
          Removed option
        </h2>
        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-200">
          <Image
            src={item.image}
            alt={shortName}
            fill
            className="object-cover"
            sizes="304px"
          />
        </div>
        <p className="mt-4 text-center text-base font-bold text-neutral-900">
          {shortName}
        </p>
        <p className="mt-5 text-center text-sm font-bold text-neutral-900">
          Reason for removal:
        </p>
        <p className="mt-2 text-center text-sm italic leading-relaxed text-neutral-700">
          {removalReason}
        </p>
        <button
          type="button"
          onClick={onIgnore}
          className="mt-5 flex w-full items-center justify-center rounded-2xl border border-[#568DED]/40 bg-[#EAF1FD] py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-[#E3ECFC] active:scale-[0.99]"
          style={{ color: BLUE }}
        >
          Ignore private constraint
        </button>
      </div>
    </div>
  );
}
