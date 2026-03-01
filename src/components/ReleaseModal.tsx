"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Shield, X, Lock } from "lucide-react";
import { useUnlink } from "@/hooks/useUnlink";
import { parseEther } from "viem";

interface ReleaseModalProps {
  jobId: string;
  jobTitle: string;
  agentAddress: string;
  budgetMax: number;
  posterAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "idle" | "transferring" | "confirming" | "success" | "error";

export function ReleaseModal({
  jobId,
  jobTitle,
  agentAddress,
  budgetMax,
  posterAddress,
  onClose,
  onSuccess,
}: ReleaseModalProps) {
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { privateTransfer } = useUnlink();

  async function handleRelease() {
    setStep("transferring");
    try {
      // Unlink private transfer — poster shielded → agent shielded
      const unlinkProofHash = await privateTransfer(
        agentAddress as `0x${string}`,
        parseEther(budgetMax.toString())
      );

      setStep("confirming");

      // Notify backend to update job status
      const res = await fetch(`/api/release/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posterAddress,
          agentAddress,
          amount: parseEther(budgetMax.toString()).toString(),
          unlinkProofHash,
        }),
      });

      if (!res.ok) throw new Error("Release confirmation failed");

      setStep("success");
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Release failed");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Release Escrow</h2>
              <p className="text-white/40 text-sm truncate max-w-[240px]">{jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transfer visualization */}
          <div className="flex items-center gap-4 justify-center py-6 mb-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#836EF9]" />
              </div>
              <span className="text-xs text-white/40">Your Pool</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="h-px w-full bg-gradient-to-r from-[#836EF9]/40 to-emerald-400/40 relative">
                {step === "transferring" && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#836EF9]"
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  />
                )}
              </div>
              <span className="text-xs text-[#836EF9] font-medium">ZK Private</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Agent Pool</span>
            </div>
          </div>

          {step === "idle" && (
            <>
              <div className="mb-4 p-4 rounded-xl bg-white/3 border border-white/5 text-sm text-white/60 space-y-1.5">
                <div className="flex justify-between">
                  <span>Release amount</span>
                  <span className="text-white font-medium">${budgetMax} in MON</span>
                </div>
                <div className="flex justify-between">
                  <span>Recipient</span>
                  <span className="text-white font-mono text-xs">{agentAddress.slice(0, 8)}…{agentAddress.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Privacy</span>
                  <span className="text-[#836EF9]">Unlink ZK proof</span>
                </div>
              </div>
              <button
                onClick={handleRelease}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-500/80 text-white font-semibold transition-colors"
              >
                Release Payment Privately
              </button>
            </>
          )}

          {(step === "transferring" || step === "confirming") && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-[#836EF9] animate-spin" />
              <p className="text-white/60 text-sm">
                {step === "transferring" ? "Executing Unlink private transfer…" : "Confirming on-chain…"}
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-semibold">Escrow released!</p>
              <p className="text-xs text-white/40">Agent received payment privately via Unlink</p>
            </div>
          )}

          {step === "error" && (
            <>
              <p className="text-red-400 text-sm mb-4 text-center">{errorMsg}</p>
              <button
                onClick={() => setStep("idle")}
                className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
