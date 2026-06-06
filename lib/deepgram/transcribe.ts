import { DeepgramClient } from "@deepgram/sdk";

// ─── Client singleton ─────────────────────────────────────────────────────────

let _client: DeepgramClient | null = null;

function getDeepgramClient() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey === "your_deepgram_api_key") {
    throw new Error(
      "Missing DEEPGRAM_API_KEY. Get one free at https://console.deepgram.com"
    );
  }
  if (!_client) {
    _client = new DeepgramClient({ apiKey });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface TranscriptionResult {
  /** Full transcript text */
  transcript: string;
  /** Word-level timestamps from Deepgram */
  words: TranscriptionWord[];
  /** Video duration in seconds */
  duration: number;
  /** SRT-format captions string */
  srt: string;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Transcribes a video from its public URL using Deepgram Nova-2.
 * Returns full transcript text, word timestamps, duration, and SRT captions.
 */
export async function transcribeVideo(videoUrl: string): Promise<TranscriptionResult> {
  const deepgram = getDeepgramClient();

  console.log(`[Deepgram] Starting transcription for: ${videoUrl}`);

  // In SDK v5.3.0: client.listen.v1.media.transcribeUrl
  const result = await deepgram.listen.v1.media.transcribeUrl({
    url: videoUrl,
    model: "nova-2",
    smart_format: true,
    punctuate: true,
    paragraphs: true,
    utterances: false,
    diarize: false,
    language: "en",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (result as any)?.results?.channels?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alternative = channel?.alternatives?.[0] as any;

  if (!alternative) {
    throw new Error("Deepgram returned no transcription results");
  }

  const transcript: string = alternative.transcript ?? "";
  const words: TranscriptionWord[] = (alternative.words ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (w: any): TranscriptionWord => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
      punctuated_word: w.punctuated_word,
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const duration: number = (result as any)?.metadata?.duration ?? 0;

  console.log(
    `[Deepgram] Done — ${words.length} words, ${duration.toFixed(1)}s duration`
  );

  const srt = wordsToSrt(words);

  return { transcript, words, duration, srt };
}

// ─── SRT Generator ────────────────────────────────────────────────────────────

/**
 * Converts Deepgram word-level timestamps into SRT-format captions.
 * Groups words into ~7-word / ~4-second subtitle segments.
 */
function wordsToSrt(words: TranscriptionWord[]): string {
  if (words.length === 0) return "";

  const MAX_WORDS_PER_SEGMENT = 7;
  const MAX_SEGMENT_DURATION = 4; // seconds

  const segments: { start: number; end: number; text: string }[] = [];
  let segWords: TranscriptionWord[] = [];

  for (let i = 0; i < words.length; i++) {
    segWords.push(words[i]);

    const segDuration = words[i].end - segWords[0].start;
    const isLast = i === words.length - 1;

    if (
      segWords.length >= MAX_WORDS_PER_SEGMENT ||
      segDuration >= MAX_SEGMENT_DURATION ||
      isLast
    ) {
      segments.push({
        start: segWords[0].start,
        end: segWords[segWords.length - 1].end,
        text: segWords.map((w) => w.punctuated_word ?? w.word).join(" "),
      });
      segWords = [];
    }
  }

  return segments
    .map((seg, idx) => {
      const startTs = toSrtTimestamp(seg.start);
      const endTs = toSrtTimestamp(seg.end);
      return `${idx + 1}\n${startTs} --> ${endTs}\n${seg.text}`;
    })
    .join("\n\n");
}

function toSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, "0");
}

