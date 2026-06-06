"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2, Loader2, AlertCircle, Sparkles,
  FileText, Clock, ChevronLeft, Copy, Check,
  Captions, Wand2, Download, Calendar, Flame, Trophy,
  Sliders, Paintbrush,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ClipVideoComposition } from "@/components/dashboard/ClipVideoComposition";
import { CAPTION_PRESETS, FONT_OPTIONS } from "@/lib/captionPresets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Dynamic import for Remotion Player to avoid hydration/window reference errors during SSR
const Player = dynamic(
  () => import("@remotion/player").then((mod) => mod.Player),
  { ssr: false }
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface Clip {
  id: number;
  projectId: string;
  startTime: number;
  endTime: number;
  reason: string;
  seoRanking: number;
  captions: string;
  status: string;
  fontFamily: string;
  textColor: string;
  highlightColor: string;
  highlightTextColor: string;
  captionStyle: string;
  createdAt: string;
  videoUrl?: string | null;
  renderStatus?: string | null;
  renderProgress?: number;
}

interface Project {
  projectId: string;
  title: string;
  status: string;
  s3Url: string | null;
  sourceUrl: string | null;
  analysisStatus: string | null;
  transcription: string | null;
  captions: string | null;
  transcriptionDuration: number | null;
  errorMsg: string | null;
  playUrl?: string | null;
  clips?: Clip[];
}

type AnalysisStatus = "idle" | "transcribing" | "done" | "failed";

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "upload",      label: "Video Upload",      icon: "🎬" },
  { id: "transcribe",  label: "Transcription",      icon: "📝" },
  { id: "captions",    label: "Caption Generation", icon: "💬" },
  { id: "clips",       label: "Generate Clips",     icon: "✂️"  },
];

function getCompletedSteps(project: Project | null): string[] {
  if (!project) return [];
  const done: string[] = [];
  if (project.status === "ready") done.push("upload");
  if (project.analysisStatus === "done") {
    done.push("transcribe");
    if (project.captions) done.push("captions");
  }
  return done;
}

function getActiveStep(project: Project | null): string | null {
  if (!project) return null;
  if (project.status !== "ready") return "upload";
  if (project.analysisStatus === "transcribing") return "transcribe";
  if (project.analysisStatus === "done" && !project.captions) return "captions";
  if (project.analysisStatus === "done") return "clips";
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [generatingClips, setGeneratingClips] = useState(false);
  const [clipsError, setClipsError] = useState<string | null>(null);
  const [clipsSuccess, setClipsSuccess] = useState(false);
  const [copied, setCopied] = useState<"transcript" | "srt" | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "srt">("transcript");

  // New clips and transcript display state
  const [selectedClipIndex, setSelectedClipIndex] = useState<number>(0);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  
  // Scheduling state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [schedulePlatforms, setSchedulePlatforms] = useState<string[]>(["tiktok"]);
  const [scheduling, setScheduling] = useState(false);

  // Edit Clip Style state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFontFamily, setEditFontFamily] = useState("sans-serif");
  const [editTextColor, setEditTextColor] = useState("#FFE600");
  const [editHighlightColor, setEditHighlightColor] = useState("#FFE600");
  const [editHighlightTextColor, setEditHighlightTextColor] = useState("#000000");
  const [editCaptionStyle, setEditCaptionStyle] = useState("highlight");
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  // Video Rendering progress dialog states
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false);
  const lastDownloadedUrlRef = useRef<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch project ─────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      const data: Project = await res.json();
      setProject(data);
      setError(null);

      // Stop polling once analysis is complete or failed
      if (data.analysisStatus === "done" || data.analysisStatus === "failed") {
        stopPolling();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(fetchProject, 3000);
  }, [fetchProject, stopPolling]);

  useEffect(() => {
    fetchProject();
    return stopPolling;
  }, [fetchProject, stopPolling]);

  // Keep polling while transcribing, waiting for clip generation, or while a clip is rendering
  useEffect(() => {
    const isAnyClipRendering = !!project?.clips?.some((c) => c.renderStatus === "rendering");
    if (project?.analysisStatus === "transcribing" || isAnyClipRendering) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [project?.analysisStatus, project?.clips, startPolling, stopPolling]);


  // ── Trigger analysis ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!project || triggering) return;
    setTriggering(true);
    try {
      const res = await fetch(`/api/project/${projectId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Failed to start analysis");
      // Optimistically update state and start polling
      setProject((p) => p ? { ...p, analysisStatus: "transcribing" } : p);
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start analysis");
    } finally {
      setTriggering(false);
    }
  };

  // ── Generate Clips ────────────────────────────────────────────────────────
  const handleGenerateClips = async () => {
    if (!project || generatingClips) return;
    setGeneratingClips(true);
    setClipsError(null);
    setClipsSuccess(false);
    try {
      const res = await fetch(`/api/project/${projectId}/generate-clips`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Failed to generate clips");
      // Optimistically flip to transcribing state so UI shows spinner and starts polling
      setProject((p) => p ? { ...p, analysisStatus: "transcribing" } : p);
      setClipsSuccess(true);
      startPolling();
    } catch (e) {
      setClipsError(e instanceof Error ? e.message : "Failed to generate clips");
    } finally {
      setGeneratingClips(false);
    }
  };

  // ── Copy helpers ─────────────────────────────────────────────────────────
  const handleCopy = async (type: "transcript" | "srt", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const completedSteps = getCompletedSteps(project);
  const activeStep = getActiveStep(project);
  const analysisStatus = (project?.analysisStatus ?? "idle") as AnalysisStatus;
  const isTranscribing = analysisStatus === "transcribing";
  const isDone = analysisStatus === "done";
  const isFailedAnalysis = analysisStatus === "failed";

  const wordCount = project?.transcription
    ? project.transcription.trim().split(/\s+/).length
    : 0;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const hasClips = !!(project?.clips && project.clips.length > 0);
  const selectedClip = hasClips && project?.clips ? project.clips[selectedClipIndex] : null;
  const clipDurationSec = selectedClip ? selectedClip.endTime - selectedClip.startTime : 0;
  const durationInFrames = Math.max(30, Math.round(clipDurationSec * 30));

  // ── Download Clip Handler ─────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!project || !selectedClip) return;

    // If video is already rendered, download it directly via download proxy
    if (selectedClip.videoUrl) {
      const filename = `${project.title.replace(/\s+/g, "_")}_clip_${selectedClipIndex + 1}.mp4`;
      const downloadUrl = `/api/download?url=${encodeURIComponent(selectedClip.videoUrl)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Open render progress dialog
    setIsRenderDialogOpen(true);

    // If it is already rendering, we just wait and poll. Otherwise, trigger rendering
    if (selectedClip.renderStatus !== "rendering") {
      try {
        const res = await fetch(`/api/project/${projectId}/clip/${selectedClip.id}/render`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to trigger rendering");
        }

        // Optimistically update render status in local state
        setProject((prev) => {
          if (!prev || !prev.clips) return prev;
          const updatedClips = prev.clips.map((c) =>
            c.id === selectedClip.id
              ? { ...c, renderStatus: "rendering", renderProgress: 5 }
              : c
          );
          return { ...prev, clips: updatedClips };
        });
        startPolling();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to start video rendering");
        setIsRenderDialogOpen(false);
      }
    }
  };

  // Auto-download clip once it's rendered successfully
  useEffect(() => {
    if (selectedClip && selectedClip.renderStatus === "ready" && selectedClip.videoUrl) {
      if (isRenderDialogOpen && lastDownloadedUrlRef.current !== selectedClip.videoUrl) {
        lastDownloadedUrlRef.current = selectedClip.videoUrl;
        setIsRenderDialogOpen(false);
        toast.success("Clip rendered and downloaded successfully!");

        // Trigger file download via download proxy
        const filename = `${project?.title.replace(/\s+/g, "_") || "clip"}_clip_${selectedClipIndex + 1}.mp4`;
        const downloadUrl = `/api/download?url=${encodeURIComponent(selectedClip.videoUrl)}&filename=${encodeURIComponent(filename)}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, [selectedClip, isRenderDialogOpen, selectedClipIndex, project?.title]);

  // ── Schedule Post Handler ─────────────────────────────────────────────────
  const handleConfirmSchedule = async () => {
    if (!selectedClip || !scheduleDate || !scheduleTime) return;
    setScheduling(true);
    // Simulate scheduling delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setScheduling(false);
    setIsScheduleOpen(false);
    toast.success(`Successfully scheduled clip to post on ${scheduleDate} at ${scheduleTime}!`);
  };

  // ── Edit Clip Style Handlers ──────────────────────────────────────────────
  const handleOpenEditModal = () => {
    if (!selectedClip) return;
    setEditFontFamily(selectedClip.fontFamily || "sans-serif");
    setEditTextColor(selectedClip.textColor || "#FFE600");
    setEditHighlightColor(selectedClip.highlightColor || "#FFE600");
    setEditHighlightTextColor(selectedClip.highlightTextColor || "#000000");
    setEditCaptionStyle(selectedClip.captionStyle || "highlight");
    setIsEditModalOpen(true);
  };

  const handleSaveStyle = async () => {
    if (!selectedClip) return;
    setIsSavingStyle(true);
    try {
      const res = await fetch(`/api/project/${projectId}/clip/${selectedClip.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fontFamily: editFontFamily,
          textColor: editTextColor,
          highlightColor: editHighlightColor,
          highlightTextColor: editHighlightTextColor,
          captionStyle: editCaptionStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save caption style");
      }

      // Update the clip's style in the local state, resetting the rendered URL
      setProject((prev) => {
        if (!prev || !prev.clips) return prev;
        const updatedClips = prev.clips.map((c) =>
          c.id === selectedClip.id
            ? {
                ...c,
                fontFamily: editFontFamily,
                textColor: editTextColor,
                highlightColor: editHighlightColor,
                highlightTextColor: editHighlightTextColor,
                captionStyle: editCaptionStyle,
                videoUrl: null,
                renderStatus: "idle",
                renderProgress: 0,
              }
            : c
        );
        return { ...prev, clips: updatedClips };
      });

      toast.success("Caption style updated successfully!");
      setIsEditModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save caption style");
    } finally {
      setIsSavingStyle(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center glow-primary">
            <Loader2 className="size-6 text-white animate-spin" />
          </div>
          <p className="text-[oklch(0.55_0.01_270)] text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <AlertCircle className="size-10 text-red-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Project not found</p>
          <p className="text-[oklch(0.50_0.01_270)] text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="size-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="size-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{project?.title}</h1>
          <p className="text-sm text-[oklch(0.50_0.01_270)] mt-0.5">Project · {projectId.slice(0, 8)}…</p>
        </div>
        {/* AI Analysis CTA */}
        {project?.status === "ready" && analysisStatus === "idle" && (
          <button
            onClick={handleAnalyze}
            disabled={triggering}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {triggering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {triggering ? "Starting…" : "AI Analysis"}
          </button>
        )}
        {isTranscribing && (
          <div className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white bg-white/5 border border-white/10">
            <Loader2 className="size-4 animate-spin text-[oklch(0.65_0.25_280)]" />
            Transcribing & Clipping…
          </div>
        )}
        {isDone && !hasClips && (
          <div className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-[oklch(0.65_0.22_195)] bg-[oklch(0.65_0.22_195/0.08)] border border-[oklch(0.65_0.22_195/0.2)]">
            <CheckCircle2 className="size-4" />
            Analysis Complete
          </div>
        )}
        {isDone && hasClips && (
          <button
            onClick={handleGenerateClips}
            disabled={generatingClips}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingClips ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Regenerate Clips
          </button>
        )}
      </div>

      {/* ── Pipeline Steps (Only show if clips are NOT ready) ────────────────── */}
      {(!isDone || !hasClips) && (
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-[oklch(0.45_0.01_270)] uppercase tracking-widest font-semibold mb-5">
            Processing Pipeline
          </p>
          <div className="flex items-start gap-0">
            {STEPS.map((step, i) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = activeStep === step.id;
              const isLocked = !isCompleted && !isActive;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isCompleted
                          ? "gradient-brand border-transparent glow-primary"
                          : isActive
                          ? "border-[oklch(0.65_0.25_280)] bg-[oklch(0.65_0.25_280/0.1)]"
                          : "border-white/10 bg-white/3"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-5 text-white" />
                      ) : isActive ? (
                        isTranscribing && step.id === "transcribe" ? (
                          <Loader2 className="size-5 text-[oklch(0.65_0.25_280)] animate-spin" />
                        ) : (
                          <span className="text-lg">{step.icon}</span>
                        )
                      ) : (
                        <span className={`text-lg ${isLocked ? "opacity-30" : ""}`}>{step.icon}</span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-xs text-center font-medium leading-tight px-1 ${
                        isCompleted
                          ? "text-[oklch(0.65_0.22_195)]"
                          : isActive
                          ? "text-white"
                          : "text-[oklch(0.35_0.01_270)]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div className={`h-[2px] flex-1 mt-5 mx-1 rounded-full transition-all duration-500 ${
                      completedSteps.includes(STEPS[i + 1]?.id ?? "") || completedSteps.includes(step.id)
                        ? "gradient-brand opacity-70"
                        : "bg-white/8"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transcribing Loader ─────────────────────────────────────────────── */}
      {isTranscribing && (
        <div className="glass-card rounded-2xl p-8 border border-[oklch(0.65_0.25_280/0.2)] text-center">
          <div className="relative inline-flex mb-6">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center glow-primary">
              <Wand2 className="size-8 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl gradient-brand opacity-20 blur-xl animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Analyzing & Extracting Clips</h3>
          <p className="text-sm text-[oklch(0.55_0.01_270)] max-w-md mx-auto mb-6">
            Deepgram & Gemini are transcribing your video and clipping viral moments.
            This usually takes 10–60 seconds.
          </p>
          {/* Animated progress bar */}
          <div className="h-1.5 w-64 mx-auto bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-full gradient-brand rounded-full origin-left animate-[indeterminate_1.8s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
          <p className="text-xs text-[oklch(0.40_0.01_270)] mt-3">Generating viral clips…</p>
        </div>
      )}

      {/* ── Analysis Failed ─────────────────────────────────────────────────── */}
      {isFailedAnalysis && (
        <div className="glass-card rounded-2xl p-6 border border-[oklch(0.65_0.22_25/0.3)]">
          <div className="flex items-start gap-4">
            <AlertCircle className="size-6 text-[oklch(0.65_0.22_25)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold mb-1">Analysis Failed</p>
              <p className="text-sm text-[oklch(0.50_0.01_270)] mb-4">
                {project?.errorMsg ?? "Transcription failed. Check your Deepgram API key and video URL."}
              </p>
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              >
                <Sparkles className="size-4" /> Retry Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clips Dashboard (Visible once clips are ready) ────────────────── */}
      {isDone && hasClips && selectedClip && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-[fadeIn_0.5s_ease-out]">
          {/* Left Column: Player (Visuals) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative aspect-[9/16] w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center group">
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <Loader2 className="size-8 text-white/20 animate-spin" />
              </div>
              <div className="absolute inset-0 z-10 w-full h-full">
                <Player
                  key={`${selectedClipIndex}_${selectedClip.startTime}`}
                  component={ClipVideoComposition as any}
                  inputProps={{
                    src: project.playUrl ?? project.s3Url ?? project.sourceUrl ?? "",
                    startTimeSec: selectedClip.startTime,
                    endTimeSec: selectedClip.endTime,
                    captions: selectedClip.captions,
                    fontFamily: selectedClip.fontFamily,
                    textColor: selectedClip.textColor,
                    highlightColor: selectedClip.highlightColor,
                    highlightTextColor: selectedClip.highlightTextColor,
                    captionStyle: selectedClip.captionStyle,
                  }}
                  durationInFrames={durationInFrames}
                  fps={30}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  controls
                  loop
                  autoPlay={false}
                />
              </div>
            </div>
            <p className="text-center text-xs text-[oklch(0.50_0.01_270)]">
              💡 Drag scrub bar to seek. Video plays from {formatDuration(selectedClip.startTime)} to {formatDuration(selectedClip.endTime)}.
            </p>
          </div>

          {/* Right Column: Clip Details & Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Clip Selector Tabs */}
            <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[oklch(0.55_0.01_270)]">
                Generated Viral Clips
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.clips?.map((clip, idx) => {
                  const isSelected = idx === selectedClipIndex;
                  const duration = clip.endTime - clip.startTime;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => setSelectedClipIndex(idx)}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all duration-300 ${
                        isSelected
                          ? "bg-[oklch(0.65_0.25_280/0.08)] border-[oklch(0.65_0.25_280)] shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                          : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? "gradient-brand text-white" : "bg-white/5 text-[oklch(0.60_0.01_270)]"
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white truncate">Clip {idx + 1}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[oklch(0.65_0.22_195)]">
                            <Flame className="size-3 fill-[oklch(0.65_0.22_195/0.1)]" /> {clip.seoRanking}%
                          </span>
                        </div>
                        <p className="text-[10px] text-[oklch(0.50_0.01_270)] mt-0.5">
                          Duration: {formatDuration(duration)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Virality Analysis & Reason */}
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.22_195/0.1)] border border-[oklch(0.65_0.22_195/0.2)] flex items-center justify-center">
                    <Trophy className="size-5 text-[oklch(0.65_0.22_195)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Viral Analysis</h3>
                    <p className="text-xs text-[oklch(0.50_0.01_270)]">Engagement prediction and SEO keywords</p>
                  </div>
                </div>
                {/* SEO Score Badge */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-xs text-[oklch(0.55_0.01_270)] uppercase tracking-wider font-semibold">SEO Score:</span>
                  <span className="text-lg font-bold text-[oklch(0.65_0.22_195)]">{selectedClip.seoRanking}/100</span>
                </div>
              </div>

              {/* Reason description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[oklch(0.65_0.25_280)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> AI Insight
                </span>
                <p className="text-sm text-[oklch(0.80_0.01_270)] leading-relaxed bg-white/3 border border-white/5 rounded-xl p-4">
                  {selectedClip.reason}
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="size-4" /> Download Clip
                </button>
                <button
                  onClick={handleOpenEditModal}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white border border-[oklch(0.65_0.25_280/0.4)] bg-[oklch(0.65_0.25_280/0.05)] hover:bg-[oklch(0.65_0.25_280/0.15)] active:scale-95 transition-all cursor-pointer"
                >
                  <Wand2 className="size-4 text-[oklch(0.65_0.25_280)]" /> Edit Style
                </button>
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold text-white gradient-brand shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Calendar className="size-4" /> Schedule Post
                </button>
              </div>
            </div>
            
            {/* Toggle Full Transcript / Captions Section */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/3 hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[oklch(0.65_0.25_280)]" />
                  <span className="text-sm font-semibold text-white">View Full Video Transcript & Captions</span>
                </div>
                <span className="text-xs text-[oklch(0.50_0.01_270)] bg-white/5 px-2.5 py-1 rounded-lg">
                  {showFullTranscript ? "Hide" : "Show"}
                </span>
              </button>
              
              {showFullTranscript && (
                <div className="p-6 border-t border-white/8 space-y-4">
                  <div className="flex items-center gap-4 text-xs text-[oklch(0.50_0.01_270)]">
                    <div>Words: <span className="text-white font-medium">{wordCount.toLocaleString()}</span></div>
                    {project.transcriptionDuration && (
                      <div>Duration: <span className="text-white font-medium">{formatDuration(project.transcriptionDuration)}</span></div>
                    )}
                  </div>
                  {/* Tabs */}
                  <div className="flex border-b border-white/8">
                    {[
                      { key: "transcript" as const, label: "Transcript", icon: FileText },
                      { key: "srt" as const, label: "SRT Captions", icon: Captions },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all duration-200 ${
                          activeTab === key
                            ? "text-white border-b-2 border-[oklch(0.65_0.25_280)] bg-[oklch(0.65_0.25_280/0.05)]"
                            : "text-[oklch(0.45_0.01_270)] hover:text-white hover:bg-white/3"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Content area */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        handleCopy(
                          activeTab,
                          activeTab === "transcript"
                            ? (project.transcription ?? "")
                            : (project.captions ?? "")
                        )
                      }
                      className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-[oklch(0.60_0.01_270)] hover:text-white transition-all duration-200"
                    >
                      {copied === activeTab ? (
                        <Check className="size-3 text-[oklch(0.65_0.22_195)]" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      {copied === activeTab ? "Copied!" : "Copy"}
                    </button>

                    <pre className="p-4 text-xs text-[oklch(0.78_0.01_270)] leading-relaxed whitespace-pre-wrap break-words max-h-[250px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-16 bg-white/3 rounded-xl border border-white/5">
                      {activeTab === "transcript"
                        ? project.transcription
                        : (project.captions ?? "No captions generated")}
                    </pre>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Transcription Results (Only show if clips are NOT ready) ────────── */}
      {isDone && !hasClips && project?.transcription && (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          {/* Stats bar */}
          <div className="flex items-center gap-6 px-6 py-4 border-b border-white/8 flex-wrap gap-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-[oklch(0.65_0.25_280)]" />
              <span className="text-white font-medium">{wordCount.toLocaleString()}</span>
              <span className="text-[oklch(0.45_0.01_270)]">words</span>
            </div>
            {project.transcriptionDuration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-[oklch(0.65_0.25_280)]" />
                <span className="text-white font-medium">{formatDuration(project.transcriptionDuration)}</span>
                <span className="text-[oklch(0.45_0.01_270)]">duration</span>
              </div>
            )}
            {project.captions && (
              <div className="flex items-center gap-2 text-sm">
                <Captions className="size-4 text-[oklch(0.65_0.25_280)]" />
                <span className="text-white font-medium">
                  {project.captions.split("\n\n").length}
                </span>
                <span className="text-[oklch(0.45_0.01_270)]">caption segments</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {[
              { key: "transcript" as const, label: "Transcript", icon: FileText },
              { key: "srt" as const, label: "SRT Captions", icon: Captions },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === key
                    ? "text-white border-b-2 border-[oklch(0.65_0.25_280)] bg-[oklch(0.65_0.25_280/0.05)]"
                    : "text-[oklch(0.45_0.01_270)] hover:text-white hover:bg-white/3"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="relative">
            {/* Copy button */}
            <button
              onClick={() =>
                handleCopy(
                  activeTab,
                  activeTab === "transcript"
                    ? (project.transcription ?? "")
                    : (project.captions ?? "")
                )
              }
              className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-[oklch(0.60_0.01_270)] hover:text-white transition-all duration-200"
            >
              {copied === activeTab ? (
                <Check className="size-3.5 text-[oklch(0.65_0.22_195)]" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied === activeTab ? "Copied!" : "Copy"}
            </button>

            <pre className="p-6 text-sm text-[oklch(0.78_0.01_270)] leading-relaxed whitespace-pre-wrap break-words max-h-[420px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-20">
              {activeTab === "transcript"
                ? project.transcription
                : (project.captions ?? "No captions generated")}
            </pre>
          </div>
        </div>
      )}

      {/* ── Generate Clips CTA (Only show if clips are NOT ready) ───────────── */}
      {isDone && !hasClips && (
        <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold mb-1">Ready to generate clips ✂️</p>
            <p className="text-sm text-[oklch(0.50_0.01_270)]">
              Transcription complete — AI can now identify the best moments to clip.
            </p>
          </div>
          {clipsError && (
            <p className="text-xs text-red-400 mb-2">{clipsError}</p>
          )}
          {clipsSuccess && (
            <p className="text-xs text-emerald-400 mb-2">✅ Clip generation started! Results will appear shortly.</p>
          )}
          <button
            onClick={handleGenerateClips}
            disabled={generatingClips}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-[1.02] transition-all duration-200 whitespace-nowrap flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
          >
            {generatingClips ? (
              <><Loader2 className="size-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="size-4" /> Generate Clips</>
            )}
          </button>
        </div>
      )}

      {/* ── Rendering Progress Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isRenderDialogOpen} onOpenChange={setIsRenderDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[oklch(0.12_0.015_270)] border border-white/10 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedClip?.renderStatus === "failed" ? (
                <>
                  <AlertCircle className="size-5 text-red-500" />
                  Rendering Failed
                </>
              ) : (
                <>
                  <Loader2 className="size-5 text-[oklch(0.65_0.25_280)] animate-spin" />
                  Rendering Short Clip #{selectedClipIndex + 1}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.50_0.01_270)] text-sm">
              {selectedClip?.renderStatus === "failed" 
                ? "An error occurred while compiling your video. You can try rendering again."
                : "We are stitching your video, adding captions with your style presets, and processing the clip using Remotion Lambda."
              }
            </DialogDescription>
          </DialogHeader>

          {selectedClip?.renderStatus === "failed" ? (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <p className="text-xs text-[oklch(0.40_0.01_270)] leading-relaxed max-w-[280px]">
                Please double check your connection and configuration, then click below to retry.
              </p>
              <Button
                onClick={() => {
                  setIsRenderDialogOpen(false);
                  setTimeout(() => handleDownload(), 100);
                }}
                className="rounded-xl gradient-brand text-white font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer w-full"
              >
                Retry Rendering
              </Button>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden">
                <div 
                  className="gradient-brand h-full rounded-full transition-all duration-500" 
                  style={{ width: `${selectedClip?.renderProgress ?? 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center w-full text-xs text-[oklch(0.50_0.01_270)] font-medium px-1">
                <span>{selectedClip?.renderStatus === "rendering" ? "Rendering on Lambda..." : "Initializing..."}</span>
                <span className="text-white font-bold">{selectedClip?.renderProgress ?? 0}%</span>
              </div>

              <p className="text-xs text-[oklch(0.40_0.01_270)] leading-relaxed max-w-[280px]">
                This usually takes 10 to 30 seconds. Do not close this window.
              </p>
            </div>
          )}

          <DialogFooter className="flex sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsRenderDialogOpen(false)}
              className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Scheduling Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[oklch(0.12_0.015_270)] border border-white/10 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="size-5 text-[oklch(0.65_0.25_280)]" />
              Schedule Clip Post
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.50_0.01_270)] text-sm">
              Select a date, time, and target platforms to schedule this clip for auto-posting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date picker */}
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.50_0.01_270)]">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[oklch(0.65_0.25_280)] text-white"
              />
            </div>
            {/* Time picker */}
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.50_0.01_270)]">Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[oklch(0.65_0.25_280)] text-white"
              />
            </div>
            {/* Platform checkboxes */}
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.50_0.01_270)]">Platforms</label>
              <div className="flex gap-4 mt-1">
                {[
                  { id: "tiktok", label: "TikTok" },
                  { id: "reels", label: "Reels" },
                  { id: "shorts", label: "Shorts" }
                ].map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={schedulePlatforms.includes(platform.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSchedulePlatforms([...schedulePlatforms, platform.id]);
                        } else {
                          setSchedulePlatforms(schedulePlatforms.filter((p) => p !== platform.id));
                        }
                      }}
                      className="accent-[oklch(0.65_0.25_280)] rounded border-white/10"
                    />
                    <span className="text-[oklch(0.80_0.01_270)]">{platform.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 flex sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsScheduleOpen(false)}
              className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSchedule}
              disabled={scheduling || !scheduleDate || !scheduleTime || schedulePlatforms.length === 0}
              className="rounded-xl gradient-brand text-white font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {scheduling ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                "Confirm Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Style Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-5xl bg-[oklch(0.12_0.015_270)] border border-white/10 text-white rounded-2xl p-6 overflow-y-auto max-h-[95vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {selectedClip && (
            <>
              <DialogHeader className="border-b border-white/8 pb-4 mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sliders className="size-6 text-[oklch(0.65_0.25_280)]" />
              Customize Captions Style
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.50_0.01_270)] text-sm">
              Adjust caption presets, select custom fonts, and tweak colors. Changes update in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Styling Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Presets section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[oklch(0.50_0.01_270)] flex items-center gap-1.5">
                  <Paintbrush className="size-4 text-[oklch(0.65_0.22_195)]" />
                  Preset Templates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAPTION_PRESETS.map((preset) => {
                    const isSelected = editCaptionStyle === preset.captionStyle &&
                                       editTextColor.toLowerCase() === preset.textColor.toLowerCase() &&
                                       editHighlightColor.toLowerCase() === preset.highlightColor.toLowerCase() &&
                                       editHighlightTextColor.toLowerCase() === preset.highlightTextColor.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditCaptionStyle(preset.captionStyle);
                          setEditTextColor(preset.textColor);
                          setEditHighlightColor(preset.highlightColor);
                          setEditHighlightTextColor(preset.highlightTextColor);
                        }}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-3 transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-[oklch(0.65_0.25_280/0.1)] border-[oklch(0.65_0.25_280)] shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.01]"
                            : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-bold text-white">{preset.name}</span>
                          <span className="text-[9px] text-[oklch(0.50_0.01_270)] font-semibold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {preset.captionStyle}
                          </span>
                        </div>

                        {/* Real-time Subtitle Typography & Color Preview */}
                        <div 
                          className="w-full h-16 bg-black/50 rounded-lg flex items-center justify-center gap-2 px-3 py-2 border border-white/5 overflow-hidden transition-all duration-300"
                          style={{ fontFamily: editFontFamily }}
                        >
                          <span 
                            style={{ 
                              color: preset.textColor,
                              fontSize: "0.85rem",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.01em",
                              transition: "color 0.3s ease"
                            }}
                          >
                            Viral
                          </span>
                          <span 
                            style={{ 
                              color: preset.highlightTextColor,
                              backgroundColor: preset.captionStyle === "minimal" ? "transparent" : preset.highlightColor,
                              padding: preset.captionStyle === "minimal" ? "0" : "0.15rem 0.5rem",
                              borderRadius: preset.captionStyle === "minimal" ? "0" : "0.25rem",
                              fontSize: "0.85rem",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.01em",
                              display: "inline-block",
                              transform: preset.captionStyle === "minimal" ? "none" : "scale(1.05) rotate(-1deg)",
                              border: preset.captionStyle === "block" ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
                              boxShadow: preset.captionStyle === "minimal" ? "none" : "0 2px 4px rgba(0,0,0,0.15)",
                              transition: "all 0.3s ease"
                            }}
                          >
                            Clip
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fonts section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[oklch(0.50_0.01_270)] flex items-center gap-1.5">
                  <Captions className="size-4 text-[oklch(0.65_0.22_195)]" />
                  Font Typography
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = editFontFamily === font.value;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setEditFontFamily(font.value)}
                        style={{ fontFamily: font.value }}
                        className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-[oklch(0.65_0.25_280/0.1)] border-[oklch(0.65_0.25_280)] text-white font-bold"
                            : "bg-white/3 border-white/5 text-[oklch(0.70_0.01_270)] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {font.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Colors section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[oklch(0.50_0.01_270)] flex items-center gap-1.5">
                  <Sliders className="size-4 text-[oklch(0.65_0.22_195)]" />
                  Custom Color Palette
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Primary Text Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.55_0.01_270)]">
                      Base Subtitles
                    </label>
                    <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <input
                          type="color"
                          value={editTextColor}
                          onChange={(e) => setEditTextColor(e.target.value)}
                          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-0 cursor-pointer p-0 m-0 bg-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        value={editTextColor}
                        onChange={(e) => setEditTextColor(e.target.value)}
                        className="bg-transparent border-0 text-xs font-mono text-white focus:outline-none w-full uppercase"
                      />
                    </div>
                  </div>

                  {/* Highlight BG Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.55_0.01_270)]">
                      Highlight BG
                    </label>
                    <div className={`flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2 ${
                      editCaptionStyle === "minimal" ? "opacity-40" : ""
                    }`}>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <input
                          type="color"
                          value={editHighlightColor === "transparent" ? "#000000" : editHighlightColor}
                          disabled={editCaptionStyle === "minimal"}
                          onChange={(e) => setEditHighlightColor(e.target.value)}
                          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-0 cursor-pointer p-0 m-0 bg-transparent disabled:cursor-not-allowed"
                        />
                      </div>
                      <input
                        type="text"
                        value={editHighlightColor}
                        disabled={editCaptionStyle === "minimal"}
                        onChange={(e) => setEditHighlightColor(e.target.value)}
                        className="bg-transparent border-0 text-xs font-mono text-white focus:outline-none w-full uppercase disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Highlight Text Color */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.55_0.01_270)]">
                      Highlight Text
                    </label>
                    <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <input
                          type="color"
                          value={editHighlightTextColor}
                          onChange={(e) => setEditHighlightTextColor(e.target.value)}
                          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-0 cursor-pointer p-0 m-0 bg-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        value={editHighlightTextColor}
                        onChange={(e) => setEditHighlightTextColor(e.target.value)}
                        className="bg-transparent border-0 text-xs font-mono text-white focus:outline-none w-full uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtitle Style Type Selector */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.55_0.01_270)]">
                    Caption Style Preset Rule
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "highlight", label: "Highlight Box" },
                      { id: "neon", label: "Neon Cyberpunk" },
                      { id: "block", label: "Classic Block" },
                      { id: "minimal", label: "Minimalist (No BG)" },
                    ].map((styleOption) => {
                      const isSelected = editCaptionStyle === styleOption.id;
                      return (
                        <button
                          key={styleOption.id}
                          type="button"
                          onClick={() => {
                            setEditCaptionStyle(styleOption.id);
                            if (styleOption.id === "minimal") {
                              setEditHighlightColor("transparent");
                            } else if (editHighlightColor === "transparent") {
                              setEditHighlightColor("#FFE600");
                            }
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-white/10 border-white/30 text-white font-semibold"
                              : "bg-white/3 border-white/5 text-[oklch(0.60_0.01_270)] hover:text-white"
                          }`}
                        >
                          {styleOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Remotion Preview */}
            <div className="lg:col-span-5 flex flex-col items-center gap-4 bg-white/3 border border-white/8 rounded-2xl p-5 sticky top-0">
              <div className="w-full text-center border-b border-white/8 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles className="size-3 text-[oklch(0.65_0.22_195)] animate-pulse" />
                  Live Preview Player
                </span>
              </div>
              
              <div className="relative aspect-[9/16] w-full max-w-[260px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center">
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <Loader2 className="size-6 text-white/20 animate-spin" />
                </div>
                <div className="absolute inset-0 z-10 w-full h-full">
                  <Player
                    key={`edit_${selectedClipIndex}_${selectedClip.startTime}`}
                    component={ClipVideoComposition as any}
                    inputProps={{
                      src: project?.playUrl ?? project?.s3Url ?? project?.sourceUrl ?? "",
                      startTimeSec: selectedClip.startTime,
                      endTimeSec: selectedClip.endTime,
                      captions: selectedClip.captions,
                      fontFamily: editFontFamily,
                      textColor: editTextColor,
                      highlightColor: editHighlightColor,
                      highlightTextColor: editHighlightTextColor,
                      captionStyle: editCaptionStyle,
                    }}
                    durationInFrames={durationInFrames}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    controls
                    loop
                    autoPlay={false}
                  />
                </div>
              </div>
              <p className="text-center text-[10px] text-[oklch(0.50_0.01_270)] leading-relaxed max-w-[260px]">
                🎥 Preview changes instantly as you tweak properties. Subtitles will match the customized styling.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-8 border-t border-white/8 pt-4 flex sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStyle}
              disabled={isSavingStyle}
              className="rounded-xl gradient-brand text-white font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {isSavingStyle ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving Style...
                </>
              ) : (
                "Save & Apply Style"
              )}
            </Button>
          </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
