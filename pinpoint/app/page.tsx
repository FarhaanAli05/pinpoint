"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ── Static data ── */

const STEPS = [
  {
    num: "01",
    title: "Form your unit",
    desc: "Set budget, move-in date, and dealbreakers. Invite your group with a single link.",
  },
  {
    num: "02",
    title: "Add listings",
    desc: "Paste a URL from any site. AI extracts rent, dates, and features automatically.",
  },
  {
    num: "03",
    title: "See what fits",
    desc: "Every listing is scored against your group. Great, OK, or Conflict — instantly.",
  },
  {
    num: "04",
    title: "Reach out together",
    desc: "AI drafts personalized landlord messages. Track contacts. Stay aligned.",
  },
];

const SHOWCASE_FEATURES = [
  { label: "Budget", value: "$600–$900" },
  { label: "Move-in", value: "Sep 2025" },
  { label: "Bedrooms", value: "2–4 BR" },
  { label: "Listings", value: "12" },
];

const SHOWCASE_LISTINGS = [
  {
    title: "2BR near Queen's",
    rent: "$850/mo",
    tag: "Great fit",
    cls: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10",
  },
  {
    title: "Studio Downtown",
    rent: "$720/mo",
    tag: "OK fit",
    cls: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-400/10",
  },
  {
    title: "4BR Portsmouth",
    rent: "$1,100/mo",
    tag: "Great fit",
    cls: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10",
  },
];

const SECTIONS = [
  { id: "hero", label: "Top" },
  { id: "steps", label: "How" },
  { id: "showcase", label: "Preview" },
] as const;

/* ── Page ── */

export default function HomePage() {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("hero");

  /* Track which section is in view */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  /* Showcase parallax */
  const { scrollYProgress: showcaseProgress } = useScroll({
    target: showcaseRef,
    offset: ["start end", "end start"],
  });
  const showcaseY = useTransform(showcaseProgress, [0, 1], [40, -40]);
  const showcaseScale = useTransform(
    showcaseProgress,
    [0, 0.5, 1],
    [0.97, 1, 0.98],
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-[#0A0A0A]">
      {/* Dot grid background */}
      <div className="dot-grid pointer-events-none fixed inset-0 z-0" />

      {/* ── Section nav (always visible) ── */}
      <nav
        className="fixed left-20 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
        aria-label="Page sections"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-px bg-gradient-to-b from-transparent to-zinc-200 dark:to-zinc-800/50" />
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                activeSection === id
                  ? "scale-125 bg-zinc-900 dark:bg-white"
                  : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500"
              }`}
              aria-label={`Scroll to ${label}`}
              title={label}
            />
          ))}
          <div className="h-10 w-px bg-gradient-to-b from-zinc-200 to-transparent dark:from-zinc-800/50" />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-50/80 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          {/* <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
            Student housing search
          </p> */}

          <h1 className="mb-6 font-mono text-5xl font-medium leading-[1.08] tracking-tight text-zinc-950 dark:text-white sm:text-7xl">
            Housing decisions,
            <br />
            pinpointed.
          </h1>

          <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-zinc-500 dark:text-white/50">
            Search listings, compare with your group, and reach out to
            landlords. One place for the whole process.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/listings/map"
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-zinc-900 px-7 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Open map
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/auth/signin?callbackUrl=/onboard"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-7 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              Sign in to get started
            </Link>
          </div>

          <p className="mt-5 text-xs text-zinc-400 dark:text-zinc-600">
            Browse listings without an account.
            {" "}
            <Link
              href="/auth/signin?callbackUrl=/listings"
              className="underline underline-offset-2 transition-colors hover:text-zinc-600 dark:hover:text-zinc-400"
            >
              Sign in
            </Link>
            {" "}to save, post, and contact.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-1.5 text-zinc-400 dark:text-zinc-700">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em]">
              scroll
            </span>
            <motion.svg
              animate={{ y: [0, 3, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </motion.svg>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section id="steps" className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
              How it works
            </p>
            <h2 className="font-mono text-2xl font-medium tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Four steps to aligned housing
            </h2>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-lg border border-zinc-200 bg-white/60 p-5 transition-colors hover:border-zinc-300 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70"
              >
                <span className="font-mono text-[10px] tracking-wider text-zinc-400 dark:text-zinc-600">
                  {step.num}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase card (parallax) ── */}
      <section
        id="showcase"
        ref={showcaseRef}
        className="relative z-10 px-4 py-24"
      >
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
              At a glance
            </p>
            <h2 className="font-mono text-2xl font-medium tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Everything your group needs
            </h2>
          </motion.div>

          <motion.div
            style={{ y: showcaseY, scale: showcaseScale }}
            className="mx-auto max-w-xl"
          >
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-red-500/40" />
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-yellow-500/40" />
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-green-500/40" />
                <span className="ml-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                  pinpoint / your unit
                </span>
              </div>

              {/* Mock content */}
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                      Housing Unit
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">
                      3 members &middot; Sep 2025
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Kingston, ON
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {SHOWCASE_FEATURES.map((f) => (
                    <div
                      key={f.label}
                      className="rounded-md border border-zinc-100 bg-zinc-50 p-2 text-center dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                      <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                        {f.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-zinc-900 dark:text-white">
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  Candidate listings
                </p>
                <div className="space-y-1.5">
                  {SHOWCASE_LISTINGS.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/30"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                          {item.rent}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${item.cls}`}
                      >
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

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-md text-center"
        >
          <h2 className="mb-3 font-mono text-2xl font-medium tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Ready to coordinate?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-zinc-500">
            Set up your housing unit in under a minute. Browse listings
            freely. Sign in to post, save, and contact landlords.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/listings/map"
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-zinc-900 px-7 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Open map
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/auth/signin?callbackUrl=/onboard"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-7 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              Create your unit
            </Link>
          </div>
          {/* <p className="mt-5 font-mono text-[10px] tracking-wider text-zinc-400 dark:text-zinc-700">
            Browsing is free &middot; Sign in to post and contact
          </p> */}
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-200 py-6 text-center dark:border-zinc-800/60">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-700">
          pinpoint &middot; student housing, together
        </p>
      </footer>
    </div>
  );
}
