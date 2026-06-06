import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./lib/db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const p = await db.query.projects.findMany({
    orderBy: [desc(schema.projects.createdAt)],
    limit: 5,
  });

  console.log(
    p.map((x) => ({
      id: x.projectId,
      title: x.title,
      status: x.status,
      aiStatus: x.analysisStatus,
      err: x.errorMsg,
    }))
  );
  process.exit(0);
}
run();
