"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TransactionWithStatus } from "@/types";
import { truncateAddress, formatDate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { UsdcIcon } from "./icons/UsdcIcon";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface TransactionRowProps {
  tx: TransactionWithStatus;
  index?: number;
  onClick?: () => void;
}

function TokenIcon({
  symbol,
  iconUrl,
  size = 16,
}: {
  symbol: string;
  iconUrl?: string | null;
  size?: number;
}) {
  if (iconUrl) {
    return (
      <span className="relative flex-shrink-0 rounded-full overflow-hidden bg-white/10" style={{ width: size, height: size }}>
        <Image src={iconUrl} alt="" width={size} height={size} className="object-cover" unoptimized />
      </span>
    );
  }
  return (
    <span
      className="flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gold"
      style={{ width: size, height: size }}
    >
      {(symbol || "??").slice(0, 2)}
    </span>
  );
}

export function TransactionRow({ tx, index = 0, onClick }: TransactionRowProps) {
  const isReceive = tx.direction === "receive";
  const DirectionIcon = isReceive ? ArrowDownLeft : ArrowUpRight;

  const isUsdc = tx.token?.toUpperCase() === "USDC";
  const showUsdcIcon = isUsdc && !tx.tokenIconUrl;

  return (
    <motion.div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-white/[0.06] rounded-2xl transition-all min-h-[3.5rem] touch-manipulation ${onClick ? "cursor-pointer" : ""}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        bounce: 0.15,
      }}
    >
      <div className="w-10 h-10 rounded-2xl bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-gold">
        <DirectionIcon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {tx.dappMetadata ? (
            <span className="text-sm font-medium text-slate-200 truncate inline-flex items-center gap-1.5">
              {tx.dappMetadata.icons?.[0] ? (
                <img
                  src={tx.dappMetadata.icons[0]}
                  alt=""
                  className="w-4 h-4 rounded flex-shrink-0 bg-white/10 object-cover"
                />
              ) : (
                <span className="w-4 h-4 rounded bg-white/10 flex-shrink-0 flex items-center justify-center">
                  <ArrowUpRight className="h-2.5 w-2.5 text-slate-400" />
                </span>
              )}
              <span className="truncate">
                {tx.dappMetadata.name.length > 20
                  ? `${tx.dappMetadata.name.slice(0, 20)}…`
                  : tx.dappMetadata.name}
              </span>
            </span>
          ) : (
            <span className="text-sm font-medium text-slate-200 truncate inline-flex items-center gap-1.5">
              {showUsdcIcon ? (
                <UsdcIcon size={16} className="flex-shrink-0 opacity-90" />
              ) : (
                <TokenIcon symbol={tx.token} iconUrl={tx.tokenIconUrl} size={16} />
              )}
              {tx.amount} {tx.token}
            </span>
          )}
          {!tx.dappMetadata && (
            <>
              <span className="text-slate-600 shrink-0">{isReceive ? "←" : "→"}</span>
              <span className="text-sm text-slate-400 font-mono truncate min-w-0">
                {truncateAddress(tx.to)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {tx.dappMetadata && (
            <span className="text-xs text-slate-500">
              {tx.amount} {tx.token}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {formatDate(tx.proposedAt)}
          </span>
          {tx.txHash && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono shrink-0">
              <span className="relative w-3.5 h-3.5 flex-shrink-0">
                <Image src="/bscscan.png" alt="" fill className="object-contain rounded" sizes="14px" />
              </span>
              {truncateAddress(tx.txHash)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={tx.status} />
      </div>
    </motion.div>
  );
}
