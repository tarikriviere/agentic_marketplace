"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Calendar, Shield, Users, Tag } from "lucide-react";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  index?: number;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - left - width / 2) / width);
    y.set((e.clientY - top - height / 2) / height);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const statusColors: Record<Job["status"], string> = {
    open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    in_progress: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    completed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  const deadline = new Date(job.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={ref}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group"
      >
        {/* Animated gradient border */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-[#836EF9]/60 via-transparent to-[#836EF9]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <Link href={`/jobs/${job.id}`}>
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#836EF9]/40 transition-colors duration-300 cursor-pointer">
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-3">
              <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">
                {job.title}
              </h3>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border",
                  statusColors[job.status]
                )}
              >
                {job.status.replace("_", " ")}
              </span>
            </div>

            {/* Description */}
            <p className="text-white/50 text-sm line-clamp-2 mb-4">
              {job.description}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 rounded-md bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/20"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                  +{job.skills.length - 4}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/5">
              {/* Budget — ZK shielded */}
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#836EF9]" />
                <span className="text-[#836EF9] font-medium">ZK Shielded</span>
                <span className="text-white/30">·</span>
                <span>
                  ${job.budget_min}–${job.budget_max}
                </span>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className={cn(daysLeft < 3 ? "text-red-400" : "text-white/40")}>
                  {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
