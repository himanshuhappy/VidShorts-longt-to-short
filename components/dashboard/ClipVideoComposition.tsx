import { Video, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";

// SRT parser helper
interface SrtSubtitle {
  startTime: number;
  endTime: number;
  text: string;
}

function parseSrt(srt: string): SrtSubtitle[] {
  if (!srt) return [];
  const blocks = srt.split("\n\n").filter((b) => b.trim().length > 0);
  const subtitles: SrtSubtitle[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    if (lines.length < 3) continue;

    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) continue;

    const h1 = parseInt(match[1]), m1 = parseInt(match[2]), s1 = parseInt(match[3]), ms1 = parseInt(match[4]);
    const startTime = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000;

    const h2 = parseInt(match[5]), m2 = parseInt(match[6]), s2 = parseInt(match[7]), ms2 = parseInt(match[8]);
    const endTime = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000;

    const text = lines.slice(timeLineIndex + 1).join(" ");
    subtitles.push({ startTime, endTime, text });
  }

  return subtitles;
}

export const ClipVideoComposition = ({
  src,
  startTimeSec,
  endTimeSec,
  captions,
  fontFamily = "system-ui, -apple-system, sans-serif",
  textColor = "#FFE600",
  highlightColor = "#FFE600",
  highlightTextColor = "#000000",
  captionStyle = "highlight",
}: {
  src: string;
  startTimeSec: number;
  endTimeSec: number;
  captions: string;
  fontFamily?: string;
  textColor?: string;
  highlightColor?: string;
  highlightTextColor?: string;
  captionStyle?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map system fonts or Heavy Impact to high quality Google Fonts (e.g. Anton)
  // so Chromium on Lambda displays premium typography instead of defaulting to generic serif/sans-serif.
  const resolvedFontFamily = useMemo(() => {
    if (fontFamily.toLowerCase().includes("impact") || fontFamily.toLowerCase().includes("anton")) {
      return `'Anton', 'Impact', 'Arial Black', sans-serif`;
    }
    return fontFamily;
  }, [fontFamily]);

  // The video element starts at startTimeSec. 
  // Inside the player composition, frame 0 corresponds to startTimeSec.
  // So the absolute time in the original video is:
  const absoluteTime = startTimeSec + frame / fps;

  const subtitles = useMemo(() => parseSrt(captions), [captions]);

  // Find active subtitle
  const activeSubtitle = subtitles.find(
    (s) => absoluteTime >= s.startTime && absoluteTime <= s.endTime
  );

  // Split words by space for the active subtitle
  const words = useMemo(() => {
    if (!activeSubtitle) return [];
    return activeSubtitle.text.split(/\s+/).filter(Boolean);
  }, [activeSubtitle]);

  // Calculate current speaking word index based on absoluteTime progress within the active subtitle
  const currentWordIndex = useMemo(() => {
    if (!activeSubtitle || words.length === 0) return 0;
    const duration = activeSubtitle.endTime - activeSubtitle.startTime;
    if (duration <= 0) return 0;
    const progress = (absoluteTime - activeSubtitle.startTime) / duration;
    const clampedProgress = Math.max(0, Math.min(0.999, progress));
    return Math.floor(clampedProgress * words.length);
  }, [activeSubtitle, words, absoluteTime]);

  // Determine sliding window of max 3 words centered around the active word
  const windowWords = useMemo(() => {
    if (words.length <= 3) {
      return words.map((word, index) => ({ word, originalIndex: index }));
    }
    let start = currentWordIndex - 1;
    if (start < 0) start = 0;
    if (start + 3 > words.length) start = words.length - 3;
    
    return words.slice(start, start + 3).map((word, index) => ({
      word,
      originalIndex: start + index,
    }));
  }, [words, currentWordIndex]);

  const startFrame = Math.round(startTimeSec * fps);

  return (
    <div style={{ flex: 1, backgroundColor: "black", position: "relative", width: "100%", height: "100%" }}>
      {/* Load popular Google Fonts over the network so Chromium renders custom fonts correctly */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Montserrat:wght@700;900&family=Outfit:wght@700;900&family=Anton&display=swap');
      `}</style>
      <Video
        src={src}
        trimBefore={startFrame}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // Center-crops the video to fill the 9:16 player
        }}
      />
      {/* Subtitles Overlay */}
      {activeSubtitle && windowWords.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "5%",
          right: "5%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          pointerEvents: "none",
        }}>
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "1.5rem",
            padding: "1rem 2.5rem",
            borderRadius: "1.8rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
            fontFamily: resolvedFontFamily,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            fontSize: "5.5rem",
            fontWeight: 900,
            textAlign: "center",
          }}>
            {windowWords.map((item) => {
              const isHighlighted = item.originalIndex === currentWordIndex;
              if (isHighlighted) {
                const isMinimal = captionStyle === "minimal";
                const isNeon = captionStyle === "neon";
                return (
                  <span
                    key={item.originalIndex}
                    style={{
                      color: highlightTextColor,
                      backgroundColor: isMinimal ? "transparent" : highlightColor,
                      padding: isMinimal ? "0" : "0.2rem 1.8rem",
                      borderRadius: isMinimal ? "0" : "1.2rem",
                      boxShadow: isMinimal
                        ? "none"
                        : isNeon
                        ? `0 0 15px ${highlightColor}, 0 0 30px ${highlightColor}`
                        : "0 6px 12px rgba(0,0,0,0.2)",
                      textShadow: isNeon ? `0 0 8px ${highlightTextColor}` : "none",
                      display: "inline-block",
                      transform: isMinimal ? "none" : "scale(1.05) rotate(-1deg)",
                      border: captionStyle === "block" ? "2px solid rgba(255, 255, 255, 0.3)" : "none",
                    }}
                  >
                    {item.word}
                  </span>
                );
              }
              return (
                <span
                  key={item.originalIndex}
                  style={{
                    color: textColor,
                    display: "inline-block",
                  }}
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
