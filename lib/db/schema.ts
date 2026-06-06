import { pgTable, text, timestamp, serial, integer, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Projects ────────────────────────────────────────────────────────────────
// One project is created per video upload. The Inngest workflow tracks progress
// by updating `status` and `progress` on this row.

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  // Public-facing UUID used in API routes and client polling
  projectId: uuid("project_id").defaultRandom().unique().notNull(),
  // FK to users table
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  // 'local' | 'youtube'
  sourceType: text("source_type").notNull(),
  // For local uploads: temp file path on server; for youtube: the full URL
  sourceUrl: text("source_url"),
  // YouTube video ID extracted from the URL
  youtubeId: text("youtube_id"),
  // 'pending' | 'uploading' | 'processing' | 'ready' | 'failed'
  status: text("status").notNull().default("pending"),
  // 0–100 upload/processing progress
  progress: integer("progress").notNull().default(0),
  // Human-readable status label shown in the UI
  statusLabel: text("status_label").default("Creating project…"),
  // Final S3 URL after upload (null until upload completes)
  s3Url: text("s3_url"),
  // Error message if status = 'failed'
  errorMsg: text("error_msg"),

  // ── AI Analysis ───────────────────────────────────────────────────────────
  // 'idle' | 'transcribing' | 'done' | 'failed'
  analysisStatus: text("analysis_status").default("idle"),
  // Full transcript text returned by Deepgram
  transcription: text("transcription"),
  // SRT-format captions string generated from Deepgram word timestamps
  captions: text("captions"),
  // Video duration in seconds (from Deepgram metadata)
  transcriptionDuration: integer("transcription_duration"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// ─── Clips ───────────────────────────────────────────────────────────────────
// Short video clips generated from a project using Gemini AI.

export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id").references(() => projects.projectId, { onDelete: 'cascade' }).notNull(),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time").notNull(),
  reason: text("reason").notNull(),
  seoRanking: integer("seo_ranking").notNull(),
  captions: text("captions").notNull(),
  status: text("status").notNull().default("pending"),
  fontFamily: text("font_family").default("sans-serif").notNull(),
  textColor: text("text_color").default("#FFE600").notNull(),
  highlightColor: text("highlight_color").default("#FFE600").notNull(),
  highlightTextColor: text("highlight_text_color").default("#000000").notNull(),
  captionStyle: text("caption_style").default("highlight").notNull(),
  videoUrl: text("video_url"),
  renderProgress: integer("render_progress").default(0).notNull(),
  renderStatus: text("render_status").default("idle").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Clip = typeof clips.$inferSelect;
export type NewClip = typeof clips.$inferInsert;

