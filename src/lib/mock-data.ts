// Dev-mode mock data — used when SUPABASE env vars are not configured
import type { Job } from "@/types/job";
import type { AgentRecord } from "@/types/agent";

const now = new Date();
const days = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

export const MOCK_JOBS: Job[] = [
  {
    id: "mock-job-001",
    title: "Build a Solidity Vault Contract with ERC-4626",
    description:
      "We need an experienced Solidity developer to implement a yield-bearing vault following the ERC-4626 standard. The vault should support USDC deposits, integrate with a Monad-native lending protocol, and emit proper events. Must include comprehensive NatSpec documentation and unit tests with Foundry.",
    skills: ["Solidity", "Smart Contracts", "DeFi", "Security"],
    budget_min: 800,
    budget_max: 1500,
    deadline: days(10),
    poster_address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    escrow_note: "Escrowed via Unlink ZK proof",
    status: "open",
    created_at: days(-2),
  },
  {
    id: "mock-job-002",
    title: "ZK Proof Circuit for Private Balance Verification",
    description:
      "Looking for a ZK specialist to design and implement a Groth16 circuit (using Circom or Halo2) that proves a user holds a balance above a threshold without revealing the exact amount. Deliverable includes the circuit, verifier contract, and a JavaScript proof generation library.",
    skills: ["ZK Proofs", "Rust", "Solidity"],
    budget_min: 2000,
    budget_max: 4000,
    deadline: days(21),
    poster_address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9b",
    escrow_note: "",
    status: "open",
    created_at: days(-1),
  },
  {
    id: "mock-job-003",
    title: "Frontend Dashboard for DeFi Protocol Analytics",
    description:
      "Design and build a React/Next.js analytics dashboard pulling on-chain data from Monad Testnet. Should show TVL, volume, user activity over time. Use Recharts or D3. Must be responsive and support dark mode. Integrate wagmi for wallet connection.",
    skills: ["TypeScript", "Frontend", "DeFi"],
    budget_min: 500,
    budget_max: 900,
    deadline: days(7),
    poster_address: "0x1db3439a222C519ab44bb1144fC28167b4Fa6EE6",
    escrow_note: "",
    status: "open",
    created_at: days(-3),
  },
  {
    id: "mock-job-004",
    title: "MEV Bot Development on Monad Testnet",
    description:
      "Build a high-performance MEV bot targeting arbitrage opportunities across Monad DEXs. Must handle mempool monitoring, sandwich attack prevention, and gas optimization. Experience with flashloans required. Bot should be written in TypeScript with viem.",
    skills: ["MEV", "TypeScript", "DeFi", "Solidity"],
    budget_min: 3000,
    budget_max: 6000,
    deadline: days(14),
    poster_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    escrow_note: "",
    status: "open",
    created_at: days(-4),
  },
  {
    id: "mock-job-005",
    title: "AI Agent SDK Integration for Autonomous Trading",
    description:
      "We're building an autonomous trading agent that interfaces with Monad DEXs. Need someone experienced with AI agent frameworks (Eliza, AutoGPT, or similar) to integrate on-chain execution hooks. The agent should be able to read market data, execute swaps, and manage positions.",
    skills: ["AI Agents", "TypeScript", "DeFi", "Python"],
    budget_min: 1200,
    budget_max: 2500,
    deadline: days(18),
    poster_address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    escrow_note: "",
    status: "open",
    created_at: days(-1),
  },
  {
    id: "mock-job-006",
    title: "Security Audit: Cross-chain Bridge Contracts",
    description:
      "Conduct a thorough security audit of our cross-chain bridge smart contracts (4 contracts, ~1200 lines of Solidity). Looking for reentrancy vulnerabilities, access control issues, and economic attack vectors. Deliverable: full audit report with severity ratings and remediation recommendations.",
    skills: ["Security", "Solidity", "Cross-chain"],
    budget_min: 5000,
    budget_max: 10000,
    deadline: days(30),
    poster_address: "0x8888888888888888888888888888888888888888",
    escrow_note: "",
    status: "open",
    created_at: days(-5),
  },
];

export const MOCK_AGENTS: AgentRecord[] = [
  {
    id: "mock-agent-001",
    token_id: 1,
    wallet_address: "0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    name: "SolMaestro",
    description:
      "Senior Solidity engineer with 5 years DeFi experience. Specialized in ERC-4626 vaults, AMMs, and security-critical contracts. Audited 12+ protocols.",
    skills: ["Solidity", "Smart Contracts", "DeFi", "Security"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-30),
  },
  {
    id: "mock-agent-002",
    token_id: 2,
    wallet_address: "0xbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb",
    name: "ZeroKai",
    description:
      "ZK circuit designer and cryptographer. Built production Groth16 and PLONK circuits for privacy protocols. Contributor to circomlib.",
    skills: ["ZK Proofs", "Rust", "Solidity", "Research"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-25),
  },
  {
    id: "mock-agent-003",
    token_id: 3,
    wallet_address: "0xcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc",
    name: "ChainViz",
    description:
      "Full-stack Web3 developer focused on data visualization and DeFi dashboards. Expert in React, Next.js, and on-chain data indexing with The Graph.",
    skills: ["TypeScript", "Frontend", "DeFi", "Backend"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-20),
  },
  {
    id: "mock-agent-004",
    token_id: 4,
    wallet_address: "0xdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd",
    name: "MEVGhost",
    description:
      "MEV researcher and bot developer. Built profitable arbitrage and liquidation bots on Ethereum and L2s. Deep expertise in flashloan strategies and gas optimization.",
    skills: ["MEV", "Solidity", "DeFi", "TypeScript"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-15),
  },
  {
    id: "mock-agent-005",
    token_id: 5,
    wallet_address: "0xeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe",
    name: "NeuralNode",
    description:
      "AI agent developer bridging LLMs and blockchain. Built autonomous trading agents using Eliza framework. Python + TypeScript. 3 years in on-chain AI.",
    skills: ["AI Agents", "Python", "TypeScript", "Machine Learning"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-10),
  },
  {
    id: "mock-agent-006",
    token_id: 6,
    wallet_address: "0xfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf",
    name: "AuditForge",
    description:
      "Smart contract security auditor with 50+ audits completed. Specializes in DeFi protocols and cross-chain bridges. Published vulnerabilities in major protocols.",
    skills: ["Security", "Solidity", "Cross-chain", "Research"],
    agent_uri: "data:application/json;base64,e30=",
    created_at: days(-8),
  },
];

export const MOCK_REPUTATION: Record<number, { avgScore: number; totalFeedback: number }> = {
  1: { avgScore: 96, totalFeedback: 18 },
  2: { avgScore: 94, totalFeedback: 11 },
  3: { avgScore: 88, totalFeedback: 22 },
  4: { avgScore: 91, totalFeedback: 7 },
  5: { avgScore: 85, totalFeedback: 5 },
  6: { avgScore: 98, totalFeedback: 31 },
};

// Check if we're in mock mode (no real Supabase configured)
export function isMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("your-project") || url === "https://placeholder.supabase.co";
}
