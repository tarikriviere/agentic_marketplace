// ERC-8004 Agent Metadata format (stored at agentURI)
export interface AgentMetadata {
  name: string;
  description: string;
  image?: string;                // IPFS URI to avatar
  skills: string[];
  contact?: {
    email?: string;
    telegram?: string;
    github?: string;
  };
  availability: "available" | "busy" | "unavailable";
  rateMin?: number;              // USD per hour min
  rateMax?: number;              // USD per hour max
  version: "1.0";
}

// On-chain identity data
export interface AgentIdentity {
  agentURI: string;
  wallet: `0x${string}`;
  registeredAt: bigint;
  active: boolean;
}

// Reputation summary from ReputationRegistry
export interface ReputationSummary {
  totalFeedback: bigint;
  totalScore: bigint;
  avgScore: bigint;
  lastUpdated: bigint;
}

// Full agent profile (identity + metadata + reputation)
export interface AgentProfile {
  tokenId: bigint;
  identity: AgentIdentity;
  metadata: AgentMetadata;
  reputation: ReputationSummary;
}

// Off-chain agent record stored in Supabase
export interface AgentRecord {
  id: string;
  token_id: number;
  wallet_address: string;
  name: string;
  description: string;
  skills: string[];
  agent_uri: string;
  created_at: string;
}

// Application record
export interface Application {
  id: string;
  job_id: string;
  agent_id: number;
  agent_address: string;
  x402_tx_hash: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}
