export const LOCKED_PLAN_KEY = "igather-locked-plan-v1";

const LOCKED_PLAN_KEY_PREFIX = "igather-locked-plan-v1-";

export type LockedPlanPayload = {
  name: string;
  location: string;
  time: string;
  who: string;
  /** Hero image URL for Plan Locked */
  image?: string;
};

export function readLockedPlan(): LockedPlanPayload | null {
  return readLockedPlanForGroup(0);
}

export function writeLockedPlan(p: LockedPlanPayload): void {
  writeLockedPlanForGroup(0, p);
}

export function clearLockedPlan(): void {
  clearLockedPlanForGroup(0);
}

export function readLockedPlanForGroup(groupIndex: number): LockedPlanPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${LOCKED_PLAN_KEY_PREFIX}${groupIndex}`);
    // Backward compatibility: older sessions used a single key.
    const fallbackRaw = groupIndex === 0 ? sessionStorage.getItem(LOCKED_PLAN_KEY) : null;
    const effectiveRaw = raw ?? fallbackRaw;
    if (!effectiveRaw) return null;
    return JSON.parse(effectiveRaw) as LockedPlanPayload;
  } catch {
    return null;
  }
}

export function writeLockedPlanForGroup(
  groupIndex: number,
  p: LockedPlanPayload,
): void {
  sessionStorage.setItem(
    `${LOCKED_PLAN_KEY_PREFIX}${groupIndex}`,
    JSON.stringify(p),
  );
}

export function clearLockedPlanForGroup(groupIndex: number): void {
  sessionStorage.removeItem(`${LOCKED_PLAN_KEY_PREFIX}${groupIndex}`);
}
