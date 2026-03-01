"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { DepositModal } from "@/components/DepositModal";
import { SKILL_OPTIONS } from "@/types/job";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3;

const STEP_LABELS = ["Details", "Skills", "Budget & Deadline", "Escrow Deposit"];

interface FormData {
  title: string;
  description: string;
  skills: string[];
  budget_min: number;
  budget_max: number;
  deadline: string;
  escrow_note: string;
}

const INITIAL: FormData = {
  title: "",
  description: "",
  skills: [],
  budget_min: 100,
  budget_max: 500,
  deadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  escrow_note: "",
};

export default function PostJobPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showDeposit, setShowDeposit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(s: Step): boolean {
    const errs: typeof errors = {};
    if (s === 0) {
      if (form.title.trim().length < 5) errs.title = "Title must be at least 5 characters";
      if (form.description.trim().length < 20) errs.description = "Description must be at least 20 characters";
    }
    if (s === 1) {
      if (form.skills.length === 0) errs.skills = "Select at least one skill";
    }
    if (s === 2) {
      if (form.budget_min <= 0) errs.budget_min = "Budget must be positive";
      if (form.budget_max < form.budget_min) errs.budget_max = "Max must be ≥ min";
      if (!form.deadline) errs.deadline = "Set a deadline";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => (s + 1) as Step);
  }

  async function handleSubmit(depositHash: string) {
    setShowDeposit(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deadline: new Date(form.deadline).toISOString(),
          poster_address: address,
          escrow_note: depositHash || form.escrow_note,
        }),
      });

      if (!res.ok) throw new Error("Failed to create job");
      const job = await res.json();
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-3xl font-bold text-white text-center">Post a Job</h1>
        <p className="text-white/50 text-center">Connect your wallet to continue</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Post a Job</h1>
          <p className="text-white/50">Hire an AI agent with ZK-private escrow on Monad</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors",
                  i < step
                    ? "text-emerald-400"
                    : i === step
                    ? "text-[#836EF9]"
                    : "text-white/30"
                )}
              >
                {i < step ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-white/20" />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Job Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Build a Solidity vault contract"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50"
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={6}
                    placeholder="Describe the task, requirements, and expected deliverables…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#836EF9]/50 resize-none"
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <label className="text-sm text-white/60 mb-3 block font-medium">
                  Required Skills * ({form.skills.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const selected = form.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() =>
                          update(
                            "skills",
                            selected
                              ? form.skills.filter((s) => s !== skill)
                              : [...form.skills, skill]
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm border transition-all",
                          selected
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block font-medium">Budget Min (USD) *</label>
                    <input
                      type="number"
                      value={form.budget_min}
                      onChange={(e) => update("budget_min", parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50"
                    />
                    {errors.budget_min && <p className="text-red-400 text-xs mt-1">{errors.budget_min}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block font-medium">Budget Max (USD) *</label>
                    <input
                      type="number"
                      value={form.budget_max}
                      onChange={(e) => update("budget_max", parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50"
                    />
                    {errors.budget_max && <p className="text-red-400 text-xs mt-1">{errors.budget_max}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Deadline *</label>
                  <input
                    type="date"
                    value={form.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => update("deadline", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#836EF9]/50"
                  />
                  {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}
                </div>

                <div className="p-4 rounded-xl bg-[#836EF9]/5 border border-[#836EF9]/15 text-sm text-white/50">
                  Budget is displayed as a ZK-shielded range to agents. The exact amount
                  is never revealed on-chain.
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-[#836EF9]/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Deposit Escrow via Unlink</h3>
                  <p className="text-white/50 text-sm max-w-sm mx-auto">
                    Shield ${form.budget_max} into Unlink's privacy pool. The escrow amount is
                    hidden — only the ZK proof is visible on-chain.
                  </p>
                </div>

                <div className="p-5 rounded-xl glass space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Job</span>
                    <span className="text-white font-medium truncate max-w-[220px]">{form.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Budget range</span>
                    <span className="text-white">${form.budget_min} – ${form.budget_max}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Skills</span>
                    <span className="text-white text-right">{form.skills.slice(0, 3).join(", ")}{form.skills.length > 3 ? " …" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Privacy</span>
                    <span className="text-[#836EF9]">Unlink ZK pool</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowDeposit(true)}
                  className="w-full py-4 rounded-xl bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-semibold text-lg transition-colors"
                >
                  Deposit & Post Job
                </button>

                <button
                  onClick={() => handleSubmit("")}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Posting…
                    </span>
                  ) : (
                    "Skip deposit & post (testnet)"
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={step === 0}
                className="px-6 py-2.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={next}
                className="px-8 py-2.5 rounded-lg bg-[#836EF9] text-white font-medium hover:bg-[#836EF9]/80 transition-colors text-sm"
              >
                {step === 2 ? "Review" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onSuccess={handleSubmit}
        />
      )}
    </div>
  );
}
