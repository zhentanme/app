"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img
        src="/icons/icon-192x192.png"
        alt="Zhentan"
        className="mb-6 h-20 w-20"
      />
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        You&apos;re offline
      </h1>
      <p className="mb-8 text-muted-foreground">
        Zhentan needs an internet connection to access onchain data. Check your
        connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
      >
        Retry
      </button>
    </div>
  );
}
