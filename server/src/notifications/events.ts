import type { EventDefinition } from "./types.js";

/**
 * Registry of notification events. To add a new event:
 *   1. Add a new entry keyed by a stable event name.
 *   2. Define telegram/email message builders for the channels that apply.
 *   3. Trigger it with `notify("event_name", user, payload)`.
 */

export interface OnboardingCompletedPayload {
  /** Optional display name used in message/template greetings. */
  displayName?: string;
}

const ONBOARDING_TEMPLATE_ID = process.env.RESEND_ONBOARDING_TEMPLATE_ID;

export const EVENTS = {
  onboarding_completed: {
    name: "onboarding_completed",

    telegram: (user, payload) => {
      const name = payload.displayName || user.name || user.username || "there";
      return {
        text:
          `👋 Welcome to *Zhentan*, ${name}!\n\n` +
          `Your AI-secured wallet is ready. I'll review every transaction and ping you here when something needs a second look.`,
      };
    },

    email: (user, payload) => {
      if (!ONBOARDING_TEMPLATE_ID) return null;
      const name = payload.displayName || user.name || user.username || "there";
      return {
        subject: "Welcome to Zhentan",
        templateId: ONBOARDING_TEMPLATE_ID,
        variables: {
          NAME: name,
          USER_NAME: user.username ?? "",
          SAFE_ADDRESS: user.safe_address,
        },
      };
    },
  } satisfies EventDefinition<OnboardingCompletedPayload>,
} as const;

export type EventName = keyof typeof EVENTS;
export type EventPayload<E extends EventName> =
  (typeof EVENTS)[E] extends EventDefinition<infer P> ? P : never;
