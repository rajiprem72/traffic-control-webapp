let schedule = [];
let player;
let currentItem = null;
let nextDiv = document.getElementById("next");
let logDiv = document.getElementById("log");

// --- Utility Logger ---
function log(msg) {
  const time = new Date().toLocaleTimeString();
  logDiv.textContent += `[${time}] ${msg}\n`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

// --- Load schedule.json (always fresh, bypass cache) ---
async function loadSchedule() {
  try {
    const response = await fetch("schedule.json?nocache=" + Date.now());
    schedule = await response.json();
    log(`📂 Schedule loaded (${schedule.length} items)`);
    updateNextItem();
  } catch (e) {
    log("❌ Failed to load schedule: " + e);
  }
}

// --- YouTube API Ready ---
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "0",  // hidden
    width: "0",   // hidden
    events: {
      onReady: () => log("✅ YouTube Player Ready")
    }
  });
}

// --- Check schedule every 5s ---
setInterval(checkSchedule, 5000);

function checkSchedule() {
  if (!schedule.length) return;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  const item = schedule.find(s => s.time === currentTime);
  if (item && (!currentItem || currentItem.time !== currentTime)) {
    currentItem = item;
    playItem(item);
  }

  updateNextItem();
}

// --- Play item ---
function playItem(item) {
  log(`▶ Playing: ${item.name} (${item.type}) at ${item.time}`);

  if (player && player.loadVideoById) {
    player.loadVideoById(item.videoId);
  }

  // Show replay button
  showReplayButton(item);
}

// --- Show replay button after play ---
function showReplayButton(item) {
  nextDiv.innerHTML = `✅ Last Played: ${item.name} (${item.type}) at ${item.time}`;
  const replayBtn = document.createElement("button");
  replayBtn.textContent = `🔁 Replay ${item.type}`;
  replayBtn.onclick = () => {
    log(`🔁 Replaying: ${item.name}`);
    if (player && player.loadVideoById) {
      player.loadVideoById(item.videoId);
    }
  };
  nextDiv.appendChild(document.createElement("br"));
  nextDiv.appendChild(replayBtn);
}

// --- Show next upcoming item ---
function updateNextItem() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  // Find next item after current time
  const upcoming = schedule.find(s => s.time > currentTime);
  if (upcoming) {
    nextDiv.innerHTML = `⏭ Next: ${upcoming.name} (${upcoming.type}) at ${upcoming.time}`;
  }
}

// --- Notification Permission ---
if (Notification && Notification.permission !== "granted") {
  Notification.requestPermission().then(p => {
    log(`🔔 Notification permission: ${p}`);
  });
} else {
  log(`🔔 Notification permission: ${Notification.permission}`);
}

// --- Start ---
loadSchedule();
