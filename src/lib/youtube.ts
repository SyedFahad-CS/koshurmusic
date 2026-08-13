export function extractPlaylistId(urlOrId: string): string | null {
  const match =
    urlOrId.match(/[?&]list=([a-zA-Z0-9_-]+)/) ||
    urlOrId.match(/^(PL[a-zA-Z0-9_-]+)$/);
  return match ? match[1] : null;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getThumbnailUrl(
  youtubeUrl: string,
  quality: "maxres" | "hq" | "mq" | "default" = "maxres",
): string | null {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) return null;

  const qualityMap = {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
  };

  return qualityMap[quality];
}

export function getEmbeddedUrl(youtubeUrl: string): string | null {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export interface YouTubeMetadata {
  title: string;
  artist: string;
}

export async function fetchYouTubeMetadata(
  youtubeUrl: string,
): Promise<YouTubeMetadata | null> {
  try {
    const res = await fetch(
      `/api/youtube/meta?url=${encodeURIComponent(youtubeUrl)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.title) return null;
    return {
      title: data.title,
      artist: data.artist || "Unknown Artist",
    };
  } catch {
    return null;
  }
}
