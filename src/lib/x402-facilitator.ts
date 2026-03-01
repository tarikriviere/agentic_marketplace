import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./monad";

// ─── Viem clients ──────────────────────────────────────────────────────────
export function getPublicClient() {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(
      process.env.NEXT_PUBLIC_MONAD_RPC ?? "https://testnet-rpc.monad.xyz",
      { retryCount: 3, retryDelay: 1000 }
    ),
  });
}

export function getFacilitatorWalletClient() {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) throw new Error("FACILITATOR_PRIVATE_KEY not set");

  const account = privateKeyToAccount(privateKey as Hex);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(
      process.env.NEXT_PUBLIC_MONAD_RPC ?? "https://testnet-rpc.monad.xyz",
      { retryCount: 3, retryDelay: 1000 }
    ),
  });
}

// ─── ERC-3009 transferWithAuthorization ABI ────────────────────────────────
const ERC3009_ABI = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function balanceOf(address) view returns (uint256)",
]);

// ─── x402 Payment Payload types ───────────────────────────────────────────
export interface X402PaymentPayload {
  from: Hex;
  to: Hex;
  value: string;           // hex string
  validAfter: string;      // hex string
  validBefore: string;     // hex string
  nonce: Hex;
  v: number;
  r: Hex;
  s: Hex;
  tokenAddress: Hex;
  chainId: number;
}

export interface FacilitatorResult {
  success: boolean;
  txHash?: Hex;
  error?: string;
}

// ─── Verify and settle x402 payment ───────────────────────────────────────
export async function settleX402Payment(
  payload: X402PaymentPayload
): Promise<FacilitatorResult> {
  // Validate chain
  if (payload.chainId !== 10143) {
    return { success: false, error: `Unsupported chainId: ${payload.chainId}. Expected 10143 (Monad Testnet)` };
  }

  // Validate receiver matches marketplace wallet
  const marketplaceWallet = process.env.NEXT_PUBLIC_MARKETPLACE_WALLET?.toLowerCase();
  if (marketplaceWallet && payload.to.toLowerCase() !== marketplaceWallet) {
    return { success: false, error: "Payment receiver mismatch" };
  }

  // Validate validBefore timestamp
  const now = Math.floor(Date.now() / 1000);
  const validBefore = parseInt(payload.validBefore, 16);
  const validAfter = parseInt(payload.validAfter, 16);

  if (now > validBefore) {
    return { success: false, error: "Payment authorization expired" };
  }
  if (now < validAfter) {
    return { success: false, error: "Payment authorization not yet valid" };
  }

  try {
    const walletClient = getFacilitatorWalletClient();
    const publicClient = getPublicClient();

    // Submit the ERC-3009 transferWithAuthorization
    const txHash = await walletClient.writeContract({
      address: payload.tokenAddress,
      abi: ERC3009_ABI,
      functionName: "transferWithAuthorization",
      args: [
        payload.from,
        payload.to,
        BigInt(payload.value),
        BigInt(payload.validAfter),
        BigInt(payload.validBefore),
        payload.nonce,
        payload.v,
        payload.r,
        payload.s,
      ],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 30_000,
    });

    if (receipt.status === "success") {
      return { success: true, txHash };
    } else {
      return { success: false, error: "Transaction reverted" };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ─── Build a 402 Payment Required response ────────────────────────────────
export function buildPaymentRequired(baseUrl: string) {
  const marketplaceWallet = process.env.NEXT_PUBLIC_MARKETPLACE_WALLET ?? "";
  return {
    scheme: "exact",
    network: "eip155:10143",
    payTo: marketplaceWallet,
    maxAmountRequired: "100000",  // 0.10 USDC (6 decimals)
    resource: `${baseUrl}/api/apply`,
    description: "Agent application fee — skin in the game",
    mimeType: "application/json",
    outputSchema: null,
    facilitatorUrl: `${baseUrl}/api/facilitator`,
    extra: {
      name: "Agent Marketplace",
      version: "1.0",
    },
  };
}
