import { Router, Request, Response, type IRouter } from "express";
import type { TransactionWithStatus } from "../types.js";
import { getTransactionStatus } from "../lib/format.js";
import {
  getTransactionsByAddress,
  getTransaction,
  updateTransaction,
} from "../lib/supabase/index.js";
import { fetchTransfers, type ZerionHistoryItem } from "../lib/zerion.js";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

/** Pure Zerion-only item (external on-chain tx not in our DB) */
function zerionOnlyToActivity(z: ZerionHistoryItem, safeAddress: string): TransactionWithStatus {
  return {
    id: `zerion:${z.hash}`,
    source: "zerion-only",
    operationType: z.operation,
    tradeReceived: z.tradeReceived,
    valueUSD: z.valueUSD,
    // For receives, tx.to is used as the "from" display address in TransactionRow
    to: z.direction === "send" ? z.recipient : z.sender,
    amount: z.amount,
    token: z.tokenSymbol,
    tokenIconUrl: z.tokenIconUrl || null,
    direction: z.direction,
    tokenAddress: z.tokenAddress,
    proposedBy: safeAddress,
    signatures: [],
    ownerAddresses: [],
    threshold: 2,
    safeAddress,
    userOp: {},
    partialSignatures: "",
    proposedAt: z.timestamp,
    executedAt: z.timestamp,
    txHash: z.hash,
    success: true,
    status: "executed",
  };
}

/** Merge Zerion op data into a Zhentan record — Zerion wins on operation/direction/token details */
function mergeWithZerion(
  tx: TransactionWithStatus,
  z: ZerionHistoryItem
): TransactionWithStatus {
  return {
    ...tx,
    source: "both",
    operationType: z.operation,
    direction: z.direction,
    tradeReceived: z.tradeReceived,
    valueUSD: z.valueUSD,
    // Prefer Zerion token details (richer) but fall back to what we stored
    tokenIconUrl: z.tokenIconUrl || tx.tokenIconUrl,
  };
}

export function createTransactionsRouter(): IRouter {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    try {
      const safeAddress = req.query.safeAddress as string;

      if (!safeAddress || !ADDRESS_RE.test(safeAddress)) {
        res.status(400).json({ error: "Missing or invalid safeAddress" });
        return;
      }

      // Fetch our records and Zerion history in parallel; Zerion has a 4s timeout
      const [ourResult, zerionResult] = await Promise.allSettled([
        getTransactionsByAddress(safeAddress),
        withTimeout(fetchTransfers(safeAddress), 4000),
      ]);

      const ourTxs = ourResult.status === "fulfilled" ? ourResult.value : [];
      const zerionItems = zerionResult.status === "fulfilled" ? zerionResult.value : [];

      // Index Zerion items by hash for O(1) lookup
      const zerionByHash = new Map(zerionItems.map((z) => [z.hash.toLowerCase(), z]));

      // Process our DB records:
      // - executed with a matching Zerion record → "both" (Zhentan risk data + Zerion op details)
      // - everything else → "zhentan-only" (pending / in_review / rejected / no Zerion match)
      const ourActivity: TransactionWithStatus[] = ourTxs.map((tx) => {
        const base: TransactionWithStatus = {
          ...tx,
          source: "zhentan-only",
          status: getTransactionStatus(tx),
        };
        if (!tx.txHash) return base;
        const zerionMatch = zerionByHash.get(tx.txHash.toLowerCase());
        return zerionMatch ? mergeWithZerion(base, zerionMatch) : base;
      });

      // Zerion items that have NO matching Zhentan record → "zerion-only"
      const ourHashes = new Set(ourTxs.filter((t) => t.txHash).map((t) => t.txHash!.toLowerCase()));
      const zerionOnlyActivity: TransactionWithStatus[] = zerionItems
        .filter((z) => !ourHashes.has(z.hash.toLowerCase()))
        .map((z) => zerionOnlyToActivity(z, safeAddress));

      // Merge and sort newest-first
      const transactions = [...ourActivity, ...zerionOnlyActivity].sort(
        (a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime()
      );

      res.json({ transactions });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // GET /transactions/:id — fetch a single transaction
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tx = await getTransaction(id);
      if (!tx) {
        res.status(404).json({ error: `Transaction not found: ${id}` });
        return;
      }
      res.json({ transaction: { ...tx, status: getTransactionStatus(tx) } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // PATCH /transactions/:id — update inReview / rejected fields
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body ?? {};

      if (!action || !["review", "reject"].includes(action)) {
        res.status(400).json({ error: "action must be 'review' or 'reject'" });
        return;
      }

      const tx = await getTransaction(id);
      if (!tx) {
        res.status(404).json({ error: `Transaction not found: ${id}` });
        return;
      }

      if (action === "review") {
        await updateTransaction(id, {
          inReview: true,
          reviewReason: reason ?? "Flagged for manual review",
          reviewedAt: new Date().toISOString(),
        });
        res.json({ status: "marked_review", txId: id });
      } else {
        await updateTransaction(id, {
          rejected: true,
          rejectedAt: new Date().toISOString(),
          rejectReason: reason ?? "Rejected by owner",
          inReview: false,
        });
        res.json({ status: "rejected", txId: id, to: tx.to, amount: tx.amount });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  return router;
}
