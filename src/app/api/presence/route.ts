import { NextResponse } from "next/server";

// Server-side active session map: sessionId -> lastActiveTimestamp
// Declared on globalThis so it persists across Next.js dev API hot-reloads
const globalPresence = globalThis as unknown as {
  presenceMap?: Map<string, number>;
};

if (!globalPresence.presenceMap) {
  globalPresence.presenceMap = new Map<string, number>();
}

const presenceMap = globalPresence.presenceMap;

// Prune sessions inactive for > 35 seconds
function cleanupStaleSessions() {
  const now = Date.now();
  const timeout = 35000; // 35 seconds
  for (const [sessionId, lastActive] of presenceMap.entries()) {
    if (now - lastActive > timeout) {
      presenceMap.delete(sessionId);
    }
  }
}

export async function GET() {
  cleanupStaleSessions();
  return NextResponse.json({
    count: Math.max(1, presenceMap.size),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = body?.sessionId;

    if (sessionId && typeof sessionId === "string") {
      presenceMap.set(sessionId, Date.now());
    }

    cleanupStaleSessions();

    return NextResponse.json({
      count: Math.max(1, presenceMap.size),
    });
  } catch {
    cleanupStaleSessions();
    return NextResponse.json(
      { count: Math.max(1, presenceMap.size) },
      { status: 200 },
    );
  }
}
