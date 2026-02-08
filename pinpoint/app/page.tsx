"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Form your unit",
    desc: "Set budget, move-in date, and dealbreakers. Invite your group with a single link.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Add listings",
    desc: "Paste a URL from any site. AI extracts rent, dates, and features automatically.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "See what fits",
    desc: "Every listing is scored against your group's needs. Great, OK, or Conflict — instantly.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Reach out together",
    desc: "AI drafts personalized landlord messages. Track who's been contacted. Stay aligned.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
];

const SHOWCASE_FEATURES = [
  { label: "Budget", value: "$600–$900/mo", color: "text-primary" },
  { label: "Move-in", value: "Sep 2025", color: "text-accent" },
  { label: "Bedrooms", value: "2–4 BR", color: "text-fit-great" },
  { label: "Members", value: "3", color: "text-primary" },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: showcaseRef,
    offset: ["start end", "end start"],
  });

  const showcaseY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const showcaseRotate = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -1]);
  const showcaseScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.98]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">
      {/* Dot-map background */}
      <div className="dot-map-bg pointer-events-none fixed inset-0 z-0" />

      {/* ─── LANDING HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="font-mono text-sm font-semibold tracking-tight">Pinpoint</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/auth/signin?callbackUrl=%2Flistings%2Fmap"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signin?callbackUrl=%2Flistings%2Fmap"
            className="inline-flex items-center gap-1 rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </nav>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Gradient overlay from top */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/80 px-4 py-1.5 text-xs text-muted backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Built for students finding housing together
          </div> */}

          <h1 className="mb-6 font-mono text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-7xl">
            Housing decisions,
            <br />
            <span className="text-primary">pinpointed.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-muted">
            A coordination layer for group housing. Form your unit, map
            what fits, and reach out together.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signin?callbackUrl=%2Flistings%2Fmap"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-background transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/listings/map"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-subtle px-8 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-surface"
            >
              Explore Demo
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-muted-subtle">
            <span className="text-xs tracking-wider uppercase">scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M3 8l5 5 5-5" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              How it works
            </p>
            <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Four steps to aligned housing
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-xl border border-border bg-surface/60 p-6 backdrop-blur-sm transition-colors hover:border-border-subtle hover:bg-surface"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                    {step.icon}
                  </span>
                  <span className="font-mono text-xs text-muted-subtle">{step.num}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SHOWCASE CARD (Parallax) ─── */}
      <section ref={showcaseRef} className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              At a glance
            </p>
            <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything your group needs
            </h2>
          </motion.div>

          <motion.div
            style={{ y: showcaseY, rotateX: showcaseRotate, scale: showcaseScale }}
            className="mx-auto max-w-2xl [perspective:1200px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xl shadow-black/40">
              {/* Mock app header */}
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-fit-conflict/60" />
                  <span className="h-3 w-3 rounded-full bg-warning/60" />
                  <span className="h-3 w-3 rounded-full bg-fit-great/60" />
                </div>
                <span className="ml-3 font-mono text-xs text-muted-subtle">pinpoint / map</span>
              </div>

              {/* Mock content */}
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-subtle">Your Housing Unit</p>
                    <h3 className="mt-1 text-lg font-bold text-foreground">3 members &middot; Sep 2025</h3>
                  </div>
                  <span className="rounded-full bg-fit-great-bg px-3 py-1 text-xs font-semibold text-fit-great">
                    12 listings
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {SHOWCASE_FEATURES.map((feat) => (
                    <div key={feat.label} className="rounded-lg border border-border bg-background/50 p-3 text-center">
                      <p className="text-xs text-muted-subtle">{feat.label}</p>
                      <p className={`mt-1 text-sm font-bold ${feat.color}`}>{feat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mock listing cards */}
                <div className="mt-5 space-y-2">
                  {[
                    { title: "2BR near Queen's", rent: "$850/mo", tag: "Great", tagColor: "bg-fit-great-bg text-fit-great" },
                    { title: "Studio Downtown", rent: "$720/mo", tag: "OK", tagColor: "bg-fit-ok-bg text-fit-ok" },
                    { title: "4BR Portsmouth", rent: "$1,100/mo", tag: "Great", tagColor: "bg-fit-great-bg text-fit-great" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between rounded-lg border border-border bg-background/30 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-subtle">{item.rent}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="relative z-10 px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="mb-4 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to coordinate?
          </h2>
          <p className="mb-8 text-muted">
            Set up your housing unit in under a minute. No accounts required to browse.
            <br />
            Sign in to save, post, and contact landlords.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signin?callbackUrl=%2Flistings%2Fmap"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-background transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20"
            >
              Create Your Unit
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/listings/map"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-subtle px-8 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-surface"
            >
              Browse Listings
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-subtle">
            No sign-up required. Your data stays local.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 text-center">
        <p className="font-mono text-xs text-muted-subtle">
          &copy; Pinpoint 2026
        </p>
      </footer>
    </div>
  );
}
