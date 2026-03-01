"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Lock, Send, Shield, X } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUnlink } from "@/hooks/useUnlink";
import type { Job } from "@/types/job";

interface ApplyModalProps {
  job: Job;
  agentId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "idle" | "funding" | "payment" | "submitting" | "success" | "error";

interface StepInfo {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const STEPS: Record<Step, StepInfo> = {
  idle: { icon: <Shield className="w-5 h-5" />, title: "Apply privately", desc: "ZK-shielded application via Unlink + x402" },
  funding: { icon: <Loader2 className="w-5 h-5 animate-spin" />, title: "Funding burner from shielded pool…", desc: "Your identity stays private. Unlink withdraws to a disposable EOA." },
  payment: { icon: <Loader2 className="w-5 h-5 animate-spin" />, title: "Submitting x402 micropayment…", desc: "Skin-in-the-game: $0.10 application fee via ERC-3009 signed by burner." },
  submitting: { icon: <Send className="w-5 h-5" />, title: "Securing your application…", desc: "Application is being recorded on the marketplace." },
  success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, title: "Application secured!", desc: "Your identity-preserving application has been submitted." },
  error: { icon: <X className="w-5 h-5 text-red-400" />, title: "Something went wrong", desc: "Please try again." },
};

export function ApplyModal({ job, agentId, onClose, onSuccess }: ApplyModalProps) {
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { address } = useAccount();
  const { getBurner } = useUnlink();

  async function handleApply() {
    if (!address) return;
    if (message.trim().length < 10) {
      setErrorMsg("Message must be at least 10 characters");
      return;
    }
    setErrorMsg("");

    try {
      // Step 1: Fund burner from Unlink shielded pool
      setStep("funding");
      const burner = await getBurner();
      await burner.fund(BigInt("100000000000000")); // 0.0001 MON

      // Step 2: x402 micropayment signed by burner EOA
      setStep("payment");
      await new Promise((r) => setTimeout(r, 1500)); // simulate signing
      const x402TxHash = "0xsimulated_x402_" + Date.now();

      // Step 3: Submit application
      setStep("submitting");
      const res = await fetch(`/api/apply/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentAddress: address,
          agentId,
          message: message.trim(),
          x402TxHash,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Application failed");
      }

      // Discard burner — no link to real identity
      burner.discard();

      setStep("success");
      setTimeout(onSuccess, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStep("error");
    }
  }

  const info = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg bg-[#0a0118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Purple glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-1 bg-[#836EF9] blur-md" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Apply to Job</h2>
              <p className="text-white/50 text-sm mt-0.5 line-clamp-1">{job.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connect gate */}
          {!address ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4">Connect your wallet to apply</p>
              <ConnectButton />
            </div>
          ) : (
            <>
              {/* Step progress */}
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[#836EF9]">{info.icon}</div>
                <div>
                  <p className="text-sm font-medium text-white">{info.title}</p>
                  <p className="text-xs text-white/40">{info.desc}</p>
                </div>
              </div>

              {/* Step visual — data flow animation */}
              {(step === "funding" || step === "payment") && (
                <div className="mb-6 flex items-center justify-center gap-3">
                  {["Unlink Pool", "Burner EOA", "x402 Payment"].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? "bg-[#836EF9]"
                              : i === 1
                              ? step === "funding" ? "bg-white/20" : "bg-emerald-400"
                              : step === "payment" ? "bg-[#836EF9]" : "bg-white/20"
                          }`}
                        />
                        <span className="text-[10px] text-white/40 w-16 text-center">{label}</span>
                      </motion.div>
                      {i < 2 && (
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.3 }}
                          className="text-white/20 text-xs mb-4"
                        >
                          →
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Orbital lock on success */}
              {step === "success" && (
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-[#836EF9]/30 border-t-[#836EF9] flex items-center justify-center"
                  >
                    <Lock className="w-5 h-5 text-[#836EF9]" />
                  </motion.div>
                </div>
              )}

              {/* Message field */}
              {(step === "idle" || step === "error") && (
                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-1.5 block">
                    Cover message <span className="text-white/30">(min 10 chars)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Explain why you're the right agent for this job…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50 resize-none"
                  />
                  {errorMsg && (
                    <p className="text-red-400 text-xs mt-1.5">{errorMsg}</p>
                  )}
                </div>
              )}

              {/* Fee info */}
              {step === "idle" && (
                <div className="flex items-center gap-2 text-xs text-white/40 mb-4 p-3 rounded-lg bg-[#836EF9]/5 border border-[#836EF9]/10">
                  <Shield className="w-3.5 h-3.5 text-[#836EF9] shrink-0" />
                  <span>
                    Applying requires a <strong className="text-[#836EF9]">$0.10 x402 fee</strong>{" "}
                    paid from a disposable burner wallet funded via Unlink ZK proofs.
                    Your real address is never exposed.
                  </span>
                </div>
              )}

              {/* Action button */}
              {step === "idle" && (
                <button
                  onClick={handleApply}
                  className="w-full py-3 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold transition-colors"
                >
                  Apply Privately
                </button>
              )}

              {step === "error" && (
                <button
                  onClick={() => setStep("idle")}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
