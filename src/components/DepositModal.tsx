"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Shield, X } from "lucide-react";
import { useUnlink } from "@/hooks/useUnlink";
import { parseEther } from "viem";

interface DepositModalProps {
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}

type Step = "idle" | "depositing" | "success" | "error";

export function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const [step, setStep] = useState<Step>("idle");
  const [amount, setAmount] = useState("0.1");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");
  const { deposit } = useUnlink();

  async function handleDeposit() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    setErrorMsg("");
    setStep("depositing");

    try {
      const hash = await deposit(parseEther(amount));
      setTxHash(hash);
      setStep("success");
      setTimeout(() => onSuccess(hash), 1800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Deposit failed");
      setStep("error");
    }
  }

  // Particle animation data
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.15,
    x: Math.cos((i / 8) * Math.PI * 2) * 40,
    y: Math.sin((i / 8) * Math.PI * 2) * 40,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#0a0118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#836EF9] to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Deposit to Unlink Pool</h2>
              <p className="text-white/40 text-sm mt-0.5">Shield your funds for private payments</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pipeline visualization */}
          <div className="relative flex items-center justify-center py-8 mb-6">
            {/* Wallet node */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-lg">👛</span>
              </div>
              <span className="text-xs text-white/40">Your Wallet</span>
            </div>

            {/* Flowing particles */}
            <div className="relative flex-1 h-1 mx-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 via-[#836EF9]/40 to-white/10" />
              {step === "depositing" &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#836EF9]"
                    animate={{ x: ["0%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.27,
                      ease: "linear",
                    }}
                    style={{ left: 0 }}
                  />
                ))}
            </div>

            {/* Unlink pool node */}
            <div className="relative flex flex-col items-center gap-1.5">
              {step === "depositing" && (
                <motion.div
                  className="absolute inset-0 -m-3 rounded-full bg-[#836EF9]/20"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <div className="relative w-12 h-12 rounded-full bg-[#836EF9]/20 border border-[#836EF9]/40 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#836EF9]" />
              </div>
              <span className="text-xs text-[#836EF9]">Unlink Pool</span>
            </div>
          </div>

          {/* Amount input */}
          {(step === "idle" || step === "error") && (
            <>
              <div className="mb-4">
                <label className="text-sm text-white/60 mb-1.5 block">Amount (MON)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.001"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-[#836EF9]/50"
                    placeholder="0.10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    {["0.1", "0.5", "1"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        className="text-xs px-2 py-1 rounded bg-[#836EF9]/20 text-[#836EF9] hover:bg-[#836EF9]/30"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {errorMsg && <p className="text-red-400 text-xs mt-1.5">{errorMsg}</p>}
              </div>

              <div className="mb-4 text-xs text-white/40 p-3 rounded-lg bg-white/3 border border-white/5">
                Depositing shields your MON from public view. Use shielded funds to pay
                job escrow and application fees without revealing your real address.
              </div>

              <button
                onClick={handleDeposit}
                className="w-full py-3 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold transition-colors"
              >
                Shield {amount || "0"} MON
              </button>
            </>
          )}

          {step === "depositing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-[#836EF9] animate-spin" />
              <p className="text-white/60 text-sm">Shielding your funds…</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-semibold">Funds shielded!</p>
              <p className="text-xs text-white/40 font-mono">{txHash.slice(0, 20)}…</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
