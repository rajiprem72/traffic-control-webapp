let schedule = [];
let player;
let deferredPrompt = null;

// Utility log function
function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
  console.log(msg);
}

// Install button handler
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById("installBtn");
  installBtn.style.display = "inline-block";
  installBtn.addEventListener("click", async () => {
    installBtn.disabled = true;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    log("📲 Install choice: " + choice.outcome);
    deferredPrompt = null;
  });
});

// YouTube API ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "0",
    width: "0",
    videoId: "",
    playerVars: { autoplay: 0 },
    events: {
      onReady: () => log("✅ YouTube Player Ready"),
    },
  });
}

// Unlock button for mobile autoplay
document.getElementById("unlockAudio").addEventListener("click", () => {
  player.mute();
  player.playVideo();
  setTimeout(() => player.stopVideo(), 300);
  player.unMute();
  document.getElementById("unlockAudio").style.display = "none";
  log("🔓 Audio/Video unlocked for autoplay on mobile");
});

// Load schedule.json
async function loadSchedule() {
  try {
    const res = await fetch("schedule.json");
    schedule = await res.json();
    log(`📂 Schedule loaded (${schedule.length} items)`);
    showNext();
  } catch (e) {
    log("❌ Failed to load schedule.json: " + e);
  }
}

// Show next upcoming item
function showNext() {
  const now = new Date();
  const future = schedule
    .map((item) => {
      const [h, m] = item.time.split(":").map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      if (t < now) t.setDate(t.getDate() + 1);
      return { ...item, date: t };
    })
    .sort((a, b) => a.date - b.date);

  if (future.length > 0) {
    document.getElementById("next").textContent =
      `⏭ Next: ${future[0].title} at ${future[0].time}`;
  }
}

// Check schedule every minute
setInterval(() => {
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const match = schedule.find((item) => item.time === current);
  if (match) {
    playItem(match);
  }
}, 10000); // every 10s for testing

// Play audio/video
function playItem(item) {
  log(`▶ Playing: ${item.title} (${item.type}) at ${item.time}`);
  player.loadVideoById(item.videoId);

  if (item.type === "audio") {
    player.setSize(0, 0); // hide
  } else {
    player.setSize(640, 360); // show
  }

  // Send notification
  if (Notification.permission === "granted") {
    new Notification("▶ Now Playing", {
      body: `${item.title} at ${item.time}`,
    });
  }
}

// Request notification permission
if ("Notification" in window) {
  Notification.requestPermission().then((perm) => {
    log("🔔 Notification permission: " + perm);
  });
}

// Start
loadSchedule();
