// The Thousand — front end
// Renders the board from /api/entries. Falls back to sample data so the
// page is viewable before the backend is wired up.

const GOAL = 1000;

const SAMPLE = {
  updated: null,
  entries: [
    { name: "Marlow",     count: 812, prev: 771 },
    { name: "The Kestrel", count: 640, prev: 640 },
    { name: "Odette",     count: 590, prev: 522 },
    { name: "Ninth Street", count: 431, prev: 419 },
    { name: "Bram",       count: 288, prev: 240 },
    { name: "Halcyon",    count: 154, prev: 149 },
    { name: "Quiet Dog",  count: 61,  prev: 61 },
  ],
};

const fmt = (n) => n.toLocaleString("en-US");

function relTime(iso) {
  if (!iso) return "Preview data";
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `Updated ${hrs} hr ago`;
}

function render(data) {
  const board = document.getElementById("board");
  const entries = [...data.entries].sort((a, b) => b.count - a.count);

  const n = entries.length;

  if (!n) {
    board.innerHTML =
      `<div class="empty">
        <p class="empty-title">No entries yet</p>
        <p class="empty-sub">Be the first on the board. Press <em>Add entry</em> to join the race to 1,000.</p>
        <button class="btn-add empty-cta" id="emptyAdd" type="button">Add entry</button>
      </div>`;
    document.getElementById("emptyAdd").addEventListener("click", openDialog);
    return;
  }

  const topCount = entries[0].count;
  board.innerHTML = entries.map((e, i) => {
    const pct = Math.min(100, (e.count / GOAL) * 100);
    const gain = e.count - (e.prev ?? e.count);
    const won = e.count >= GOAL;
    const leader = i === 0 && !won && topCount > 0;
    const cls = ["row", won ? "won" : "", leader ? "leader" : ""].join(" ").trim();

    const tag = won ? `<span class="tag win">Finished</span>`
      : leader ? `<span class="tag">Leader</span>` : "";

    const gainText = gain > 0
      ? `<span class="gain up"><span class="arw"></span>${fmt(gain)} this week</span>`
      : gain < 0
        ? `<span class="gain down"><span class="arw"></span>${fmt(Math.abs(gain))} this week</span>`
        : `<span class="gain">No change this week</span>`;

    return `
      <div class="${cls}">
        <div class="row-head">
          <div class="ident">
            <span class="rank">${String(i + 1).padStart(2, "0")}</span>
            <span class="name">${escapeHtml(e.name)}</span>
            ${tag}
          </div>
          <div class="count"><span class="num">${fmt(e.count)}</span><span class="goal">/ ${fmt(GOAL)}</span></div>
        </div>
        <div class="track"><div class="fill" data-pct="${pct}"></div></div>
        <div class="row-foot">
          ${gainText}
          <span class="pct">${Math.round(pct)}%</span>
        </div>
      </div>`;
  }).join("");

  // animate fills after paint
  requestAnimationFrame(() => {
    document.querySelectorAll(".fill").forEach((el) => {
      el.style.width = el.dataset.pct + "%";
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function load() {
  try {
    const res = await fetch("/api/entries", { cache: "no-store" });
    if (!res.ok) throw new Error("no backend");
    const data = await res.json();
    render(data);
  } catch {
    render(SAMPLE); // preview mode
  }
}

/* ---- Theme toggle ---- */
const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");
if (storedTheme === "light" || storedTheme === "dark") root.dataset.theme = storedTheme;

function currentTheme() {
  if (root.dataset.theme) return root.dataset.theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
document.getElementById("themeToggle").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
});

/* ---- Add-entry dialog ---- */
const scrim = document.getElementById("scrim");
const form = document.getElementById("addForm");
const msg = document.getElementById("formMsg");

function openDialog() { scrim.hidden = false; form.querySelector("input").focus(); }
function closeDialog() { scrim.hidden = true; msg.hidden = true; form.reset(); }

document.getElementById("openAdd").addEventListener("click", openDialog);
document.getElementById("cancelAdd").addEventListener("click", closeDialog);
scrim.addEventListener("click", (e) => { if (e.target === scrim) closeDialog(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !scrim.hidden) closeDialog(); });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitAdd");
  const payload = Object.fromEntries(new FormData(form).entries());
  msg.hidden = true;
  btn.disabled = true;
  btn.textContent = "Checking…";
  try {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "Could not add you. Try again.");
    closeDialog();
    load();
  } catch (err) {
    msg.textContent = err.message;
    msg.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Enter";
  }
});

load();
setInterval(load, 60000); // re-pull the board every minute
