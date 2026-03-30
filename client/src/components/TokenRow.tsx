"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TokenPosition } from "@/types";
import { truncateAddress, formatTokenAmount } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

interface TokenRowProps {
  token: TokenPosition;
  index?: number;
  /** When true, show as selected (e.g. in token picker). */
  selected?: boolean;
  /** When set, row is clickable (e.g. in token picker dialog). */
  onClick?: () => void;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TokenRow({ token, index = 0, selected, onClick }: TokenRowProps) {
  const usdStr = token.usdValue != null ? formatUsd(token.usdValue) : null;
  const priceStr =
    token.price > 0
      ? token.price >= 1
        ? token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        : token.price.toFixed(6)
      : null;
  const balanceStr = formatTokenAmount(token.balance);

  const row = (
    <motion.div
      className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-2xl transition-all min-h-[3.5rem] ${
        onClick ? "cursor-pointer hover:bg-white/[0.06]" : "hover:bg-white/[0.06]"
      } ${selected ? "ring-2 ring-gold/50 bg-white/[0.06]" : ""}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        bounce: 0.15,
      }}
    >
      <div className="w-10 h-10 rounded-2xl bg-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {token.iconUrl ? (
          <Image
            src={token.iconUrl}
            alt=""
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <span className="text-xs font-bold text-gold">
            {token.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-200 truncate inline-flex items-center gap-1.5">
            {token.name}
            {token.verified && (
              <CheckCircle2 className="h-3.5 w-3.5 text-gold flex-shrink-0" aria-label="Verified" />
            )}
          </span>
          <span className="text-slate-600 shrink-0">·</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {priceStr != null && (
            <>
              <span className="text-xs text-slate-500 shrink-0">
                ${priceStr}
              </span>
              <span className="hidden sm:inline text-slate-600 shrink-0">·</span>
            </>
          )}
          {token.address && (
            <span className="hidden md:flex items-center gap-1 text-xs text-slate-600 font-mono truncate max-w-[120px]">
              {truncateAddress(token.address)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right flex items-center gap-2 justify-end">
        <div>
          {usdStr != null ? (
            <>
              <span className="text-sm font-semibold text-white tabular-nums block">$ {usdStr}</span>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {balanceStr} {token.symbol}
              </p>
            </>
          ) : (
            <span className="text-sm font-semibold text-white tabular-nums">
              {balanceStr} {token.symbol}
            </span>
          )}
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" aria-label="Selected" />
        )}
      </div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {row}
      </button>
    );
  }
  return row;
}
