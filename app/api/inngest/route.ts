import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { videoUploadFunction } from "@/lib/inngest/functions/videoUpload";
import { aiAnalysisFunction } from "@/lib/inngest/functions/aiAnalysis";
import { videoRenderFunction } from "@/lib/inngest/functions/videoRender";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [videoUploadFunction, aiAnalysisFunction, videoRenderFunction],
});
