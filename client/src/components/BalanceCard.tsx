"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Skeleton } from "./ui/Skeleton";
import { truncateAddress } from "@/lib/format";
import { ArrowUpRight, ArrowDownLeft, Copy, Check, RefreshCw, Plug } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      type: "spring" as const,
      bounce: 0.18,
    },
  },
};

interface BalanceCardProps {
  /** Total portfolio value in USD (from Zerion) */
  portfolioTotalUsd: number | null;
  /** 24h portfolio % change (from Zerion), null if unavailable */
  portfolioPercentChange24h?: number | null;
  safeAddress: string;
  loading: boolean;
  /** Display name for greeting (e.g. "gm, {name}") */
  name?: string | null;
  onRefresh?: () => void;
  onToggleSend: () => void;
  onToggleReceive: () => void;
  onToggleConnect?: () => void;
  sendOpen: boolean;
  receiveOpen: boolean;
  connectOpen?: boolean;
}

export function BalanceCard({
  portfolioTotalUsd,
  portfolioPercentChange24h,
  safeAddress,
  loading,
  name,
  onRefresh,
  onToggleSend,
  onToggleReceive,
  onToggleConnect,
  sendOpen,
  receiveOpen,
  connectOpen,
}: BalanceCardProps) {
  const [copied, setCopied] = useState(false);
  const displayTotal = portfolioTotalUsd != null ? portfolioTotalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(safeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardNumberStyle = safeAddress.startsWith("0x")
    ? `${safeAddress.slice(0, 6)} ${safeAddress.slice(6, 10)} ${safeAddress.slice(10, 14)} ···· ···· ${safeAddress.slice(-4)}`
    : truncateAddress(safeAddress);

  const greeting = `gm, ${name?.trim() || "there"}`;

  return (
    <motion.div
      className="balance-card p-6 text-left relative"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {/* Top row: chip + greeting */}
      <div className="flex items-center justify-between mb-8">
        <div className="balance-card-chip flex items-center justify-center overflow-hidden rounded-lg p-1 aspect-square w-10 h-10" aria-hidden>
          <Image
            src="/bsc-yellow.png"
            alt=""
            width={28}
            height={28}
            className="object-contain opacity-95 drop-shadow-sm w-10 h-10"
            unoptimized
          />
        </div>
        <span className="text-base font-medium italic tracking-wide text-gold/90 truncate max-w-[160px] sm:max-w-[220px]">
          {greeting}
        </span>
      </div>

      {/* Balance + refresh */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-400 tracking-wide">
          Available balance
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh balance and activity"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-12 w-36 rounded-xl" />
      ) : (
        <motion.div
          className="text-4xl sm:text-5xl font-bold gradient-text tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          ${displayTotal ?? "—"}
        </motion.div>
      )}
      {portfolioPercentChange24h != null && !loading && (
        <div className="flex items-baseline gap-2 mt-1.5">
          <span
            className={`text-sm font-medium tabular-nums ${
              portfolioPercentChange24h > 0
                ? "text-emerald-400"
                : portfolioPercentChange24h < 0
                  ? "text-red-400"
                  : "text-slate-500"
            }`}
          >
            {portfolioPercentChange24h > 0 ? "+" : ""}
            {portfolioPercentChange24h.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-500">24h</span>
        </div>
      )}

      {/* Card number style address */}
      <button
        onClick={copyAddress}
        className="flex items-center gap-2 mt-6 text-slate-400 hover:text-white transition-colors font-mono text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] min-h-[2.75rem] touch-manipulation break-all text-left"
      >
        <span className="text-slate-500 break-all">{cardNumberStyle}</span>
        {copied ? (
          <Check className="h-4 w-4 text-gold flex-shrink-0" />
        ) : (
          <Copy className="h-4 w-4 flex-shrink-0 opacity-70" />
        )}
      </button>

      {/* Actions: card-style buttons */}
      <motion.div
        className="flex gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/[0.06]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <button
          type="button"
          onClick={onToggleSend}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 sm:py-3.5 text-sm font-semibold transition-all min-h-[2.75rem] touch-manipulation ${
            sendOpen
              ? "bg-gold text-white shadow-[0_4px_20px_-2px_rgba(229,168,50,0.4)]"
              : "bg-white/[0.08] text-slate-200 hover:bg-white/[0.12]"
          }`}
        >
          <ArrowUpRight className="h-5 w-5" />
          Send
        </button>
        <button
          type="button"
          onClick={onToggleReceive}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 sm:py-3.5 text-sm font-semibold transition-all min-h-[2.75rem] touch-manipulation ${
            receiveOpen
              ? "bg-gold text-white shadow-[0_4px_20px_-2px_rgba(229,168,50,0.4)]"
              : "bg-white/[0.08] text-slate-200 hover:bg-white/[0.12]"
          }`}
        >
          <ArrowDownLeft className="h-5 w-5" />
          Receive
        </button>
        {onToggleConnect && (
          <button
            type="button"
            onClick={onToggleConnect}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 sm:py-3.5 text-sm font-semibold transition-all min-h-[2.75rem] touch-manipulation ${
              connectOpen
                ? "bg-gold text-white shadow-[0_4px_20px_-2px_rgba(229,168,50,0.4)]"
                : "bg-white/[0.08] text-slate-200 hover:bg-white/[0.12]"
            }`}
          >
            <Plug className="h-5 w-5" />
            Connect
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
