// Scheduled: re-poll every channel, update counts + rolling history.
// "prev" is the count from ~24h ago so the board can show recent movement.
// The history it stores is also your cheat-detector: a vertical jump = bought subs.

import { getStore } from "@netlify/blobs";
import { fetchSubscriberCount } from "./_youtube.mjs";

const DAY = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 200;

export default async () => {
  const roster = getStore("roster");
  const counts = getStore("counts");
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const { blobs } = await roster.list();
  for (const b of blobs) {
    const person = await roster.get(b.key, { type: "json" });
    if (!person?.channelId) continue;

    let count;
    try {
      count = await fetchSubscriberCount(person.channelId);
    } catch {
      continue; // transient; leave last known value
    }
    if (count == null) continue;

    const rec = (await counts.get(b.key, { type: "json" })) || { history: [] };
    const history = [...(rec.history || []), { t: nowIso, count }].slice(-MAX_HISTORY);

    // prev = the sample closest to 24h ago, for the "lately" delta
    const dayAgo = now - DAY;
    let prev = count;
    for (const h of history) {
      if (new Date(h.t).getTime() <= dayAgo) prev = h.count;
    }

    await counts.setJSON(b.key, {
      count,
      prev,
      startCount: rec.startCount ?? count,
      history,
    });
  }

  await counts.setJSON("_meta", { updated: nowIso });
  return new Response("ok");
};

// Netlify cron: every 30 minutes.
export const config = { schedule: "*/30 * * * *" };
