import { Inngest } from "inngest";

/**
 * Shared Inngest client.
 *
 * Local dev:  INNGEST_EVENT_KEY=local  (set in .env.local)
 * Production: INNGEST_EVENT_KEY=<your key from https://app.inngest.com>
 *
 * The `eventKey` fallback to "local" ensures the dev server works even if
 * the env var is momentarily missing during hot reloads.
 */
export const inngest = new Inngest({
  id: "vidshorts",
  eventKey: process.env.INNGEST_EVENT_KEY ?? "local",
});
