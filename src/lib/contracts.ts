import { type Address } from "viem";

// ─── Contract addresses (set via .env.local after deployment) ──────────────
export const CONTRACT_ADDRESSES = {
  identityRegistry: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ?? "0x0000000000000000000000000000000000000000") as Address,
  reputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY ?? "0x0000000000000000000000000000000000000000") as Address,
  validationRegistry: (process.env.NEXT_PUBLIC_VALIDATION_REGISTRY ?? "0x0000000000000000000000000000000000000000") as Address,
} as const;

// ─── IdentityRegistry ABI ──────────────────────────────────────────────────
export const IDENTITY_REGISTRY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    name: "updateAgentURI",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "newURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "authorizeWallet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "wallet", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "getIdentity",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agentURI", type: "string" },
          { name: "wallet", type: "address" },
          { name: "registeredAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAgentId",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "walletToAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalAgents",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "wallet", type: "address", indexed: true },
      { name: "agentURI", type: "string", indexed: false },
    ],
  },
] as const;

// ─── ReputationRegistry ABI ───────────────────────────────────────────────
export const REPUTATION_REGISTRY_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "score", type: "uint8" },
      { name: "comment", type: "string" },
      { name: "jobId", type: "bytes32" },
      { name: "paymentProof", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "getSummary",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "totalFeedback", type: "uint256" },
          { name: "totalScore", type: "uint256" },
          { name: "avgScore", type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getFeedbacks",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "result",
        type: "tuple[]",
        components: [
          { name: "agentId", type: "uint256" },
          { name: "poster", type: "address" },
          { name: "score", type: "uint8" },
          { name: "comment", type: "string" },
          { name: "jobId", type: "bytes32" },
          { name: "paymentProof", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "FeedbackGiven",
    type: "event",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "poster", type: "address", indexed: true },
      { name: "score", type: "uint8", indexed: false },
      { name: "jobId", type: "bytes32", indexed: false },
    ],
  },
] as const;

// ─── ValidationRegistry ABI ───────────────────────────────────────────────
export const VALIDATION_REGISTRY_ABI = [
  {
    name: "requestValidation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "bytes32" },
      { name: "poster", type: "address" },
      { name: "workURI", type: "string" },
      { name: "selfScore", type: "uint8" },
    ],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    name: "respond",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "score", type: "uint8" },
      { name: "feedback", type: "string" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "getRequest",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "jobId", type: "bytes32" },
          { name: "agentId", type: "uint256" },
          { name: "poster", type: "address" },
          { name: "workURI", type: "string" },
          { name: "selfScore", type: "uint8" },
          { name: "requestedAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
] as const;
