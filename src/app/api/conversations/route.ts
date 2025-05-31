import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  const mastraApiBaseUrl = process.env.NEXT_PUBLIC_MASTRA_API_BASE_URL;
  if (!mastraApiBaseUrl) {
    return NextResponse.json({ error: 'API endpoint not configured.' }, { status: 500 });
  }

  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';

  try {
    const response = await fetch(`${mastraApiBaseUrl}/conversations${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('/api/conversations proxy error:', err);
    return NextResponse.json({ error: 'Failed to connect to Mastra service.' }, { status: 503 });
  }
} 