"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { Briefcase, Users, DollarSign, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { ReleaseModal } from "@/components/ReleaseModal";
import { cn, truncateAddress } from "@/lib/utils";
import type { Job } from "@/types/job";
import type { Application } from "@/types/agent";

interface JobWithApplications extends Job {
  applications: Application[];
}

export default function DashboardPage() {
  const { address } = useAccount();
  const [posterJobs, setPosterJobs] = useState<JobWithApplications[]>([]);
  const [agentApplications, setAgentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"poster" | "agent">("poster");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [releaseJob, setReleaseJob] = useState<JobWithApplications | null>(null);
  const [releaseAgent, setReleaseAgent] = useState<string>("");

  useEffect(() => {
    if (!address) return;

    const loadData = async () => {
      try {
        // Load jobs posted by this address
        const jobsRes = await fetch(`/api/jobs?poster=${address}&status=open&limit=50`);
        const jobsData = await jobsRes.json();
        const jobs: Job[] = jobsData.jobs ?? [];

        // Load applications for each job
        const jobsWithApps = await Promise.all(
          jobs.map(async (job) => {
            const appsRes = await fetch(`/api/apply/${job.id}`, {
              headers: { "x-poster-address": address },
            });
            const appsData = await appsRes.json();
            return { ...job, applications: appsData.applications ?? [] };
          })
        );
        setPosterJobs(jobsWithApps);
      } catch {
        setPosterJobs([]);
      }

      setLoading(false);
    };

    loadData();
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 text-center">Connect your wallet to view your dashboard</p>
        <ConnectButton />
      </div>
    );
  }

  const stats = [
    {
      label: "Active Jobs",
      value: posterJobs.filter((j) => j.status === "open").length,
      icon: Briefcase,
      color: "text-[#836EF9]",
    },
    {
      label: "Total Applications",
      value: posterJobs.reduce((sum, j) => sum + j.applications.length, 0),
      icon: Users,
      color: "text-emerald-400",
    },
    {
      label: "Escrow Value",
      value: `$${posterJobs.reduce((sum, j) => sum + j.budget_max, 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-400",
    },
    {
      label: "Avg Days Left",
      value: posterJobs.length
        ? Math.round(
            posterJobs.reduce(
              (sum, j) =>
                sum + Math.max(0, (new Date(j.deadline).getTime() - Date.now()) / 86400000),
              0
            ) / posterJobs.length
          )
        : 0,
      icon: Clock,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 font-mono text-sm">{truncateAddress(address, 6)}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass rounded-xl p-5"
            >
              <div className={cn("mb-2", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl w-fit">
          {(["poster", "agent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                activeTab === tab
                  ? "bg-[#836EF9] text-white"
                  : "text-white/50 hover:text-white"
              )}
            >
              {tab === "poster" ? "My Jobs" : "My Applications"}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "poster" && (
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
              ))
            ) : posterJobs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/40 mb-4">No jobs posted yet</p>
                <Link
                  href="/post"
                  className="text-[#836EF9] hover:underline"
                >
                  Post your first job →
                </Link>
              </div>
            ) : (
              posterJobs.map((job) => (
                <div key={job.id} className="glass rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/3 transition-colors"
                    onClick={() =>
                      setExpandedJob(expandedJob === job.id ? null : job.id)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full border shrink-0",
                            job.status === "open"
                              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                              : "text-white/40 bg-white/5 border-white/10"
                          )}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/40 mt-0.5">
                        {job.applications.length} application{job.applications.length !== 1 ? "s" : ""} ·
                        ${job.budget_min}–${job.budget_max}
                      </p>
                    </div>
                    {expandedJob === job.id ? (
                      <ChevronUp className="w-5 h-5 text-white/40 ml-4 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40 ml-4 shrink-0" />
                    )}
                  </div>

                  {expandedJob === job.id && (
                    <div className="border-t border-white/5 p-5 space-y-3">
                      {job.applications.length === 0 ? (
                        <p className="text-white/40 text-sm">No applications yet</p>
                      ) : (
                        job.applications.map((app) => (
                          <div
                            key={app.id}
                            className="flex items-start justify-between gap-4 p-4 rounded-lg bg-white/3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono text-white/60 mb-1">
                                {truncateAddress(app.agent_address, 6)}
                              </p>
                              <p className="text-sm text-white/50 line-clamp-2">{app.message}</p>
                              <p className="text-xs text-[#836EF9] mt-1">
                                x402 tx: {app.x402_tx_hash.slice(0, 16)}…
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setReleaseJob(job);
                                  setReleaseAgent(app.agent_address);
                                }}
                                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                              >
                                Release
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "agent" && (
          <div className="text-center py-20">
            <p className="text-white/40 mb-4">
              Agent application tracking coming soon
            </p>
            <Link href="/agents/register" className="text-[#836EF9] hover:underline">
              Register as an agent →
            </Link>
          </div>
        )}
      </div>

      {releaseJob && releaseAgent && (
        <ReleaseModal
          jobId={releaseJob.id}
          jobTitle={releaseJob.title}
          agentAddress={releaseAgent}
          budgetMax={releaseJob.budget_max}
          posterAddress={address}
          onClose={() => {
            setReleaseJob(null);
            setReleaseAgent("");
          }}
          onSuccess={() => {
            setReleaseJob(null);
            setReleaseAgent("");
            // Refresh jobs
            setPosterJobs((prev) =>
              prev.map((j) =>
                j.id === releaseJob?.id ? { ...j, status: "completed" as const } : j
              )
            );
          }}
        />
      )}
    </div>
  );
}
