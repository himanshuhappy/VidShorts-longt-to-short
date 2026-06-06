import {
  renderMediaOnLambda,
  getRenderProgress,
  getFunctions,
} from "@remotion/lambda/client";

const REGION = (process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || "ap-south-1") as any;
const BUCKET = process.env.AWS_S3_BUCKET || "vidshorts0";

// Standard Remotion Lambda function name format. 
// Can be customized if they deploy with different memory/disk settings.
const DEFAULT_FUNCTION_NAME = "remotion-render-4-0-471-mem2048mb-disk2048mb-120sec";

/**
 * Gets the list of deployed Remotion Lambda functions in the configured region.
 */
export async function getDeployedFunctions() {
  try {
    const functions = await getFunctions({
      region: REGION,
      compatibleOnly: false,
    });
    return functions;
  } catch (error) {
    console.error("Failed to fetch Remotion Lambda functions:", error);
    throw error;
  }
}

/**
 * Triggers a video render on Remotion Lambda.
 * 
 * @param params Object containing render configuration
 * @param params.serveUrl The URL of the deployed Remotion site (bundle)
 * @param params.composition The ID of the composition to render (e.g. "ClipVideoComposition")
 * @param params.inputProps Props to pass to the Remotion composition
 * @param params.functionName Optional custom function name (defaults to standard memory/disk config)
 */
export async function renderVideo({
  serveUrl = "https://remotionlambda-apsouth1-ov0ugwxz80.s3.ap-south-1.amazonaws.com/sites/4b1drsjum5/index.html",
  composition,
  inputProps,
  functionName = "remotion-render-4-0-471-mem2048mb-disk2048mb-120sec",
}: {
  serveUrl: string;
  composition: string;
  inputProps: Record<string, any>;
  functionName?: string;
}) {
  try {
    if (!serveUrl) {
      throw new Error("serveUrl (deployed Remotion site URL) is required to render a video.");
    }

    const { renderId, bucketName } = await renderMediaOnLambda({
      region: REGION,
      functionName,
      composition,
      serveUrl,
      inputProps,
      codec: "h264",
      privacy: "public",
      concurrency: 5,
    });

    console.log(`[Remotion Lambda] Triggered render ${renderId} in S3 bucket ${bucketName}`);
    return { renderId, bucketName };
  } catch (error) {
    console.error("[Remotion Lambda] Render trigger failed:", error);
    throw error;
  }
}

/**
 * Retrieves the status and progress of an active Remotion Lambda render.
 * 
 * @param renderId The ID of the render job
 * @param bucketName The name of the S3 bucket where the render is executing
 * @param functionName The name of the Lambda function running the render
 */
export async function getRenderStatus(
  renderId: string,
  bucketName: string = BUCKET,
  functionName: string = "remotion-render-4-0-471-mem2048mb-disk2048mb-120sec"
) {
  try {
    const progress = await getRenderProgress({
      region: REGION,
      bucketName,
      renderId,
      functionName,
    });

    return {
      done: progress.done,
      overallProgress: progress.overallProgress,
      outputUrl: progress.outputFile || null,
      errors: progress.errors,
      fatalError: progress.fatalErrorEncountered,
    };
  } catch (error) {
    console.error(`[Remotion Lambda] Failed to fetch status for render ${renderId}:`, error);
    throw error;
  }
}
