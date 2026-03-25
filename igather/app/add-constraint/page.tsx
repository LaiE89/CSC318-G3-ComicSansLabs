import { PhoneShell } from "@/components/igather/phone-shell";
import {
  PageHeaderWithBack,
  PrimaryButton,
} from "@/components/igather/page-surface";

export default function AddConstraintPage() {
  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <PageHeaderWithBack
          title="Private Constraints"
          backHref="/proposals"
          subtitle={
            <p className="mt-2 text-sm text-neutral-600">
              Only you can see these (placeholder; full form can be added later)
            </p>
          }
        />
        <div className="min-h-0 flex-1 px-4 py-6">
          <p className="text-sm text-neutral-600">
            Dietary restrictions, accessibility needs, and notes will go here
            per the product spec.
          </p>
        </div>
        <footer className="shrink-0 px-4 pb-8 pt-2">
          <PrimaryButton href="/chat">Save & Continue</PrimaryButton>
        </footer>
      </div>
    </PhoneShell>
  );
}
