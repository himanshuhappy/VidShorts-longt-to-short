import { Inngest } from "inngest";

/**
 * Shared Inngest client.
 *
 * Local dev:  INNGEST_EVENT_KEY=local + INNGEST_DEV=1  (set in .env.local)
 * Production: INNGEST_EVENT_KEY=evt_xxx + INNGEST_SIGNING_KEY=signkey-prod-xxx
 *             (set in Vercel environment variables — do NOT set INNGEST_DEV)
 */
export const inngest = new Inngest({
  id: "vidshorts",
  eventKey: process.env.INNGEST_EVENT_KEY ?? "local",
  isDev: process.env.INNGEST_DEV === "1",
});
