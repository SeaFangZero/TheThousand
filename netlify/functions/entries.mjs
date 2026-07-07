// GET  /api/entries  -> public board: [{ name, count, prev }]  (NO channel IDs)
// POST /api/entries  -> add one entry { code, name, channel }
//
// Storage: Netlify Blobs (zero-config). Two stores:
//   "roster"   name -> { name, channelId, joinedAt }        (private; channel never leaves here)
//   "counts"   name -> { count, prev, history:[{t,count}] }  (public-safe numbers)

import { getStore } from "@netlify/blobs";
import { resolveChannelId, fetchSubscriberCount } from "./_youtube.mjs";

const JOIN_CODE = process.env.JOIN_CODE || "";
const MAX_NAME = 24;

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default async (req) => {
  const roster = getStore("roster");
  const counts = getStore("counts");

  if (req.method === "GET") {
    const { blobs } = await roster.list();
    const entries = [];
    for (const b of blobs) {
      const person = await roster.get(b.key, { type: "json" });
      const c = (await counts.get(b.key, { type: "json" })) || { count: 0, prev: 0 };
      entries.push({ name: person.name, count: c.count ?? 0, prev: c.prev ?? c.count ?? 0 });
    }
    const meta = await counts.get("_meta", { type: "json" }).catch(() => null);
    return json(200, { updated: meta?.updated || null, entries });
  }

  if (req.method === "POST") {
    let payload;
    try { payload = await req.json(); } catch { return json(400, { error: "Bad request." }); }

    const code = String(payload.code || "").trim();
    const name = String(payload.name || "").trim();
    const channel = String(payload.channel || "").trim();

    if (!JOIN_CODE) return json(500, { error: "Registration is not configured yet." });
    if (code !== JOIN_CODE) return json(403, { error: "That join code is not right." });
    if (!name || name.length > MAX_NAME) return json(400, { error: "Pick a name up to 24 characters." });
    if (!channel) return json(400, { error: "A channel is required." });

    const key = name.toLowerCase();
    const existing = await roster.get(key, { type: "json" }).catch(() => null);
    if (existing) return json(409, { error: "That name is already on the board." });

    // Resolve + verify the channel exists before we accept it.
    let channelId, startCount;
    try {
      channelId = await resolveChannelId(channel);
      if (!channelId) return json(400, { error: "Could not find that channel." });
      startCount = await fetchSubscriberCount(channelId);
      if (startCount == null) return json(400, { error: "That channel hides its subscriber count. Make it public to join." });
    } catch (err) {
      return json(502, { error: "YouTube lookup failed. Try again in a moment." });
    }

    const now = new Date().toISOString();
    await roster.setJSON(key, { name, channelId, joinedAt: now, startCount });
    await counts.setJSON(key, {
      count: startCount,
      prev: startCount,
      startCount,
      history: [{ t: now, count: startCount }],
    });

    return json(201, { ok: true });
  }

  return json(405, { error: "Method not allowed." });
};

export const config = { path: "/api/entries" };
