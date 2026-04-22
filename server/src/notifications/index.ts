import type { UserDetailsRow } from "../lib/supabase/types.js";
import { telegramChannel } from "./channels/telegram.js";
import { emailChannel } from "./channels/email.js";
import { EVENTS, type EventName, type EventPayload } from "./events.js";
import type { EventDefinition } from "./types.js";

/**
 * Dispatch a notification event to all applicable channels for a user.
 * Channel failures are logged but never thrown — notifications are fire-and-forget.
 */
export async function notify<E extends EventName>(
  event: E,
  user: UserDetailsRow,
  payload: EventPayload<E>
): Promise<void> {
  const def = EVENTS[event] as EventDefinition<EventPayload<E>> | undefined;
  if (!def) {
    console.warn(`notify: unknown event "${event}"`);
    return;
  }

  const tasks: Promise<void>[] = [];

  if (def.telegram && telegramChannel.isConfigured() && user.telegram_id) {
    const msg = def.telegram(user, payload);
    if (msg) {
      tasks.push(
        telegramChannel.send(user, msg).catch((err) => {
          console.error(`notify[${event}] telegram failed:`, err);
        })
      );
    }
  }

  console.log(payload)
  if (def.email && emailChannel.isConfigured() && user.email) {
    const msg = def.email(user, payload);
    console.log(user)
    if (msg) {
      tasks.push(
        emailChannel.send(user, msg).catch((err) => {
          console.error(`notify[${event}] email failed:`, err);
        })
      );
    }
  }

  await Promise.all(tasks);
}

export type { EventName, EventPayload } from "./events.js";
