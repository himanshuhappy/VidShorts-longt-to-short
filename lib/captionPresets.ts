export interface CaptionPreset {
  id: string;
  name: string;
  captionStyle: string;
  textColor: string;
  highlightColor: string;
  highlightTextColor: string;
}

export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: "tiktok",
    name: "TikTok Highlight",
    captionStyle: "highlight",
    textColor: "#FFE600", // Yellow text
    highlightColor: "#FFE600", // Yellow active background
    highlightTextColor: "#000000", // Black active text
  },
  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    captionStyle: "neon",
    textColor: "#00FFFF", // Cyan text
    highlightColor: "#FF007F", // Hot Pink active background
    highlightTextColor: "#FFFFFF", // White active text
  },
  {
    id: "classic",
    name: "Classic Block",
    captionStyle: "block",
    textColor: "#FFFFFF", // White text
    highlightColor: "rgba(255, 255, 255, 0.15)", // Transparent active border/glow
    highlightTextColor: "#FFE600", // Yellow active text
  },
  {
    id: "minimalist",
    name: "Minimalist Clean",
    captionStyle: "minimal",
    textColor: "#FFFFFF", // White text
    highlightColor: "transparent", // No background
    highlightTextColor: "#FFE600", // Yellow active text
  },
];

export interface FontOption {
  id: string;
  name: string;
  value: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "sans",
    name: "Sans-Serif",
    value: "system-ui, -apple-system, sans-serif",
  },
  {
    id: "serif",
    name: "Georgia Serif",
    value: "Georgia, serif",
  },
  {
    id: "mono",
    name: "Monospace",
    value: "SFMono-Regular, Consolas, monospace",
  },
  {
    id: "heavy",
    name: "Heavy Impact",
    value: "'Impact', 'Arial Black', sans-serif",
  },
];
