# The Thousand — full setup guide

Everything you need to take this from a folder on your desktop to a live
website your friends can use. All of it is **free**. Follow the parts in order.
Set aside about 20–30 minutes the first time.

At the end you'll have:
- A public web address (like `the-thousand.netlify.app`).
- A secret join code you share only with the group.
- Live subscriber counts that update by themselves every 30 minutes.

---

## Part A — Get your YouTube API key (about 5 min)

This key lets the site read subscriber counts from YouTube. It's free.

1. Go to **https://console.cloud.google.com** and sign in with any Google
   account.
2. At the very top, click the **project dropdown** (says "Select a project")
   → **New Project**.
   - Name: `the-thousand` (or anything).
   - Click **Create**, wait a few seconds, then make sure that project is
     selected in the top dropdown.
3. In the search bar at the top, type **YouTube Data API v3** and click the
   result. On its page, click the blue **Enable** button.
4. On the left, open the menu (☰) → **APIs & Services** → **Credentials**.
5. Click **+ Create Credentials** (top) → **API key**.
6. A box pops up with your key — a long string like `AIzaSy...`. Click
   **Copy**. Paste it somewhere safe for a minute (a notes app).
7. *(Recommended, optional)* In that same box click **Edit API key** →
   under **API restrictions** choose **Restrict key** → tick
   **YouTube Data API v3** → **Save**. This stops anyone who finds the key
   from using it for anything else.

> You do **not** need to enter a credit card. The free quota (10,000 units a
> day) is far more than this site uses.

**You now have:** `YOUTUBE_API_KEY` = the string you copied.

---

## Part B — Choose your join code (30 sec)

This is any secret word you make up. Anyone who has it can add themselves to
the board once, so share it only in your group chat.

- Example: `hotdog-season`, `october-run`, `secret-handshake`.

**You now have:** `JOIN_CODE` = your word.

Keep both values together for Part D:
```
YOUTUBE_API_KEY = AIzaSy...your key...
JOIN_CODE       = your-secret-word
```

---

## Part C — Put the site online with Netlify (about 10 min)

Netlify is the free host. Pick **one** of the two options below.
Option 1 auto-updates whenever you change the site; Option 2 is fewer steps
but you re-run a command to push changes. Both make the auto-refresh work.

### Option 1 — GitHub + Netlify (recommended)

**C1. Make a GitHub account & repo**
1. Sign up free at **https://github.com**.
2. Click **+** (top right) → **New repository**.
   - Name: `the-thousand`.
   - Keep it **Public** or **Private** (either works).
   - Do **not** add a README (we already have one).
   - Click **Create repository**. Leave that page open — you'll need the
     commands it shows.

**C2. Upload this folder to the repo**

Easiest, no terminal — **GitHub Desktop**:
1. Download **https://desktop.github.com**, install, sign in.
2. **File → Add Local Repository** → choose the `challenge` folder →
   it'll offer to create a repository here → do it.
3. Enter a summary like `first version`, click **Commit to main**.
4. Click **Publish repository** (pick the repo you made) → done.

Or with the terminal (if you prefer commands):
```bash
cd /Users/armaankhan/Desktop/challenge
git init
git add .
git commit -m "The Thousand"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/the-thousand.git
git push -u origin main
```

**C3. Connect Netlify**
1. Go to **https://app.netlify.com** → **Sign up** → **Sign in with GitHub**
   (easiest).
2. Click **Add new site** → **Import an existing project** → **GitHub**.
3. Authorize Netlify, then pick your `the-thousand` repo.
4. Don't change any build settings — the included `netlify.toml` handles
   everything. Click **Deploy**.
5. Wait ~1 minute. You'll get a URL like
   `https://random-name-123.netlify.app`. (You can rename it in
   **Site configuration → Change site name**.)

### Option 2 — Netlify CLI (no GitHub)

1. Make sure Node is available in your terminal. On this machine Node lives in
   a custom folder, so run this first (or add it to your shell profile):
   ```bash
   export PATH="/Users/armaankhan/node-env/node-v22.12.0-darwin-arm64/bin:$PATH"
   ```
2. Deploy straight from the folder:
   ```bash
   cd /Users/armaankhan/Desktop/challenge
   npx netlify-cli deploy --prod
   ```
3. It opens a browser to log in / create a free Netlify account, asks a couple
   of questions (create a new site, publish directory = `.`), then uploads and
   prints your live URL.
4. To push a future change, run the same `npx netlify-cli deploy --prod` again.

---

## Part D — Add your two secret values to Netlify (2 min)

The site is live now but counts won't load until you give it the key + code.

1. In Netlify, open your site → **Site configuration** →
   **Environment variables**.
2. Click **Add a variable** → **Add a single variable**:
   - Key: `YOUTUBE_API_KEY`  ·  Value: *(paste your key)*  → **Create**.
3. Do it again:
   - Key: `JOIN_CODE`  ·  Value: *(your secret word)*  → **Create**.
4. Re-deploy so they take effect: **Deploys** tab → **Trigger deploy** →
   **Deploy site**. Wait ~1 min.

---

## Part E — Test it (2 min)

1. Open your live URL. You should see **"No entries yet"**.
2. Click **Add entry**. Fill in:
   - **Join code**: your secret word.
   - **Display name**: your name/alias.
   - **Channel ID or link**: paste your channel link — any of these work:
     `https://youtube.com/@yourhandle`, `https://youtube.com/channel/UC…`, or
     just `UC…`.
3. Click **Enter**. Within a moment your name appears with your real
   subscriber count. If it does — everything works. 🎉

If you get "That channel hides its subscriber count," open YouTube Studio →
**Settings → Channel → Advanced → make your subscriber count public**, then
try again.

---

## Part F — Share with your friends

Send the group two things:
- The **URL** of the site.
- The **join code**.

Each person clicks **Add entry** once and adds themselves. Counts refresh on
their own every 30 minutes; the board re-sorts automatically. First to 1,000
wins.

---

## Part G — (Optional) a nicer address

- **Free:** rename the site in **Site configuration → Change site name** to
  get `the-thousand.netlify.app` or similar.
- **Custom domain (paid ~$10/yr):** if you buy a domain, add it under
  **Domain management** and follow Netlify's instructions.

---

## Reminders about privacy & fairness

- The channel link each person enters is stored on the server **only** to read
  their count. It is **never shown** on the site. The only person who could
  see the raw stored channels is whoever logs into this Netlify account (you).
- The join code keeps strangers out. Duplicate names are blocked. The site
  quietly records each channel's count history, so a sudden unnatural jump
  (bought subscribers) is easy to spot later.

## Troubleshooting

| Problem | Fix |
|---|---|
| Counts don't load | Check the two env vars are spelled exactly right, then re-deploy. |
| "That join code is not right" | The `JOIN_CODE` value must match what people type, exactly. |
| A channel won't add | Its subscriber count is hidden — make it public in YouTube Studio. |
| Nothing updates after 30 min | Open **Deploys → Functions** in Netlify and check `refresh` ran. |
