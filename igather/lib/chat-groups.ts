export const CHAT_GROUPS = [
  "Comic Sans Lab",
  "The Inner Circle",
  "Chaos Committee",
  "No Context Needed",
  "Main Character Energy",
  "Braincell Exchange",
  "The Vibe Department",
  "Delulu Headquarters",
  "Unpaid Therapists",
] as const;

export type ChatGroupId = `${number}`;

export function getChatGroupName(groupId: number): string {
  return CHAT_GROUPS[groupId] ?? CHAT_GROUPS[0];
}

