import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const stuck = await db.query.projects.findMany({
    where: eq(schema.projects.analysisStatus, "transcribing")
  });

  console.log("Stuck projects:", stuck.length);
  for (const p of stuck) {
    console.log("Setting failed for", p.projectId, "URL:", p.sourceUrl || p.s3Url);
    await db.update(schema.projects).set({ analysisStatus: "failed", errorMsg: "Manually failed to reveal error. Try again to see Deepgram error." }).where(eq(schema.projects.projectId, p.projectId));
  }
}

run().catch(console.error);
