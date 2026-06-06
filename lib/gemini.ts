import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedClip {
  startTime: number;
  endTime: number;
  reason: string;
  seoRanking: number;
}

/**
 * Sends the video transcript to Gemini to find the most engaging short clip segments.
 */
export async function generateShortClips(
  transcript: string,
  clipsCount = config.CLIPS_TO_GENERATE
): Promise<GeneratedClip[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
You are an expert video editor and social media manager. I am going to give you a full video transcript with word-level or segment-level timestamps.
I need you to find the ${clipsCount} most engaging, viral moments in the video that can be turned into short-form content (TikTok, YouTube Shorts, Instagram Reels).

Requirements for each clip:
1. Length: At least 10 seconds (typically between 10 and 90 seconds).
2. Content: Must be engaging, have a good hook, and make sense as a standalone video.
3. Timestamps: Provide the exact start time and end time in seconds.

Return the response as a pure JSON array of objects with the following keys exactly:
- "startTime" (number, in seconds)
- "endTime" (number, in seconds)
- "reason" (string, explaining why this makes a great viral short)
- "seoRanking" (number, a score out of 100 on how likely this is to go viral based on SEO/engagement factors)

Do not include markdown blocks like \`\`\`json. Just return the raw JSON array.

Transcript:
${transcript}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const clips: GeneratedClip[] = JSON.parse(responseText);

    // Validate the structure
    return clips.map((clip) => ({
      startTime: Math.round(Number(clip.startTime) || 0),
      endTime: Math.round(Number(clip.endTime) || 0),
      reason: String(clip.reason) || "",
      seoRanking: Number(clip.seoRanking) || 0,
    })).slice(0, clipsCount);

  } catch (err: any) {
    console.error("[Gemini] Error generating clips:", err);
    throw new Error(`Failed to generate clips from transcript using Gemini: ${err.message || String(err)}`);
  }
}

/**
 * Extracts a subset of an SRT string that falls within the specified time range.
 */
export function getCaptionsForTimeRange(srt: string, startTimeSec: number, endTimeSec: number): string {
  const blocks = srt.split("\n\n").filter(b => b.trim().length > 0);
  const resultBlocks: string[] = [];

  let newIndex = 1;

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    // Line 1 is the timestamp line: "00:00:00,000 --> 00:00:04,500"
    const timeLine = lines[1];
    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) continue;

    const h1 = parseInt(match[1]), m1 = parseInt(match[2]), s1 = parseInt(match[3]), ms1 = parseInt(match[4]);
    const blockStartSec = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000;

    const h2 = parseInt(match[5]), m2 = parseInt(match[6]), s2 = parseInt(match[7]), ms2 = parseInt(match[8]);
    const blockEndSec = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000;

    // If block overlaps or is fully inside the time range, include it
    // Using a bit of padding (1 sec) to be safe with cuts
    if (blockEndSec >= startTimeSec - 1 && blockStartSec <= endTimeSec + 1) {
      resultBlocks.push(`${newIndex}\n${timeLine}\n${lines.slice(2).join("\n")}`);
      newIndex++;
    }
  }

  return resultBlocks.join("\n\n");
}
