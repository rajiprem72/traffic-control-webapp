let schedule = [];
let player;
let unlocked = false;
let lastPlayed = null;
let isPlaying = false;

const logDiv = document.getElementById("log");
const nextDiv = document.getElementById("next");
const replayBtn = document.getElementById("replayBtn");

function log(msg) {
  console.log(msg);
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Load schedule (no-cache)
async function loadSchedule() {
  try {
    const res = await fetch("schedule.json?nocache=" + Date.now());
    schedule = await res.json();
    log(`📂 Schedule loaded (${schedule.length} items)`);
    renderScheduleList();
    updateNext();
    await scheduleNotifications(); // schedule notifications
  } catch (e) {
    log("❌ Failed to load schedule: " + e);
  }
}

// Render full schedule list
function renderScheduleList() {
  const listDiv = document.getElementById("scheduleList");
  if (!listDiv) return;
  listDiv.innerHTML = "";
  schedule.forEach(item => {
    const div = document.createElement("div");
    div.textContent = `${item.name} - ${item.time}`;
    listDiv.appendChild(div);
  });
}

// Show next item
function updateNext() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const nextItem = schedule.find(item => item.time >= hhmm);

  if (nextItem) {
    nextDiv.textContent = `⏭ Next: ${nextItem.name} at ${nextItem.time}`;
  } else {
    nextDiv.textContent = "✅ All items for today are done.";
  }
}

// Check schedule every 5s
setInterval(() => {
  if (!unlocked || isPlaying) return;

  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);

  const match = schedule.find(item => item.time === hhmm);
  if (match) {
    playItem(match);
  } else {
    updateNext();
  }
}, 5000);

// Play scheduled item
function playItem(item) {
  log(`▶ Playing: ${item.name} at ${item.time}`);
  lastPlayed = item;
  replayBtn.style.display = "inline-block";

  const playerDiv = document.getElementById("player");
  playerDiv.style.display = "block"; // show iframe only when playing

  player.loadVideoById(item.videoId);
  isPlaying = true;
  player.playVideo();
}

// Replay button
replayBtn.addEventListener("click", () => {
  if (lastPlayed) {
    playItem(lastPlayed);
  }
});

// Unlock audio/video
document.getElementById("unlockAudio").addEventListener("click", () => {
  unlocked = true;
  log("🔓 Audio/Video unlocked by user");
  alert("Audio/Video enabled. The schedule will now play automatically.");
});

// YouTube Iframe API ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "315",
    width: "560",
    videoId: "",
    events: {
      onReady: () => {
        log("✅ YouTube Player Ready");
        loadSchedule();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          isPlaying = false;
          document.getElementById("player").style.display = "none";
          log("⏹ Playback finished");
        }
        if (event.data === YT.PlayerState.PLAYING) {
          isPlaying = true;
        }
      }
    }
  });
}

// ==================== Notifications ==================== //
async function scheduleNotifications() {
  if (!("Notification" in window)) {
    log("❌ Notifications not supported");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    log("❌ Notifications denied");
    return;
  }

  schedule.forEach(item => {
    const [hh, mm] = item.time.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);

    if (target > now) {
      const delay = target.getTime() - now.getTime();
      setTimeout(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.showNotification("🎵 Scheduled Player", {
              body: `${item.name} is scheduled now (${item.time})`,
              icon: "icon-192.png",
              vibrate: [200, 100, 200]
            });
          }
        });
      }, delay);
    }
  });
}
