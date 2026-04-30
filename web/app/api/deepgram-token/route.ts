// Mints a short-lived Deepgram access token so the browser can open a streaming
// STT WebSocket directly to Deepgram without ever seeing the project API key.
//
// Deepgram's docs: https://developers.deepgram.com/docs/short-lived-tokens
// POST https://api.deepgram.com/v1/auth/grant with the project key in the
// Authorization header. Response: { access_token, expires_in }. Default TTL is
// 30 seconds, which is plenty — the browser uses it to open the wss:// once,
// then the connection itself stays open as long as it has data.
import { NextResponse } from "next/server";

export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.err_msg || data?.message || "Could not mint Deepgram token" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
