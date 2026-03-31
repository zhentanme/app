import type { ApiFetchFn } from "./client";

export interface UpsertUserBody {
  safeAddress: string;
  email?: string;
  name?: string;
  telegramId?: string;
  signerAddress?: string;
  username?: string;
}

export interface UserDetails {
  safe_address: string;
  email: string | null;
  telegram_id: string | null;
  name: string | null;
  username: string | null;
  signer_address: string | null;
  created_at: string;
  updated_at: string;
}

export function usersApi(req: ApiFetchFn) {
  return {
    async get(safeAddress: string): Promise<UserDetails | null> {
      const res = await req(`/users?safe=${safeAddress}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    },

    async upsert(body: UpsertUserBody): Promise<void> {
      await req("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  };
}
