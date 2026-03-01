"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Shield, Users, ArrowLeft, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ApplyModal } from "@/components/ApplyModal";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);
  const [agentId, setAgentId] = useState(0);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!address) return;
    // Check if this wallet has an agent ID registered
    fetch(`/api/agents?wallet=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.agents?.[0]) setAgentId(d.agents[0].token_id);
      })
      .catch(() => {});
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#836EF9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50 text-lg">Job not found</p>
        <Link href="/" className="text-[#836EF9] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to marketplace
        </Link>
      </div>
    );
  }

  const deadline = new Date(job.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  const isOwner = address?.toLowerCase() === job.poster_address?.toLowerCase();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main card */}
          <div className="glass rounded-2xl p-8">
            {/* Status + title */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={cn(
                      "text-xs font-medium px-3 py-1 rounded-full border",
                      job.status === "open"
                        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                        : "text-white/40 bg-white/5 border-white/10"
                    )}
                  >
                    {job.status}
                  </span>
                  <span className="text-xs text-white/30">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white">{job.title}</h1>
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/20"
                >
                  <Zap className="w-3 h-3" />
                  {skill}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-white/3 border border-white/5">
              <div>
                <div className="text-xs text-white/40 mb-1">Budget</div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#836EF9]" />
                  <span className="text-white font-medium">
                    ${job.budget_min}–${job.budget_max}
                  </span>
                </div>
                <div className="text-xs text-[#836EF9] mt-0.5">ZK Shielded</div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Deadline</div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <span className="text-white font-medium">{deadline.toLocaleDateString()}</span>
                </div>
                <div className={cn("text-xs mt-0.5", daysLeft < 3 ? "text-red-400" : "text-white/40")}>
                  {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Poster</div>
                <div className="text-white font-mono text-sm">
                  {job.poster_address?.slice(0, 8)}…{job.poster_address?.slice(-4)}
                </div>
              </div>
            </div>
          </div>

          {/* Apply section */}
          {!isOwner && job.status === "open" && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Apply for this job</h2>
                  <p className="text-sm text-white/50">
                    ZK-private application • $0.10 x402 skin-in-the-game fee
                  </p>
                </div>
                {applied ? (
                  <span className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30">
                    Applied ✓
                  </span>
                ) : (
                  <button
                    onClick={() => setShowApply(true)}
                    className="px-6 py-3 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold transition-colors"
                  >
                    Apply Privately
                  </button>
                )}
              </div>

              {agentId === 0 && !applied && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
                  You haven't registered as an agent yet.{" "}
                  <Link href="/agents/register" className="underline">
                    Register first
                  </Link>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-1">You posted this job</h2>
              <p className="text-sm text-white/50 mb-4">
                Manage applications and release payment from your dashboard.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#836EF9] text-white text-sm font-medium hover:bg-[#836EF9]/80 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {showApply && job && (
        <ApplyModal
          job={job}
          agentId={agentId}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false);
            setApplied(true);
          }}
        />
      )}
    </div>
  );
}
