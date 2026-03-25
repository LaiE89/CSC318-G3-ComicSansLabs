import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const PRIMARY = "#568DED";

export const primaryButtonClass =
  "flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]";

export const secondaryButtonClass =
  "flex w-full items-center justify-center rounded-2xl border border-neutral-400 bg-white py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]";

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${primaryButtonClass} ${className}`}
      style={{ backgroundColor: PRIMARY }}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${secondaryButtonClass} ${className}`}>
      {children}
    </Link>
  );
}

/** Light gray rounded header with back button and left-aligned title */
export function PageHeaderWithBack({
  title,
  subtitle,
  backHref = "/",
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  children?: ReactNode;
}) {
  return (
    <header className="shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-5 pt-10">
      <div className="flex items-start gap-2">
        <Link
          href={backHref}
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-snug text-neutral-900 font-[family-name:var(--font-comic)]">
            {title}
          </h1>
          {subtitle}
          {children}
        </div>
      </div>
    </header>
  );
}

/** Centered title header with optional back button (alignment flow / suggestions style) */
export function PageHeaderCentered({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="relative shrink-0 rounded-b-[24px] bg-[#F2F2F2] px-4 pb-5 pt-10">
      {backHref && (
        <Link
          href={backHref}
          className="absolute left-3 top-10 flex size-10 items-center justify-center rounded-full text-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </Link>
      )}
      <h1 className="text-center text-lg font-bold text-neutral-900 font-[family-name:var(--font-comic)]">
        {title}
      </h1>
    </header>
  );
}

export function BorderedCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-black bg-white p-4 ${className}`}
    >
      {children}
    </div>
  );
}
