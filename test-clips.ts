import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./lib/db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // Get the most recent "done" project that has a transcription
  const [project] = await db.query.projects.findMany({
    where: (p, { eq, and, isNotNull }) =>
      and(eq(p.analysisStatus, "done"), isNotNull(p.transcription)),
    orderBy: [desc(schema.projects.createdAt)],
    limit: 1,
  });

  if (!project) {
    console.error("❌ No project found with analysisStatus='done' and a transcription.");
    process.exit(1);
  }

  console.log(`✅ Using project: ${project.projectId} — "${project.title}"`);
  console.log(`   Transcript length: ${project.transcription!.length} chars`);
  console.log(`   SRT segments: ${project.captions?.split("\n\n").length ?? 0}`);
  console.log();

  // Step 1: Test Gemini API key
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY is NOT set in .env.local");
    process.exit(1);
  }
  console.log(`✅ Gemini API key found: ${apiKey.substring(0, 8)}...`);

  // Step 2: Test Gemini response
  console.log("⏳ Calling Gemini...");
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
You are a video editor. Given this transcript (first 500 chars), find 2 short clip moments (30-90 sec each).
Return a pure JSON array like: [{"startTime":5,"endTime":45,"reason":"engaging","seoRanking":80}]

Transcript:
${project.transcription!.substring(0, 500)}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const text = result.response.text();
    console.log("✅ Gemini response:", text.substring(0, 300));

    const clips = JSON.parse(text);
    console.log(`✅ Parsed ${clips.length} clips from Gemini`);
    console.log();

    // Step 3: Test DB insert
    console.log("⏳ Inserting clips into DB...");
    const toInsert = clips.slice(0, 2).map((c: { startTime: number; endTime: number; reason: string; seoRanking: number }) => ({
      projectId: project.projectId,
      startTime: Number(c.startTime) || 0,
      endTime: Number(c.endTime) || 0,
      reason: String(c.reason),
      seoRanking: Number(c.seoRanking) || 0,
      captions: "test-captions",
      status: "pending",
    }));

    await db.insert(schema.clips).values(toInsert);
    console.log(`✅ Successfully inserted ${toInsert.length} clips into 'clips' table!`);

    // Verify
    const inserted = await db.query.clips.findMany({
      where: (c, { eq }) => eq(c.projectId, project.projectId),
    });
    console.log(`✅ Verified: ${inserted.length} clips now in DB for this project`);
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  process.exit(0);
}

run();
