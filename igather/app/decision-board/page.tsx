import { Suspense } from "react";
import DecisionBoardClient from "./decision-board-client";

export default function DecisionBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-white text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <DecisionBoardClient />
    </Suspense>
  );
}
