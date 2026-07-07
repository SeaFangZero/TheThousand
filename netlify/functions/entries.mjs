// GET    /api/entries -> public board: [{ name, count, prev }]  (NO channel IDs)
// POST   /api/entries -> add one entry     { code, name, channel }
// DELETE /api/entries -> remove one entry  { code, name }  (organizer/self cleanup)
//
// Storage: Netlify Blobs. Two stores:
//   "roster"  key -> { name, channelId, joinedAt, startCount }   (private; channel never leaves here)
//             "__index__" -> [key, key, ...]                      (the authoritative list of entries)
//   "counts"  key -> { count, prev, startCount, history:[...] }   (public-safe numbers)
//             "_meta" -> { updated }
//
// Netlify Blobs reads are eventually consistent by default, so `list()` lags and
// stale reads can miss a just-written key. We keep an explicit __index__ and read
// it (and the dedupe check) with { consistency: "strong" } for read-after-write.

import { getStore } from "@netlify/blobs";
import { resolveChannelId, fetchSubscriberCount } from "./_youtube.mjs";

const JOIN_CODE = process.env.JOIN_CODE || "";
const MAX_NAME = 24;
const INDEX = "__index__";
const STRONG = { type: "json", consistency: "strong" };

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

export default async (req) => {
  const roster = getStore("roster");
  const counts = getStore("counts");

  if (req.method === "GET") {
    const index = (await roster.get(INDEX, STRONG)) || [];
    const entries = [];
    for (const key of index) {
      const person = await roster.get(key, STRONG);
      if (!person) continue;
      const c = (await counts.get(key, { type: "json" })) || {};
      const count = c.count ?? person.startCount ?? 0;
      const prev = c.prev ?? count;
      entries.push({ name: person.name, count, prev });
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
    const index = (await roster.get(INDEX, STRONG)) || [];
    if (index.includes(key)) return json(409, { error: "That name is already on the board." });

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
      count: startCount, prev: startCount, startCount,
      history: [{ t: now, count: startCount }],
    });

    // add to the index (re-read strong to shrink the race window)
    const idx = (await roster.get(INDEX, STRONG)) || [];
    if (!idx.includes(key)) { idx.push(key); await roster.setJSON(INDEX, idx); }

    return json(201, { ok: true });
  }

  if (req.method === "DELETE") {
    let payload;
    try { payload = await req.json(); } catch { return json(400, { error: "Bad request." }); }
    const code = String(payload.code || "").trim();
    const name = String(payload.name || "").trim();

    if (!JOIN_CODE) return json(500, { error: "Registration is not configured yet." });
    if (code !== JOIN_CODE) return json(403, { error: "That join code is not right." });
    if (!name) return json(400, { error: "A name is required." });

    const key = name.toLowerCase();
    await roster.delete(key);
    await counts.delete(key);
    const idx = (await roster.get(INDEX, STRONG)) || [];
    await roster.setJSON(INDEX, idx.filter((k) => k !== key));
    return json(200, { ok: true });
  }

  return json(405, { error: "Method not allowed." });
};

export const config = { path: "/api/entries" };
