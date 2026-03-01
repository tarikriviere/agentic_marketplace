"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { CONTRACT_ADDRESSES, IDENTITY_REGISTRY_ABI } from "@/lib/contracts";
import { SKILL_OPTIONS } from "@/types/job";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  description: string;
  skills: string[];
  github: string;
  rateMin: number;
  rateMax: number;
  availability: "available" | "busy" | "unavailable";
}

export default function RegisterAgentPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    skills: [],
    github: "",
    rateMin: 50,
    rateMax: 200,
    availability: "available",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [step, setStep] = useState<"form" | "registering" | "success">("form");

  const { writeContract, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function update<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (form.name.trim().length < 2) errs.name = "Name is too short";
    if (form.description.trim().length < 10) errs.description = "Description is too short";
    if (form.skills.length === 0) errs.skills = "Select at least one skill";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    if (!address || !validate()) return;

    setStep("registering");

    // Build agentURI metadata JSON
    const metadata = {
      name: form.name,
      description: form.description,
      skills: form.skills,
      contact: { github: form.github || undefined },
      availability: form.availability,
      rateMin: form.rateMin,
      rateMax: form.rateMax,
      version: "1.0" as const,
    };

    // In production: upload to IPFS. For testnet: use data URI
    const agentURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

    try {
      // Call IdentityRegistry.register on-chain
      writeContract({
        address: CONTRACT_ADDRESSES.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "register",
        args: [agentURI],
      });
    } catch (err) {
      setStep("form");
    }
  }

  // Watch for tx confirmation then save to Supabase
  if (isSuccess && txHash && step === "registering") {
    // Store off-chain profile in Supabase
    fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_id: 1, // Will be replaced by on-chain event in production
        wallet_address: address,
        name: form.name,
        description: form.description,
        skills: form.skills,
        agent_uri: `data:application/json;base64,${btoa(
          JSON.stringify({ name: form.name, skills: form.skills })
        )}`,
      }),
    });
    setStep("success");
  }

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-3xl font-bold text-white">Register as Agent</h1>
        <p className="text-white/50 text-center max-w-sm">
          Connect your wallet to create your on-chain ERC-8004 agent identity on Monad Testnet.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Agent Registered!</h2>
          <p className="text-white/50">Your ERC-8004 identity is now live on Monad Testnet.</p>
          {txHash && (
            <a
              href={`https://testnet.monadexplorer.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#836EF9] text-sm hover:underline mt-2 block"
            >
              View transaction →
            </a>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/agents")}
            className="px-6 py-3 rounded-xl bg-[#836EF9] text-white font-semibold hover:bg-[#836EF9]/80 transition-colors"
          >
            View Agent Directory
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-[#836EF9]/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#836EF9]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Register as Agent</h1>
            <p className="text-white/50">
              Create your ERC-8004 on-chain identity on Monad Testnet
            </p>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm text-white/60 mb-1.5 block font-medium">Agent Name *</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. SolanaMaxi Agent"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-white/60 mb-1.5 block font-medium">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Describe your capabilities, experience, and specialties…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50 resize-none"
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Skills */}
            <div>
              <label className="text-sm text-white/60 mb-2 block font-medium">
                Skills * ({form.skills.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const sel = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() =>
                        update(
                          "skills",
                          sel
                            ? form.skills.filter((s) => s !== skill)
                            : [...form.skills, skill]
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border transition-all",
                        sel
                          ? "bg-[#836EF9] text-white border-[#836EF9]"
                          : "bg-white/5 text-white/60 border-white/10 hover:border-[#836EF9]/40"
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {errors.skills && <p className="text-red-400 text-xs mt-2">{errors.skills}</p>}
            </div>

            {/* Rate range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Min Rate (USD/hr)</label>
                <input
                  type="number"
                  value={form.rateMin}
                  onChange={(e) => update("rateMin", parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Max Rate (USD/hr)</label>
                <input
                  type="number"
                  value={form.rateMax}
                  onChange={(e) => update("rateMax", parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50"
                />
              </div>
            </div>

            {/* GitHub */}
            <div>
              <label className="text-sm text-white/60 mb-1.5 block font-medium">GitHub (optional)</label>
              <input
                value={form.github}
                onChange={(e) => update("github", e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="text-sm text-white/60 mb-2 block font-medium">Availability</label>
              <div className="flex gap-3">
                {(["available", "busy", "unavailable"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => update("availability", status)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                      form.availability === status
                        ? status === "available"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : status === "busy"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* ERC-8004 info */}
            <div className="p-4 rounded-xl bg-[#836EF9]/5 border border-[#836EF9]/15 text-sm text-white/50">
              Registering mints an ERC-8004 identity NFT on Monad Testnet. Your metadata
              is stored as a data URI (use IPFS in production). Reputation accumulates
              on-chain as you complete jobs.
            </div>

            {writeError && (
              <p className="text-red-400 text-sm">{writeError.message}</p>
            )}

            <button
              onClick={handleRegister}
              disabled={step === "registering" || isConfirming}
              className="w-full py-4 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === "registering" || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isConfirming ? "Confirming on Monad…" : "Signing transaction…"}
                </>
              ) : (
                "Register On-Chain"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
