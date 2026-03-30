"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { TransactionWithStatus } from "@/types";
import { TransactionRow } from "./TransactionRow";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { Activity } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      type: "spring" as const,
      bounce: 0.18,
    },
  },
};

interface ActivityListProps {
  transactions: TransactionWithStatus[];
  loading: boolean;
  /** When true, render without Card wrapper (for use inside tabbed card) */
  embedded?: boolean;
}

export function ActivityList({ transactions, loading, embedded }: ActivityListProps) {
  const [selectedTx, setSelectedTx] = useState<TransactionWithStatus | null>(null);

  const content = (
    <>
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <Activity className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-semibold text-white tracking-wide">
          <span className="text-gold">›</span> Activity
        </h2>
      </motion.div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-2xl"
            >
              <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center text-center py-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <motion.div
            className="mb-3 w-10 h-10 rounded-2xl bg-white/[0.08] flex items-center justify-center text-gold"
            animate={{
              y: [0, -4, 0],
              boxShadow: [
                "0 0 0 rgba(229,168,50,0)",
                "0 0 18px rgba(229,168,50,0.2)",
                "0 0 0 rgba(229,168,50,0)",
              ],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Activity className="h-5 w-5" />
          </motion.div>
          <p className="text-sm font-medium text-slate-300">No activity yet</p>
          <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">
            Transfers will appear here
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {transactions.map((tx, i) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              index={i}
              onClick={() => setSelectedTx(tx)}
            />
          ))}
        </motion.div>
      )}

      <TransactionDetailDialog
        tx={selectedTx}
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
  return embedded ? <div className="p-4 sm:p-6">{content}</div> : <Card>{content}</Card>;
}
