import { Router, Request, Response, type IRouter } from "express";
import { createPublicClient, http, isAddress, zeroAddress, type Address } from "viem";
import { mainnet, bsc } from "viem/chains";
import { normalize, namehash } from "viem/ens";

// ── RPC fallback lists ────────────────────────────────────────────────────────
// Primary comes from env; public endpoints serve as fallbacks.
const ETH_RPCS = [
  process.env.ETH_RPC_URL,
  "https://eth.llamarpc.com",
  "https://1rpc.io/eth",
  "https://rpc.ankr.com/eth",
  "https://cloudflare-eth.com",
].filter(Boolean) as string[];

const BSC_RPCS = [
  process.env.BSC_RPC_URL,
  "https://1rpc.io/bnb",
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://rpc.ankr.com/bsc",
].filter(Boolean) as string[];


// ── SPACE ID registry on BSC ──────────────────────────────────────────────────
// SPACE ID uses the traditional ENS two-step pattern (no Universal Resolver),
// so we resolve manually: registry.resolver(node) → resolver.addr(node)
// Registry address: https://bscscan.com/address/0x08CEd32a7f3eeC915Ba84415e9C07a7286977956
const SPACE_ID_REGISTRY = "0x08CEd32a7f3eeC915Ba84415e9C07a7286977956" as Address;

const REGISTRY_ABI = [
  {
    name: "resolver",
    type: "function" as const,
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view" as const,
  },
];

const RESOLVER_ABI = [
  {
    name: "addr",
    type: "function" as const,
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view" as const,
  },
];


// ── Resolvers ────────────────────────────────────────────────────────────────

async function resolveViaSpaceIdApi(name: string): Promise<Address | null> {
  const res = await fetch(`https://nameapi.space.id/getAddress?domain=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Space ID API HTTP ${res.status}`);
  const data = await res.json() as { code: number; msg: string; address?: string };
  if (data.code === 0 && data.address && data.address !== zeroAddress) {
    return data.address as Address;
  }
  if (data.code === 1) return null; // not found
  throw new Error(`Space ID API error: ${data.msg}`);
}

async function resolveEns(name: string): Promise<Address | null> {
  let lastErr: unknown;
  for (const rpc of ETH_RPCS) {
    try {
      const client = createPublicClient({ chain: mainnet, transport: http(rpc) });
      return await client.getEnsAddress({ name: normalize(name) });
    } catch (err) {
      lastErr = err;
    }
  }

  // Fallback: Space ID HTTP API
  try {
    return await resolveViaSpaceIdApi(name);
  } catch (apiErr) {
    throw new Error(
      `All ETH RPCs failed for ${name}: ${lastErr instanceof Error ? lastErr.message : lastErr}; ` +
      `Space ID API also failed: ${apiErr instanceof Error ? apiErr.message : apiErr}`
    );
  }
}

async function resolveBnb(name: string): Promise<Address | null> {
  const node = namehash(normalize(name));
  let lastErr: unknown;
  for (const rpc of BSC_RPCS) {
    try {
      const client = createPublicClient({ chain: bsc, transport: http(rpc) });

      const resolverAddr = await client.readContract({
        address: SPACE_ID_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: "resolver",
        args: [node],
      }) as Address;

      if (!resolverAddr || resolverAddr === zeroAddress) return null;

      const address = await client.readContract({
        address: resolverAddr,
        abi: RESOLVER_ABI,
        functionName: "addr",
        args: [node],
      }) as Address;

      return address || null;
    } catch (err) {
      lastErr = err;
    }
  }

  // Fallback: Space ID HTTP API
  try {
    return await resolveViaSpaceIdApi(name);
  } catch (apiErr) {
    throw new Error(
      `All BSC RPCs failed for ${name}: ${lastErr instanceof Error ? lastErr.message : lastErr}; ` +
      `Space ID API also failed: ${apiErr instanceof Error ? apiErr.message : apiErr}`
    );
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

export function createResolveRouter(): IRouter {
  const router = Router();

  // GET /resolve?name=vitalik.eth | vitalik.bnb | 0x...
  router.get("/", async (req: Request, res: Response) => {
    try {
      const name = (req.query.name as string | undefined)?.trim().toLowerCase();
      if (!name) {
        res.status(400).json({ error: "Missing query param: name" });
        return;
      }

      // Pass through plain addresses unchanged
      if (name.startsWith("0x") && name.length === 42 && isAddress(name)) {
        res.json({ address: name });
        return;
      }

      let address: Address | null = null;

      if (name.endsWith(".eth")) {
        address = await resolveEns(name);
      } else if (name.endsWith(".bnb")) {
        address = await resolveBnb(name);
      } else {
        res.status(400).json({
          error: "Unsupported name format. Supported: 0x address, .eth (ENS), .bnb (SPACE ID)",
        });
        return;
      }

      if (!address || address === zeroAddress) {
        res.status(404).json({ error: `Name not found: ${name}` });
        return;
      }

      res.json({ address, name });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Resolve failed";
      res.status(500).json({ error: message });
    }
  });

  return router;
}
