import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/download
 * Proxies file downloads to bypass browser cross-origin limits on the `download` attribute.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "clip.mp4";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch remote file: ${res.statusText}`);
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Type", res.headers.get("Content-Type") || "video/mp4");

    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[/api/download] GET Error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
