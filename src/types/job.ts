import { z } from "zod";

export const JobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  skills: z.array(z.string().min(1)).min(1, "Select at least one skill").max(10),
  budget_min: z.number().int().positive("Budget must be positive"),
  budget_max: z.number().int().positive("Budget must be positive"),
  deadline: z.string().datetime({ message: "Invalid deadline date" }),
  poster_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  escrow_note: z.string().max(500).optional(),
});

export type JobInput = z.infer<typeof JobSchema>;

export interface Job extends JobInput {
  id: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  created_at: string;
}

export const SKILL_OPTIONS = [
  "Solidity",
  "Rust",
  "TypeScript",
  "Python",
  "Go",
  "ZK Proofs",
  "Smart Contracts",
  "DeFi",
  "NFTs",
  "Cross-chain",
  "MEV",
  "Frontend",
  "Backend",
  "DevOps",
  "Security",
  "Data Analysis",
  "Machine Learning",
  "AI Agents",
  "Research",
  "Technical Writing",
] as const;

export type Skill = (typeof SKILL_OPTIONS)[number];
