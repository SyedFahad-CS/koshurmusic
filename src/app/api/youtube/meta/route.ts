import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    url,
  )}&format=json`;

  try {
    const res = await fetch(oembedUrl, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "not found" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data.title ?? null,
      artist: data.author_name ?? null,
      thumbnail: data.thumbnail_url ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "failed to fetch metadata" },
      { status: 502 },
    );
  }
}
