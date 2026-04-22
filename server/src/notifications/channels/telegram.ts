import type { UserDetailsRow } from "../../lib/supabase/types.js";
import type { Channel, TelegramMessage } from "../types.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export const telegramChannel: Channel<TelegramMessage> = {
  id: "telegram",

  isConfigured() {
    return Boolean(TELEGRAM_BOT_TOKEN);
  },

  async send(user: UserDetailsRow, message: TelegramMessage): Promise<void> {
    if (!user.telegram_id) return;

    const res = await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.telegram_id,
        text: message.text,
        parse_mode: message.parseMode ?? "Markdown",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram send failed: ${res.status} ${body}`);
    }
  },
};
