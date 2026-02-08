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
    desc: "Every listing is scored against your group's needs. Great, OK, or Conflict, instantly.",
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
  { label: "Budget", value: "$600\u2013$900/mo", color: "text-indigo-400" },
  { label: "Move-in", value: "Sep 2025", color: "text-emerald-400" },
  { label: "Bedrooms", value: "2\u20134 BR", color: "text-emerald-400" },
  { label: "Members", value: "3", color: "text-indigo-400" },
];

const SHOWCASE_LISTINGS = [
  {
    title: "2BR near Queen\u2019s",
    rent: "$850/mo",
    tag: "Great",
    cls: "text-emerald-400 bg-emerald-400/10",
  },
  {
    title: "Studio Downtown",
    rent: "$720/mo",
    tag: "OK",
    cls: "text-indigo-400 bg-indigo-400/10",
  },
  {
    title: "4BR Portsmouth",
    rent: "$1,100/mo",
    tag: "Great",
    cls: "text-emerald-400 bg-emerald-400/10",
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

      {/* ── Section nav (fixed, always visible) ── */}
      <nav
        className="fixed left-20 top-1/2 z-30 hidden -translate-y-1/2 lg:flex"
        aria-label="Page sections"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-px bg-gradient-to-b from-transparent to-zinc-300 dark:to-zinc-800" />
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
                  : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-400"
              }`}
              aria-label={`Scroll to ${label}`}
              title={label}
            />
          ))}
          <div className="h-10 w-px bg-gradient-to-b from-zinc-300 to-transparent dark:from-zinc-800" />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-50/80 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100/80 px-4 py-1.5 text-xs text-zinc-500 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-[pulse_3s_ease-in-out_infinite]" />
            Built for students finding housing together
          </div> */}

          <h1 className="mb-6 font-mono text-5xl font-bold leading-[1.1] tracking-tight text-zinc-950 dark:text-white sm:text-7xl">
            Housing decisions,
            <br />
            <span className="text-indigo-500 dark:text-indigo-400">pinpointed.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-zinc-500 dark:text-zinc-500">
            A coordination layer for group housing. Form your unit, map
            what fits, and reach out together.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signin?callbackUrl=/onboard"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-indigo-500 px-8 text-base font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              Get Started
              <svg
                width="16"
                height="16"
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
              href="/listings/map"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-300 px-8 text-base font-semibold text-zinc-700 transition-all hover:border-indigo-400/40 hover:bg-zinc-100 dark:border-zinc-800 dark:text-white dark:hover:border-indigo-500/40 dark:hover:bg-zinc-900"
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
          <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
              scroll
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section id="steps" className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              How it works
            </p>
            <h2 className="font-mono text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
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
                className="group rounded-xl border border-zinc-200 bg-white/60 p-6 backdrop-blur-sm transition-colors hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {step.icon}
                  </span>
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                    {step.num}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
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
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">
              At a glance
            </p>
            <h2 className="font-mono text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Everything your group needs
            </h2>
          </motion.div>

          <motion.div
            style={{ y: showcaseY, scale: showcaseScale }}
            className="mx-auto max-w-2xl"
          >
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-green-500/60" />
                </div>
                <span className="ml-3 font-mono text-xs text-zinc-400 dark:text-zinc-600">
                  pinpoint / map
                </span>
              </div>

              {/* Mock content */}
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                      Your Housing Unit
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      3 members &middot; Sep 2025
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                    12 listings
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {SHOWCASE_FEATURES.map((feat) => (
                    <div
                      key={feat.label}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-[#0A0A0A]/50"
                    >
                      <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        {feat.label}
                      </p>
                      <p className={`mt-1 text-sm font-bold ${feat.color}`}>
                        {feat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2">
                  {SHOWCASE_LISTINGS.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-[#0A0A0A]/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-600">
                          {item.rent}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.cls}`}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="mb-4 font-mono text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Ready to coordinate?
          </h2>
          <p className="mb-8 text-zinc-500">
            Set up your housing unit in under a minute. No accounts required
            to browse. Sign in to save, post, and contact landlords.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signin?callbackUrl=/onboard"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-indigo-500 px-8 text-base font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              Create Your Unit
              <svg
                width="16"
                height="16"
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
              href="/listings/map"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-300 px-8 text-base font-semibold text-zinc-700 transition-all hover:border-indigo-400/40 hover:bg-zinc-100 dark:border-zinc-800 dark:text-white dark:hover:border-indigo-500/40 dark:hover:bg-zinc-900"
            >
              Browse Listings
            </Link>
          </div>
          <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
            No sign-up required. Your data stays local.
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-200 py-8 text-center dark:border-zinc-800">
        <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
          pinpoint · student housing, together
        </p>
      </footer>
    </div>
  );
}
