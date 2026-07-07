# The Thousand

An anonymous race to 1,000 YouTube subscribers. The board shows each
participant's **name and count** — never their channel. One shared **join code**
lets people add themselves once.

## What you need

1. **`YOUTUBE_API_KEY`** — Google Cloud Console → create a project → enable
   **YouTube Data API v3** → *Credentials* → *Create API key*. Free (10k units/day).
2. **`JOIN_CODE`** — any secret word you invent and share with the group.

That's it. Storage uses **Netlify Blobs** (built in, no database signup).

## Run locally

```bash
npm install
cp .env.example .env      # then paste your two values into .env
npm run dev               # opens the site with functions running
```

Without the two values the site still renders in **preview mode** with sample
names so you can judge the design.

## Deploy (free)

1. Push this folder to a Git repo and import it at app.netlify.com, **or** run
   `npx netlify deploy --prod`.
2. In Netlify → *Site settings → Environment variables*, add `YOUTUBE_API_KEY`
   and `JOIN_CODE`.
3. Done. The `refresh` function re-polls every channel every 30 minutes on its
   own (Netlify scheduled function).

## How anonymity works

- The channel ID you enter is written to the private `roster` blob store and is
  used only server-side to call YouTube. It is **never** returned by the public
  API or shown on the page.
- The public `/api/entries` response contains only `{ name, count, prev }`.

## How cheating is discouraged

- **Join code** keeps strangers from adding rows.
- **Duplicate names are rejected**, and the roster is small enough that a bogus
  entry is visible to everyone.
- Every poll appends to a per-person **history**. Legit growth is gradual; a
  vertical jump (e.g. +300 overnight) is bought subscribers and stands out.
  YouTube also purges fake subs on its own, so the count tends to fall back.

## Files

| File | Purpose |
|------|---------|
| `index.html`, `styles.css`, `app.js` | The board + add-entry dialog |
| `netlify/functions/entries.mjs` | GET board / POST add entry |
| `netlify/functions/refresh.mjs` | Scheduled re-poll + history |
| `netlify/functions/_youtube.mjs` | YouTube API helpers |
