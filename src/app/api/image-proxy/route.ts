import { NextRequest, NextResponse } from "next/server";

// Allowed image content types
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only proxy http/https URLs
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // No Referer header — this is what bypasses hotlink protection
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      // Don't follow redirects to avoid SSRF loops
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const baseType = contentType.split(";")[0].trim().toLowerCase();

    if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
      return NextResponse.json(
        { error: "Not an image" },
        { status: 415 }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 7 days in the browser, 30 days in CDN
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
