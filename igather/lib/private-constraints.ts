/** Set when user submits the Private Constraints form; proposals use this to show filtered state */
export const PRIVATE_CONSTRAINTS_SESSION_KEY = "igather-private-constraints-v1";

/** Proposal ids the user chose to keep despite a private-constraint match */
export const PRIVATE_CONSTRAINTS_IGNORED_IDS_KEY =
  "igather-private-constraints-ignored-v1";

export type PrivateConstraintsPayload = {
  budget: string;
  travel: string;
  other: string;
  submittedAt: number;
};

export function readPrivateConstraints(): PrivateConstraintsPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PRIVATE_CONSTRAINTS_SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PrivateConstraintsPayload>;
    if (typeof p.submittedAt !== "number") return null;
    return {
      budget: typeof p.budget === "string" ? p.budget : "",
      travel: typeof p.travel === "string" ? p.travel : "",
      other: typeof p.other === "string" ? p.other : "",
      submittedAt: p.submittedAt,
    };
  } catch {
    return null;
  }
}

/** Max $ per person from user input (e.g. "$2", "2", "$15.50"). Null = no budget rule. */
export function parseBudgetCapPerPerson(budgetRaw: string): number | null {
  const s = budgetRaw.replace(/[$,\s]/g, "").trim();
  if (!s) return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Extract numeric prices from strings like "Price Per Person: $20-$30" */
export function parsePriceRangeFromLabel(priceLabel: string): {
  min: number;
  max: number;
} | null {
  const nums = priceLabel.match(/\d+(?:\.\d+)?/g);
  if (!nums?.length) return null;
  const values = nums.map((x) => Number(x)).filter(Number.isFinite);
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** True if the cheapest listed price is still above the user's cap. */
export function proposalViolatesBudget(
  priceLabel: string,
  budgetCap: number | null,
): boolean {
  if (budgetCap === null) return false;
  const range = parsePriceRangeFromLabel(priceLabel);
  if (!range) return false;
  return range.min > budgetCap;
}

export function formatBudgetCapLabel(cap: number): string {
  if (Number.isInteger(cap)) return `$${cap}`;
  return `$${cap}`;
}

export function readIgnoredProposalIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(PRIVATE_CONSTRAINTS_IGNORED_IDS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeIgnoredProposalIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PRIVATE_CONSTRAINTS_IGNORED_IDS_KEY,
      JSON.stringify(ids),
    );
  } catch {
    /* ignore */
  }
}

export function addIgnoredProposalId(id: string): void {
  const cur = readIgnoredProposalIds();
  if (cur.includes(id)) return;
  writeIgnoredProposalIds([...cur, id]);
}

export function clearIgnoredProposalIds(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PRIVATE_CONSTRAINTS_IGNORED_IDS_KEY);
  } catch {
    /* ignore */
  }
}

export function clearPrivateConstraintsSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PRIVATE_CONSTRAINTS_SESSION_KEY);
    clearIgnoredProposalIds();
  } catch {
    /* ignore */
  }
}
