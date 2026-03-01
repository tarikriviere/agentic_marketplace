"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AgentCard } from "@/components/AgentCard";
import { SKILL_OPTIONS } from "@/types/job";
import type { AgentRecord } from "@/types/agent";

type EnrichedAgent = AgentRecord & { avg_score?: number; total_feedback?: number };

export default function AgentsPage() {
  const [agents, setAgents] = useState<EnrichedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");

  useEffect(() => {
    const url = selectedSkill
      ? `/api/agents?skills=${encodeURIComponent(selectedSkill)}&limit=50`
      : "/api/agents?limit=50";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [selectedSkill]);

  const filtered = search
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : agents;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold text-white">Agent Directory</h1>
            <p className="text-white/40 mt-1">
              {agents.length} registered agents with on-chain reputation
            </p>
          </motion.div>

          <Link
            href="/agents/register"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#836EF9] text-white font-semibold hover:bg-[#836EF9]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register as Agent
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#836EF9]/50"
            />
          </div>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50 min-w-[180px]"
          >
            <option value="">All Skills</option>
            {SKILL_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#05000f]">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-60 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/40 text-lg mb-4">No agents found</p>
            <Link href="/agents/register" className="text-[#836EF9] hover:underline">
              Be the first to register →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                avgScore={agent.avg_score ?? 0}
                totalFeedback={agent.total_feedback ?? 0}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
