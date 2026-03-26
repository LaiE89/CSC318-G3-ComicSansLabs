"use client";

import {
  DEFAULT_AVAILABILITY,
  type Segment,
} from "@/components/igather/availability-editor";

export const PROFILE_STORAGE_KEY = "igather-profile-v1";

export type StoredProfile = {
  name: string;
  availability: Segment[][];
  budget: string;
  travel: string;
};

export const DEFAULT_PROFILE: StoredProfile = {
  name: "Ethan",
  availability: DEFAULT_AVAILABILITY,
  budget: "$100",
  travel: "30 min",
};

export function readProfile(): StoredProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<StoredProfile> | null;
    if (!parsed) return DEFAULT_PROFILE;

    const availability = parsed.availability;
    if (!Array.isArray(availability)) return DEFAULT_PROFILE;

    return {
      name: typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name
        : DEFAULT_PROFILE.name,
      availability: availability as Segment[][],
      budget:
        typeof parsed.budget === "string" && parsed.budget.trim()
          ? parsed.budget
          : DEFAULT_PROFILE.budget,
      travel:
        typeof parsed.travel === "string" && parsed.travel.trim()
          ? parsed.travel
          : DEFAULT_PROFILE.travel,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function writeProfile(profile: StoredProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function updateProfile(overrides: Partial<StoredProfile>): void {
  writeProfile({ ...readProfile(), ...overrides });
}

