import { clearActiveProposalIdsForBoard } from "@/lib/decision-board-active-proposals";
import { clearLockedPlanForGroup } from "@/lib/locked-plan";
import { clearTimeoutContinueContext } from "@/lib/timeout-continue-context";

type PollLike = {
  id: string;
  type?: string;
  phase?: "active" | "complete" | "cancelled";
  cancelledReason?: string;
};

/** Clear locked plan, cancel active polls in the group chat log, and flow context. */
export function cancelGroupPlan(groupId: number): void {
  clearLockedPlanForGroup(groupId);
  clearTimeoutContinueContext();
  clearActiveProposalIdsForBoard();
  try {
    const key = `igather-chat-log-v1-${groupId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;

    const next = (parsed as PollLike[]).map((item) => {
      if (!item || item.type !== "poll" || item.phase === "cancelled") {
        return item;
      }
      return {
        ...item,
        phase: "cancelled" as const,
        cancelledReason: "Plan cancelled.",
      };
    });
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
