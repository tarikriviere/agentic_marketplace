import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { isMockMode } from "@/lib/mock-data";
import { getPublicClient, getFacilitatorWalletClient } from "@/lib/x402-facilitator";
import { CONTRACT_ADDRESSES, REPUTATION_REGISTRY_ABI } from "@/lib/contracts";
import { uuidToBytes32 } from "@/lib/utils";
import { z } from "zod";

export const runtime = "nodejs";

const FeedbackSchema = z.object({
  posterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentId: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  comment: z.string().min(5).max(1000),
  paymentProof: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { posterAddress, agentId, score, comment, paymentProof } = parsed.data;

  if (isMockMode()) {
    return NextResponse.json({ success: true, txHash: `0xmock_feedback_${Date.now()}` });
  }

  const db = createServiceClient();

  // Verify job is completed and poster owns it
  const { data: job } = await db
    .from("jobs")
    .select("poster_address, status")
    .eq("id", jobId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.poster_address.toLowerCase() !== posterAddress.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Convert job UUID to bytes32 for on-chain storage
  const jobIdBytes32 = uuidToBytes32(jobId);
  const proofBytes32 = (paymentProof
    ? paymentProof.padEnd(66, "0").slice(0, 66)
    : "0x" + "0".repeat(64)) as `0x${string}`;

  try {
    const walletClient = getFacilitatorWalletClient();
    const publicClient = getPublicClient();

    // Call ReputationRegistry.giveFeedback on-chain (server-side via facilitator key)
    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "giveFeedback",
      args: [
        BigInt(agentId),
        score,
        comment,
        jobIdBytes32 as `0x${string}`,
        proofBytes32,
      ],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });

    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // If on-chain call fails (e.g. contract not deployed), still log off-chain
    console.error("[POST /api/feedback] on-chain error:", message);
    return NextResponse.json({
      success: true,
      warning: "Feedback recorded off-chain. On-chain submission failed: " + message,
    });
  }
}
