"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
} from "@/components/igather/page-surface";

const BLUE = "#568DED";

const COMIC = "font-[family-name:var(--font-comic)]";

type Suggestion = {
  id: string;
  rank: string;
  name: string;
  price: string;
  location: string;
  image: string;
};

const ALL_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    rank: "1",
    name: "Koh Lipe Thai",
    price: "Price Per Person: $20-$30",
    location: "Location: 35 Baldwin St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    id: "2",
    rank: "2",
    name: "Dear Saigon",
    price: "Price Per Person: $10-$20",
    location: "Location: 185 College St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1559314809-9d75509e091e?w=800&q=80",
  },
  {
    id: "3",
    rank: "3",
    name: "Fox on John",
    price: "Price Per Person: $15-$25",
    location: "Location: 106 John St #3, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  },
  {
    id: "4",
    rank: "4",
    name: "Pasta Paradise",
    price: "Price Per Person: $18-$28",
    location: "Location: 220 Queen St W, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  },
  {
    id: "5",
    rank: "5",
    name: "Sushi Dreams",
    price: "Price Per Person: $25-$40",
    location: "Location: 88 Spadina Ave, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1579584425555-4a2a37e6c4b0?w=800&q=80",
  },
];

const INITIAL_VISIBLE = 2;

export default function SuggestionsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const visibleItems = useMemo(
    () => (showAll ? ALL_SUGGESTIONS : ALL_SUGGESTIONS.slice(0, INITIAL_VISIBLE)),
    [showAll],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <PhoneShell>
      <div className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Suggestions" backHref="/timeout" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-4 text-center text-sm text-neutral-800">
            Here are some suggestions based on your personal constraints
          </p>

          <div className="space-y-4">
            {visibleItems.map((item) => {
              const isOn = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full text-left"
                >
                  <BorderedCard
                    className={`transition ${isOn ? "ring-2 ring-[#568DED]" : ""}`}
                  >
                    <h2 className="text-sm font-bold text-neutral-900">
                      {item.rank}. {item.name}
                    </h2>
                    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-200">
                      <Image
                        src={item.image}
                        alt={item.name}
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
                  </BorderedCard>
                </button>
              );
            })}
          </div>

          {!showAll && (
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

        <footer className="shrink-0 px-4 pb-8 pt-2">
          <PrimaryButton href={`/proposals?n=${selected.size}`}>
            Add Selected ({selected.size})
          </PrimaryButton>
        </footer>
      </div>
    </PhoneShell>
  );
}
