import Image from "next/image";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  BorderedCard,
  PageHeaderCentered,
  PrimaryButton,
  SecondaryButton,
} from "@/components/igather/page-surface";

const BLUE = "#568DED";

const COMIC = "font-[family-name:var(--font-comic)]";

const ITEMS = [
  {
    rank: "1",
    title: "Koh Lipe Thai (4/5 Votes)",
    price: "Price Per Person: $10-$20",
    location: "Location: 35 Baldwin St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    rank: "2",
    title: "Fox on John (3/5 Votes)",
    price: "Price Per Person: $10-$20",
    location: "Location: 106 John St #3, Toronto",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  },
];

export default function ProposalsPage() {
  return (
    <PhoneShell>
      <div
        className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}
      >
        <PageHeaderCentered title="Proposals" backHref="/suggestions" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="rounded-2xl border border-dashed border-[#90CAF9] bg-white p-3">
            <div className="space-y-4">
              {ITEMS.map((item) => (
                <BorderedCard key={item.rank}>
                  <h2 className="text-sm font-bold text-neutral-900">
                    {item.rank}. {item.title}
                  </h2>
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
                </BorderedCard>
              ))}
            </div>

            <p
              className="mt-6 w-full text-center text-sm font-semibold underline"
              style={{ color: BLUE }}
            >
              Click Here to View More
            </p>
          </div>
        </div>

        <footer className="shrink-0 space-y-3 px-4 pb-8 pt-2">
          <PrimaryButton href="/add-constraint">
            Add Private Constraint(s)
          </PrimaryButton>
          <SecondaryButton href="/chat">Skip</SecondaryButton>
        </footer>
      </div>
    </PhoneShell>
  );
}
