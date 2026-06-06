import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./lib/db/schema";
import { desc, eq } from "drizzle-orm";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const stuck = await db.update(schema.clips)
    .set({ renderStatus: "idle", renderProgress: 0 })
    .where(eq(schema.clips.renderStatus, "rendering"))
    .returning();

  console.log("Reset stuck clips:", stuck.length);
  process.exit(0);
}
run().catch(console.error);
