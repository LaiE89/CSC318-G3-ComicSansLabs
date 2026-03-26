"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhoneShell } from "@/components/igather/phone-shell";
import {
  PageHeaderCentered,
  primaryButtonClass,
} from "@/components/igather/page-surface";
import { PRIVATE_CONSTRAINTS_SESSION_KEY } from "@/lib/private-constraints";

const BLUE = "#568DED";
const COMIC = "font-[family-name:var(--font-comic)]";

const inputClass =
  "mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-neutral-400 outline-none transition focus:border-[#568DED]/50 focus:ring-2 focus:ring-[#568DED]/35";

export default function AddConstraintPage() {
  const router = useRouter();
  const [budget, setBudget] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [travel, setTravel] = useState("");
  const [other, setOther] = useState("");

  const handleSubmit = () => {
    try {
      sessionStorage.setItem(
        PRIVATE_CONSTRAINTS_SESSION_KEY,
        JSON.stringify({
          budget,
          timeFrom,
          timeTo,
          travel,
          other,
          submittedAt: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    router.push("/proposals");
  };

  return (
    <PhoneShell>
      <div className={`flex min-h-0 flex-1 flex-col bg-white ${COMIC}`}>
        <PageHeaderCentered title="Private Constraints" backHref="/proposals" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-6 text-center text-sm italic text-neutral-800">
            Constraints shared in this screen will be completely anonymous.
          </p>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-neutral-900">Budget</span>
              <input
                type="text"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={inputClass}
                placeholder="$_______"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-neutral-900">Time</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className={`${inputClass} mt-0 flex-1`}
                  placeholder="__:__"
                  autoComplete="off"
                />
                <span className="text-sm font-semibold text-neutral-600">to</span>
                <input
                  type="text"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className={`${inputClass} mt-0 flex-1`}
                  placeholder="__:__"
                  autoComplete="off"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-neutral-900">Travel</span>
              <input
                type="text"
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                className={inputClass}
                placeholder="____ minutes"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-neutral-900">
                Other Reasons
              </span>
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                rows={4}
                className={`${inputClass} min-h-[7rem] resize-y`}
                placeholder="Anything else we should know?"
              />
            </label>
          </div>
        </div>

        <footer className="shrink-0 px-4 pb-8 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className={primaryButtonClass}
            style={{ backgroundColor: BLUE }}
          >
            Submit Anonymously
          </button>
        </footer>
      </div>
    </PhoneShell>
  );
}
