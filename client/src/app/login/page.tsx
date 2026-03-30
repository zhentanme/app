"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { PrivyLoginButton } from "@/components/PrivyLoginButton";
import { ThemeLoader } from "@/components/ThemeLoader";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const { user, wallet, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && wallet) {
      router.replace("/app");
    }
  }, [loading, user, wallet, router]);

  // Don't render login UI if already authenticated (will redirect)
  if (loading || (user && wallet)) {
    return (
      <ThemeLoader
        variant="auth"
        message={user && wallet ? "Taking you home..." : "Loading Zhentan"}
        subtext="Securing your session"
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen hero-gradient px-4 py-8 sm:py-12 safe-area-bottom">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
        className="w-full max-w-md min-w-0"
      >
        <Card className="overflow-hidden text-center p-0">
          {/* Logo + copy */}
          <div className="relative p-6 flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.35 }}
              className="relative w-full flex justify-center"
            >
              <div className="relative w-[260px] h-[104px] sm:w-[320px] sm:h-[128px]">
                <Image
                  src="/cover.png"
                  alt="Zhentan"
                  fill
                  className="object-contain object-center drop-shadow-[0_0_20px_rgba(229,168,50,0.2)]"
                  priority
                  sizes="(max-width: 640px) 260px, 320px"
                />
              </div>
            </motion.div>
            <div className="relative mt-6 w-full max-w-[280px] space-y-2 text-center">
              <p className="text-slate-400/90 text-xs sm:text-sm uppercase tracking-[0.28em] font-medium">
              Your onchain behavior, guarded
              </p>
              <p className="text-slate-500 text-sm">
                - Sign in to get started -
              </p>
            </div>
          </div>

          {/* Login CTA */}
          <div className="pb-6">
            <PrivyLoginButton />
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6 uppercase tracking-[0.2em]">
        Built for individuals, DAOs, and treasuries to move value with confidence.
        </p>
      </motion.div>
    </div>
  );
}
