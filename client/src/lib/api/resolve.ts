import type { ApiFetchFn } from "./client";

export interface ResolveResult {
  address: string;
  name?: string;
  source: "address" | "ens" | "bnb" | "zhentan";
}

export function resolveApi(req: ApiFetchFn) {
  return {
    async resolve(name: string): Promise<ResolveResult> {
      const res = await req(`/resolve?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? "")
            : "";
        throw new Error(
          message || "Invalid name (Supported: .eth, .bnb or Zhentan names)"
        );
      }
      return res.json();
    },
  };
}
