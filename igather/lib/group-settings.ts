export const GROUP_SETTINGS_KEY = "igather-group-settings-v1";

export type GroupSettings = {
  startTimerSeconds: number;
};

export const DEFAULT_GROUP_SETTINGS: GroupSettings = {
  startTimerSeconds: 60,
};

const MIN_S = 30;
const MAX_S = 180;

export function clampTimerSeconds(n: number): number {
  return Math.min(MAX_S, Math.max(MIN_S, Math.round(n)));
}

export function readGroupSettings(): GroupSettings {
  if (typeof window === "undefined") return DEFAULT_GROUP_SETTINGS;
  try {
    const raw = localStorage.getItem(GROUP_SETTINGS_KEY);
    if (!raw) return DEFAULT_GROUP_SETTINGS;
    const j = JSON.parse(raw) as Partial<GroupSettings>;
    if (typeof j.startTimerSeconds === "number") {
      return { startTimerSeconds: clampTimerSeconds(j.startTimerSeconds) };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_GROUP_SETTINGS;
}

export function writeGroupSettings(s: GroupSettings): void {
  localStorage.setItem(
    GROUP_SETTINGS_KEY,
    JSON.stringify({ startTimerSeconds: clampTimerSeconds(s.startTimerSeconds) }),
  );
}
