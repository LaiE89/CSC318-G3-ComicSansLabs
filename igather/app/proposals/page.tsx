"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
  SecondaryButton,
} from "@/components/igather/page-surface";
import { PRIVATE_CONSTRAINTS_SESSION_KEY } from "@/lib/private-constraints";

const BLUE = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";

type ProposalItem = {
  id: string;
  rank: string;
  title: string;
  price: string;
  location: string;
  image: string;
  /** Shown crossed out only after user submits private constraints */
  crossedOutAfterPrivateConstraints?: boolean;
  /** Display name in removal popup (without vote suffix) */
  shortName?: string;
  /** Explains why the option was removed (popup body) */
  removalReason?: string;
};

const ALL_PROPOSALS: ProposalItem[] = [
  {
    id: "1",
    rank: "1",
    title: "Koh Lipe Thai (4/5 Votes)",
    price: "Price Per Person: $20-$30",
    location: "Location: 35 Baldwin St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    id: "2",
    rank: "2",
    title: "Fox on John (4/5 Votes)",
    price: "Price Per Person: $20-$30",
    location: "Location: 106 John St #3, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  },
  {
    id: "3",
    rank: "3",
    title: "4Ever Sushi (3/5 Votes)",
    price: "Price Per Person: $25-$35",
    location: "Location: 225 Queen St W, Toronto, ON M5V 1Z4",
    image:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
    crossedOutAfterPrivateConstraints: true,
    shortName: "4Ever Sushi",
    removalReason:
      "The budget exceeded one of the member's private constraints.",
  },
  {
    id: "4",
    rank: "4",
    title: "Dear Saigon (3/5 Votes)",
    price: "Price Per Person: $10-$20",
    location: "Location: 185 College St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
  },
  {
    id: "5",
    rank: "5",
    title: "Pasta Paradise (2/5 Votes)",
    price: "Price Per Person: $18-$28",
    location: "Location: 220 Queen St W, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  },
];

const INITIAL_COUNT = 3;

function hasSubmittedPrivateConstraints(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!sessionStorage.getItem(PRIVATE_CONSTRAINTS_SESSION_KEY);
  } catch {
    return false;
  }
}

export default function ProposalsPage() {
  const [showAll, setShowAll] = useState(false);
  const [removedDetail, setRemovedDetail] = useState<ProposalItem | null>(null);
  const [constraintsApplied, setConstraintsApplied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "suggestions") {
      try {
        sessionStorage.removeItem(PRIVATE_CONSTRAINTS_SESSION_KEY);
      } catch {
        /* ignore */
      }
      setConstraintsApplied(false);
      const n = params.get("n");
      const clean = n
        ? `/proposals?n=${encodeURIComponent(n)}`
        : "/proposals";
      window.history.replaceState(null, "", clean);
      return;
    }
    setConstraintsApplied(hasSubmittedPrivateConstraints());
  }, []);

  const visibleItems = useMemo(
    () => (showAll ? ALL_PROPOSALS : ALL_PROPOSALS.slice(0, INITIAL_COUNT)),
    [showAll],
  );

  return (
    <PhoneShell>
      <div className={`relative flex min-h-0 flex-1 flex-col bg-[#FAFAFA] ${COMIC}`}>
        <PageHeaderCentered title="Proposals" backHref="/suggestions" />

        <div className="igather-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="rounded-2xl border border-[#90CAF9]/35 bg-gradient-to-b from-[#F8FAFF] to-white p-3 shadow-[0_1px_2px_rgba(86,141,237,0.08)]">
            <div className="space-y-4">
              {visibleItems.map((item) => {
                const rejected =
                  constraintsApplied &&
                  item.crossedOutAfterPrivateConstraints === true;
                const canExplainRemoval =
                  rejected && item.removalReason && item.shortName;

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
                        aria-label={`Why was ${item.shortName} removed?`}
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

            {!showAll && ALL_PROPOSALS.length > INITIAL_COUNT && (
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
          <SecondaryButton href="/decision-board">Next</SecondaryButton>
        </footer>

        {removedDetail &&
          removedDetail.shortName &&
          removedDetail.removalReason && (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="removed-option-title"
              onClick={() => setRemovedDetail(null)}
            >
              <div
                className="relative w-full max-w-[min(100%,19rem)] rounded-2xl border-2 border-[#568DED] bg-white p-5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setRemovedDetail(null)}
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
                    src={removedDetail.image}
                    alt={removedDetail.shortName}
                    fill
                    className="object-cover"
                    sizes="304px"
                  />
                </div>
                <p className="mt-4 text-center text-base font-bold text-neutral-900">
                  {removedDetail.shortName}
                </p>
                <p className="mt-5 text-center text-sm font-bold text-neutral-900">
                  Reason of Removal:
                </p>
                <p className="mt-2 text-center text-sm italic leading-relaxed text-neutral-700">
                  {removedDetail.removalReason}
                </p>
              </div>
            </div>
          )}

      </div>
    </PhoneShell>
  );
}
