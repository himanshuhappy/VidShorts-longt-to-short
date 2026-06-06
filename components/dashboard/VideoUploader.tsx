"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Play,
  X,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStatus =
  | "idle"
  | "preparing"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

interface PollResponse {
  status: string;
  progress: number;
  statusLabel: string | null;
  errorMsg: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;

// Maps DB status → UI status
function toUiStatus(dbStatus: string): UploadStatus {
  switch (dbStatus) {
    case "pending":
      return "preparing";
    case "uploading":
      return "uploading";
    case "processing":
      return "processing";
    case "ready":
      return "ready";
    case "failed":
      return "failed";
    default:
      return "preparing";
  }
}

function statusColor(status: UploadStatus): string {
  switch (status) {
    case "ready":
      return "text-[oklch(0.65_0.22_195)]";
    case "failed":
      return "text-[oklch(0.65_0.22_25)]";
    default:
      return "text-white";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VideoUploader() {
  const router = useRouter();
  // File / YouTube state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Upload / progress state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks how many consecutive polls returned 'pending' — used for stuck detection
  const pendingCountRef = useRef(0);
  // Tracks the highest progress seen so far — progress never goes backwards
  const progressFloorRef = useRef(0);
  // Ref mirror of uploadStatus to avoid stale closures in the interval callback
  const statusRef = useRef<UploadStatus>("idle");

  // ── Polling ───────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pendingCountRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (pid: string) => {
      stopPolling();
      progressFloorRef.current = 5; // Start floor at 5 so we never go below

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/project/${pid}/status`);
          if (!res.ok) return;
          const data: PollResponse = await res.json();

          const uiStatus = toUiStatus(data.status);

          // ── Stuck detection ──────────────────────────────────────────────
          // If DB is still 'pending' after 40s (20 polls × 2s), something
          // is wrong — Inngest didn't receive the event. Surface a clear error.
          if (data.status === "pending") {
            pendingCountRef.current += 1;
            if (pendingCountRef.current >= 20) {
              stopPolling();
              setUploadStatus("failed");
              setErrorMsg(
                "Upload timed out — Inngest workflow did not start.\n" +
                "Make sure both servers are running:\n" +
                "1. npm run dev\n" +
                "2. npx inngest-cli@latest dev"
              );
            }
            // Don't regress — keep showing whatever the client set
            return;
          }
          pendingCountRef.current = 0;

          // ── Progress floor — never go backwards ───────────────────────
          const newProgress = Math.max(data.progress, progressFloorRef.current);
          progressFloorRef.current = newProgress;

          // ── Status — never regress from a more advanced state ─────────
          const ORDER: UploadStatus[] = [
            "idle", "preparing", "uploading", "processing", "ready", "failed",
          ];
          const currentIdx = ORDER.indexOf(statusRef.current);
          const newIdx = ORDER.indexOf(uiStatus);
          const shouldUpdateStatus = newIdx > currentIdx || uiStatus === "failed";

          if (shouldUpdateStatus) {
            statusRef.current = uiStatus;
            setUploadStatus(uiStatus);
          }
          setProgress(newProgress);
          setStatusLabel(data.statusLabel ?? "");

          if (uiStatus === "ready" || uiStatus === "failed") {
            stopPolling();
            if (uiStatus === "failed") setErrorMsg(data.errorMsg ?? "Upload failed.");
          }
        } catch {
          // Network hiccup — keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  // Clean up interval on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── File handlers ─────────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setYoutubeId(null);
    resetProgress();
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl) { alert("Please enter a YouTube URL"); return; }
    const match = youtubeUrl.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    if (!match?.[1]) { alert("Please enter a valid YouTube URL"); return; }

    const vid = match[1];
    const mockFile = new File([""], "YouTube_Video.mp4", { type: "video/mp4" });
    setFile(mockFile);
    setYoutubeId(vid);
    setPreviewUrl(null);
    resetProgress();
    setShowYoutubeInput(false);
  };

  const resetProgress = () => {
    setUploadStatus("idle");
    setProgress(0);
    setStatusLabel("");
    setProjectId(null);
    setErrorMsg(null);
    statusRef.current = "idle";
    progressFloorRef.current = 0;
    stopPolling();
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setYoutubeId(null);
    setYoutubeUrl("");
    resetProgress();
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;

    statusRef.current = "preparing";
    progressFloorRef.current = 2;
    setUploadStatus("preparing");
    setProgress(2);
    setStatusLabel("Creating project…");

    try {
      const formData = new FormData();
      formData.append("sourceType", youtubeId ? "youtube" : "local");

      if (youtubeId) {
        formData.append("youtubeId", youtubeId);
        formData.append("youtubeUrl", youtubeUrl);
        formData.append("title", "YouTube Video");
      } else {
        formData.append("file", file);
        formData.append("title", file.name);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.error ?? "Upload failed");
      }

      const { projectId: pid } = await res.json();
      setProjectId(pid);
      statusRef.current = "uploading";
      progressFloorRef.current = 5;
      setUploadStatus("uploading");
      setProgress(5);
      setStatusLabel("Starting upload…");
      startPolling(pid);
    } catch (err) {
      console.error("[VideoUploader] upload error:", err);
      statusRef.current = "failed";
      setUploadStatus("failed");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isActive = uploadStatus !== "idle";
  const isComplete = uploadStatus === "ready";
  const isFailed = uploadStatus === "failed";
  const isInProgress = isActive && !isComplete && !isFailed;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {!file ? (
        showYoutubeInput ? (
          /* ── YouTube URL input ─────────────────────────────────────────── */
          <div className="relative glass-card rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-white/15">
            <div className="relative inline-flex mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl gradient-brand flex items-center justify-center glow-primary">
                <Play className="size-10 sm:size-12 text-white" />
              </div>
              <div className="absolute inset-0 rounded-3xl gradient-brand blur-2xl opacity-40" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Paste YouTube URL
            </h2>
            <p className="text-sm sm:text-base text-[oklch(0.60_0.01_270)] mb-8 max-w-md mx-auto leading-relaxed">
              Paste a link to any YouTube video and we'll process it for you.
            </p>

            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleYoutubeSubmit()}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[oklch(0.65_0.25_280)] transition-colors placeholder:text-white/30"
                autoFocus
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => setShowYoutubeInput(false)}
                  className="flex-1 inline-flex items-center justify-center h-12 rounded-xl text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleYoutubeSubmit}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:scale-[1.02] transition-all duration-300"
                >
                  Process Video
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Drag & Drop zone ──────────────────────────────────────────── */
          <div
            className={`relative glass-card rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed transition-all duration-300 group ${
              dragActive
                ? "border-[oklch(0.65_0.25_280)] bg-[oklch(0.65_0.25_280/0.05)]"
                : "border-white/15 hover:border-[oklch(0.65_0.25_280/0.4)]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleChange}
              className="hidden"
              id="video-upload"
            />

            <div className="relative inline-flex mb-8">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl gradient-brand flex items-center justify-center glow-primary transition-transform duration-500 ${
                  dragActive ? "scale-110" : "group-hover:scale-105"
                }`}
              >
                <Upload className="size-10 sm:size-12 text-white" />
              </div>
              <div
                className={`absolute inset-0 rounded-3xl gradient-brand blur-2xl transition-all duration-500 ${
                  dragActive ? "opacity-60 scale-110" : "opacity-0 group-hover:opacity-40"
                }`}
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Upload Your Video
            </h2>
            <p className="text-sm sm:text-base text-[oklch(0.60_0.01_270)] mb-8 max-w-md mx-auto leading-relaxed">
              Drag and drop your long-form video here, or browse your files. We'll
              automatically generate viral shorts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                <Upload className="size-5" />
                Select Video
              </button>
              <span className="text-[oklch(0.40_0.01_270)] text-sm font-medium">or</span>
              <button
                onClick={() => setShowYoutubeInput(true)}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 w-full sm:w-auto"
              >
                <Play className="size-5" />
                Paste YouTube URL
              </button>
            </div>
          </div>
        )
      ) : (
        /* ── File preview + upload ─────────────────────────────────────────── */
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">

            {/* Preview */}
            <div className="w-full md:w-1/2 flex-shrink-0 relative group">
              <div className="aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/5 relative flex items-center justify-center">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1&rel=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-[oklch(0.40_0.01_270)]">Preview not available</div>
                )}
                {!youtubeId && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </div>

              {/* Remove button — only when not uploading */}
              {!isActive && (
                <button
                  onClick={clearFile}
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500/40 hover:text-red-300 transition-all duration-200 z-10"
                  title="Remove video"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Details + actions */}
            <div className="w-full flex-grow flex flex-col justify-center h-full min-h-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <FileVideo className="size-6 text-[oklch(0.65_0.25_280)] flex-shrink-0" />
                <h3
                  className="text-xl font-bold text-white truncate max-w-full"
                  title={file.name}
                >
                  {file.name}
                </h3>
              </div>
              <p className="text-sm text-[oklch(0.50_0.01_270)] mb-6">
                {youtubeId
                  ? "YouTube Video"
                  : `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type || "video"}`}
              </p>

              {/* ── Progress section ─────────────────────────────────────── */}
              {isActive ? (
                <div className="w-full space-y-5 mt-auto">
                  {/* Status row */}
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span
                      className={`flex items-center gap-2 ${statusColor(uploadStatus)}`}
                    >
                      {isInProgress && (
                        <Loader2 className="size-4 animate-spin opacity-70" />
                      )}
                      {isComplete && <CheckCircle2 className="size-4" />}
                      {isFailed && <AlertCircle className="size-4" />}
                      {statusLabel || "Please wait…"}
                    </span>
                    <span className="text-[oklch(0.55_0.01_270)] tabular-nums">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                        isFailed
                          ? "bg-[oklch(0.65_0.22_25)]"
                          : "gradient-brand"
                      }`}
                      style={{ width: `${progress}%` }}
                    >
                      {isInProgress && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                      )}
                    </div>
                  </div>

                  {/* Step labels */}
                  <div className="flex justify-between text-[11px] text-[oklch(0.40_0.01_270)]">
                    <span className={progress >= 5 ? "text-[oklch(0.65_0.25_280)]" : ""}>
                      Creating
                    </span>
                    <span className={progress >= 40 ? "text-[oklch(0.65_0.25_280)]" : ""}>
                      Uploading
                    </span>
                    <span className={progress >= 90 ? "text-[oklch(0.65_0.25_280)]" : ""}>
                      Processing
                    </span>
                    <span className={progress >= 100 ? "text-[oklch(0.65_0.22_195)]" : ""}>
                      Done
                    </span>
                  </div>

                  {/* Error message */}
                  {isFailed && errorMsg && (
                    <p className="text-xs text-[oklch(0.65_0.22_25)] bg-[oklch(0.65_0.22_25/0.08)] border border-[oklch(0.65_0.22_25/0.2)] rounded-lg px-3 py-2">
                      {errorMsg}
                    </p>
                  )}

                  {/* CTA buttons */}
                  {isComplete && projectId && (
                    <button
                      onClick={() => router.push(`/dashboard/project/${projectId}`)}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-[1.01] transition-all duration-200"
                    >
                      <Sparkles className="size-5" />
                      View Project & AI Analysis
                    </button>
                  )}

                  {isFailed && (
                    <button
                      onClick={clearFile}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              ) : (
                /* ── Upload CTA ────────────────────────────────────────── */
                <button
                  onClick={handleUpload}
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:scale-[1.02] transition-all duration-300"
                >
                  <Upload className="size-5" />
                  Upload Video to Process
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
