// =======================
// CONFIG
// =======================
//
// Feb 28, 2026 — 11:30 PM EST
// = Mar 1, 2026 04:30 UTC
const TARGET = Date.UTC(2026, 2, 1, 4, 30, 0);

// =======================
// ELEMENTS
// =======================

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const statusText = document.getElementById("statusText");
const ticker = document.getElementById("tickerText");

const audio = document.getElementById("anthem");

const toggleBtn = document.getElementById("toggleAudio");
const shareBtn = document.getElementById("shareBtn");
const calendarBtn = document.getElementById("calendarBtn");

// =======================
// HELPERS
// =======================

function pad(n) {
  return String(n).padStart(2, "0");
}

function setToggle(isPlaying) {
  if (!toggleBtn) return;
  toggleBtn.textContent = isPlaying ? "⏸ PAUSE" : "▶︎ PLAY";
}

// =======================
// AUDIO (autoplay muted, unmute on first interaction)
// =======================

async function startAudio(unmute = false) {
  try {
    if (!audio) return false;

    if (unmute) audio.muted = false;

    await audio.play();
    setToggle(!audio.paused);
    return true;
  } catch {
    setToggle(false);
    return false;
  }
}

// Try autoplay immediately on load (muted autoplay)
window.addEventListener("load", () => {
  startAudio(false);
});

// Unmute on *any* first interaction — whichever happens first
function unmuteOnce() {
  startAudio(true);
}

["pointerdown", "pointermove", "touchstart", "keydown", "scroll"].forEach(evt => {
  window.addEventListener(evt, unmuteOnce, { once: true });
});

// Manual play / pause button
toggleBtn?.addEventListener("click", async () => {
  if (!audio) return;

  if (audio.paused) {
    await startAudio(true);
  } else {
    audio.pause();
    setToggle(false);
  }
});

// Loop safety (some browsers ignore loop attribute)
audio?.addEventListener("ended", () => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
});

// =======================
// CALENDAR (.ics + Google fallback)
// =======================

function downloadICS() {
  const dtStart = "20260301T043000Z";
  const dtEnd = "20260301T060000Z";

  const title = "Connor Storrie on SNL";
  const description = "Countdown: https://amandawinkler.space/cottage";
  const location = "Saturday Night Live (NBC)";

  const dtstamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Amanda//Connor SNL//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@amandawinkler.space
DTSTAMP:${dtstamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "connor-storrie-snl.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {}

  const gcalUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${dtStart}/${dtEnd}` +
    `&details=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(location)}`;

  if (window.matchMedia("(min-width: 769px)").matches) {
    setTimeout(() => {
      window.open(gcalUrl, "_blank", "noopener,noreferrer");
    }, 400);
  }
}

calendarBtn?.addEventListener("click", downloadICS);

// =======================
// SHARE / COPY LINK
// =======================

shareBtn?.addEventListener("click", async () => {
  const url =
    window.location.href.startsWith("http")
      ? window.location.href
      : `https://${window.location.host}${window.location.pathname}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url });
      const prev = ticker.textContent;
      ticker.textContent = "✅ SHARED";
      setTimeout(() => (ticker.textContent = prev), 1200);
      return;
    } catch {}
  }

  try {
    await navigator.clipboard.writeText(url);
    const prev = ticker.textContent;
    ticker.textContent = "✅ LINK COPIED";
    setTimeout(() => (ticker.textContent = prev), 1200);
    return;
  } catch {}

  try {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);

    const prev = ticker.textContent;
    ticker.textContent = "✅ LINK COPIED";
    setTimeout(() => (ticker.textContent = prev), 1200);
  } catch {
    const prev = ticker.textContent;
    ticker.textContent = "Copy failed — manually copy URL.";
    setTimeout(() => (ticker.textContent = prev), 1600);
  }
});

// =======================
// COUNTDOWN
// =======================

function updateCountdown() {
  const diff = TARGET - Date.now();

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";

    if (statusText) statusText.textContent = "LIVE";
    if (ticker) ticker.textContent = "🚨 LIVE NOW: Connor Storrie is on SNL.";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);

  if (statusText && !statusText.textContent) {
    statusText.textContent = "SCHEDULED";
  }
}

// =======================
// INIT
// =======================

updateCountdown();
setInterval(updateCountdown, 1000);
