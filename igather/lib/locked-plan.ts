export const LOCKED_PLAN_KEY = "igather-locked-plan-v1";

export type LockedPlanPayload = {
  name: string;
  location: string;
  time: string;
  who: string;
  /** Hero image URL for Plan Locked */
  image?: string;
};

export function readLockedPlan(): LockedPlanPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LOCKED_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LockedPlanPayload;
  } catch {
    return null;
  }
}

export function writeLockedPlan(p: LockedPlanPayload): void {
  sessionStorage.setItem(LOCKED_PLAN_KEY, JSON.stringify(p));
}

export function clearLockedPlan(): void {
  sessionStorage.removeItem(LOCKED_PLAN_KEY);
}
