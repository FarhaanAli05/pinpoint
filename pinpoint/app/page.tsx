import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Pinpoint
        </h1>
        <p className="mb-8 text-lg text-muted">
          Form a housing group, then see housing that fits everyone.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Get Started
          </Link>
          <Link
            href="/map"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-base font-semibold text-foreground transition-colors hover:bg-primary-light"
          >
            Explore Demo Map
          </Link>
        </div>
      </div>
    </div>
  );
}
