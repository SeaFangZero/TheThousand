// Shared YouTube Data API v3 helpers. The API key stays server-side only.

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY || "";

// Accepts any of:
//   UCxxxxxxxxxxxxxxxxxxxxxx        (raw channel id)
//   youtube.com/channel/UCxxxx...
//   youtube.com/@handle  or  @handle
//   youtube.com/c/Name  or  youtube.com/user/Name  (legacy)
export async function resolveChannelId(input) {
  const s = input.trim();

  const idMatch = s.match(/(UC[0-9A-Za-z_-]{22})/);
  if (idMatch) return idMatch[1];

  let handle = null;
  const atMatch = s.match(/@([A-Za-z0-9._-]+)/);
  if (atMatch) handle = atMatch[1];

  if (handle) {
    const r = await fetch(`${API}/channels?part=id&forHandle=@${encodeURIComponent(handle)}&key=${KEY}`);
    const j = await r.json();
    if (j.items && j.items[0]) return j.items[0].id;
  }

  // legacy /c/ or /user/ or a bare word -> search fallback
  const legacy = s.match(/(?:\/c\/|\/user\/)([A-Za-z0-9._-]+)/);
  const term = legacy ? legacy[1] : (handle || s);
  const sr = await fetch(`${API}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(term)}&key=${KEY}`);
  const sj = await sr.json();
  if (sj.items && sj.items[0]) return sj.items[0].snippet.channelId;

  return null;
}

// Returns an integer, or null if the channel hides its count.
export async function fetchSubscriberCount(channelId) {
  const r = await fetch(`${API}/channels?part=statistics&id=${encodeURIComponent(channelId)}&key=${KEY}`);
  const j = await r.json();
  const stats = j.items && j.items[0] && j.items[0].statistics;
  if (!stats) return null;
  if (stats.hiddenSubscriberCount) return null;
  const n = Number(stats.subscriberCount);
  return Number.isFinite(n) ? n : null;
}
