import { Router, type Request, type Response, type IRouter } from "express";
import { getUserDetails, upsertUserDetails } from "../lib/supabase/index.js";

export function createUsersRouter(): IRouter {
  const router = Router();

  // GET /users?safe=0x...
  router.get("/", async (req: Request, res: Response) => {
    const safe = req.query.safe as string | undefined;
    if (!safe) {
      res.status(400).json({ error: "Missing required query param: safe" });
      return;
    }
    try {
      const details = await getUserDetails(safe);
      res.json({ user: details });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // POST /users — upsert on login
  router.post("/", async (req: Request, res: Response) => {
    const { safeAddress, email, name, telegramId, signerAddress, username, onboardingCompleted } = req.body ?? {};
    if (!safeAddress) {
      res.status(400).json({ error: "Missing required field: safeAddress" });
      return;
    }
    try {
      await upsertUserDetails(safeAddress, {
        ...(email !== undefined && { email }),
        ...(name !== undefined && { name }),
        ...(telegramId !== undefined && { telegram_id: telegramId }),
        ...(signerAddress !== undefined && { signer_address: signerAddress }),
        ...(username !== undefined && { username: username.toLowerCase() }),
        ...(onboardingCompleted !== undefined && { onboarding_completed: onboardingCompleted }),
      });
      const details = await getUserDetails(safeAddress);
      res.json({ user: details });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
