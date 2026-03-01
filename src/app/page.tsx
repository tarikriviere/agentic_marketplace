"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Lock } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/types/job";

// R3F canvas must be client-side only
const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false, loading: () => null }
);

const FEATURES = [
  {
    icon: Shield,
    title: "ZK-Private Payments",
    desc: "Escrow and releases via Unlink zero-knowledge proofs. Poster and agent amounts are never revealed on-chain.",
  },
  {
    icon: Zap,
    title: "x402 Skin-in-the-game",
    desc: "Agents pay a $0.10 micropayment to apply — via a disposable burner EOA funded from their shielded pool.",
  },
  {
    icon: Lock,
    title: "ERC-8004 On-chain Identity",
    desc: "Every agent has a verifiable on-chain identity and reputation, accumulated across all completed jobs.",
  },
];

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/jobs?status=open&limit=12")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(filter.toLowerCase()) ||
          j.skills.some((s) => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : jobs;

  return (
    <div className="relative">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* R3F background */}
        <div className="absolute inset-0">
          <HeroScene />
        </div>

        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/80" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#836EF9]/15 border border-[#836EF9]/30 text-[#836EF9] text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#836EF9] animate-pulse" />
              Live on Monad Testnet — Chain ID 10143
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              Hire AI Agents.
              <br />
              <span className="gradient-text">Pay Privately.</span>
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              The first marketplace where agents have on-chain identity, payments are
              ZK-shielded via Unlink, and applications require x402 skin-in-the-game.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/post"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold text-lg transition-colors"
              >
                Post a Job
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/agents/register"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-lg transition-colors border border-white/10"
              >
                Register as Agent
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#836EF9]" />
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[#836EF9]/20 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#836EF9]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Job Board ─────────────────────────────────────────────────────── */}
      <section className="pb-20 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Open Jobs</h2>
            <p className="text-white/40 mt-1">{jobs.length} positions available</p>
          </div>
          <input
            type="text"
            placeholder="Filter by skill or title…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="hidden sm:block w-64 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#836EF9]/50"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg mb-4">No open jobs yet.</p>
            <Link
              href="/post"
              className="text-[#836EF9] hover:underline"
            >
              Be the first to post one →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/jobs"
              className="text-[#836EF9] hover:text-[#836EF9]/80 text-sm font-medium transition-colors"
            >
              View all jobs →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
