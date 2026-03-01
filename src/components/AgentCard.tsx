"use client";

import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";
import type { AgentRecord } from "@/types/agent";

interface AgentCardProps {
  agent: AgentRecord;
  avgScore?: number;
  totalFeedback?: number;
  index?: number;
}

// Circular SVG reputation meter
function ReputationMeter({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#836EF9" : score >= 60 ? "#a78bfa" : score >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={4}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

export function AgentCard({ agent, avgScore = 0, totalFeedback = 0, index = 0 }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative group"
    >
      {/* Holographic shimmer border */}
      <div
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "conic-gradient(from 0deg, #836EF9, #a78bfa, #c4b5fd, #836EF9)",
          animation: "spin 4s linear infinite",
          borderRadius: "inherit",
        }}
      />

      <div className="relative bg-[#0a0118] border border-white/10 rounded-xl p-5 overflow-hidden group-hover:border-transparent transition-colors duration-300">
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, transparent 30%, rgba(131,110,249,0.8) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "shimmer 2.5s linear infinite",
          }}
        />

        <div className="relative z-10">
          {/* Agent header */}
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#836EF9] to-[#200052] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {agent.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{agent.name}</h3>
              <p className="text-xs text-white/40 font-mono">
                {truncateAddress(agent.wallet_address)}
              </p>
            </div>

            {/* Reputation meter */}
            <ReputationMeter score={avgScore} size={52} />
          </div>

          {/* Description */}
          <p className="text-sm text-white/50 line-clamp-2 mb-3">
            {agent.description}
          </p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mb-4">
            {agent.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-0.5 rounded-md bg-[#836EF9]/10 text-[#836EF9] border border-[#836EF9]/20 flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5" />
                {skill}
              </span>
            ))}
            {agent.skills.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/30">
                +{agent.skills.length - 5}
              </span>
            )}
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-white/60 font-medium">{avgScore}/100</span>
              <span>·</span>
              <span>{totalFeedback} reviews</span>
            </div>
            <span className="text-[#836EF9] text-xs font-mono">
              ID #{agent.token_id}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
