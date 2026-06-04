import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/feedback { message?, rating?, page?, mode? }
// Forwards to FEEDBACK_WEBHOOK_URL (Discord/Slack incoming webhook) if set; otherwise logs.
// No database required.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").slice(0, 4000);
  const rating = body.rating === "up" || body.rating === "down" ? body.rating : undefined;
  if (!message && !rating) return NextResponse.json({ error: "empty" }, { status: 400 });

  const meta = { page: body.page, mode: body.mode, ts: new Date().toISOString() };
  const line = `**Troof feedback**${rating ? ` [${rating}]` : ""}${message ? `: ${message}` : ""}\n\`${JSON.stringify(meta)}\``;

  const url = process.env.FEEDBACK_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // `content` works for Discord; `text` for Slack — send both keys.
        body: JSON.stringify({ content: line, text: line }),
      });
    } catch {
      /* swallow — feedback must never break the app */
    }
  } else {
    console.log("[feedback]", { rating, message, meta });
  }
  return NextResponse.json({ ok: true });
}
