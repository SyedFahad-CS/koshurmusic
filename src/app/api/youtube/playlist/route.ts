import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400;

function parseFeed(xml: string) {
  const tracks: {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
  }[] = [];

  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(xml))) {
    const block = match[1];
    const id = block.match(/<yt:videoId>([^<]+)/)?.[1];
    const title = block.match(/<title>([^<]+)/)?.[1];
    const artist = block.match(/<name>([^<]+)/)?.[1];
    if (id && title) {
      tracks.push({
        id,
        title,
        artist: artist ?? "",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }
  }
  return tracks;
}

export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list");
  if (!list) {
    return NextResponse.json({ error: "missing list param" }, { status: 400 });
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${list}`;
  try {
    const res = await fetch(feedUrl, {
      next: { revalidate },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `feed request failed: ${res.status}` },
        { status: 502 },
      );
    }
    const xml = await res.text();
    return NextResponse.json({ tracks: parseFeed(xml) });
  } catch {
    return NextResponse.json({ error: "feed unavailable" }, { status: 502 });
  }
}