import { NextResponse } from "next/server";
import { type CoreMessage } from "ai";

const historyCache = new Map<string, { data: unknown; timestamp: number }>();
const recentCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RECENT_CACHE_TTL = 30 * 1000; // 30 seconds for recent messages

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const limit = searchParams.get("limit") || "50";
  const beforeMessageId = searchParams.get("beforeMessageId");
  const recent = searchParams.get("recent") === "true";

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }

  // For new threads (local IDs), return empty history immediately
  if (conversationId.startsWith("__LOCALID_")) {
    return NextResponse.json({ messages: [], hasMore: false });
  }

  // Use different cache based on request type
  const cacheKey = recent
    ? `recent_${conversationId}`
    : `${conversationId}_${limit}_${beforeMessageId || "initial"}`;

  const cache = recent ? recentCache : historyCache;
  const cacheTTL = recent ? RECENT_CACHE_TTL : CACHE_TTL;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return NextResponse.json(cached.data);
  }

  const mastraApiBaseUrl = process.env.NEXT_PUBLIC_MASTRA_API_BASE_URL;
  if (!mastraApiBaseUrl) {
    console.error(
      "Mastra API URL (NEXT_PUBLIC_MASTRA_API_BASE_URL) is not configured."
    );
    return NextResponse.json(
      { error: "API endpoint not configured." },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      conversationId,
      limit,
      ...(beforeMessageId && { beforeMessageId }),
      ...(recent && { recent: "true" }),
    });

    const response = await fetch(`${mastraApiBaseUrl}/history?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const emptyHistory = { messages: [], hasMore: false };
        cache.set(cacheKey, { data: emptyHistory, timestamp: Date.now() });
        return NextResponse.json(emptyHistory);
      }

      const errorText = await response.text();
      console.error(
        `Error fetching history from Mastra service (${response.status}):`,
        errorText
      );
      return NextResponse.json(
        {
          error: `Error fetching history: ${errorText || response.statusText}`,
        },
        { status: response.status }
      );
    }

    const history: { messages: CoreMessage[]; hasMore: boolean } =
      await response.json();

    // Cache the result
    cache.set(cacheKey, { data: history, timestamp: Date.now() });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error calling Mastra history service:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to connect to Mastra history service.",
        details: errorMessage,
      },
      { status: 503 }
    );
  }
}
