let player;
let schedule = [];
let lastPlayed = null;
let isPlaying = false;

function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "200",
    width: "320",
    events: {
      onReady: () => log("✅ YouTube Player Ready"),
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          isPlaying = true;
        } else if (event.data === YT.PlayerState.ENDED || event.data === YT.PlayerState.PAUSED) {
          isPlaying = false;
        }
      },
    },
  });
}

// Ask for notification permission
Notification.requestPermission().then((result) => {
  log("🔔 Notification permission: " + result);
});

// Load schedule.json fresh every time
async function loadSchedule() {
  try {
    const res = await fetch("schedule.json?nocache=" + Date.now());
    schedule = await res.json();
    log(`📂 Schedule loaded (${schedule.length} items)`);
    showNext();
  } catch (e) {
    log("❌ Failed to load schedule.json: " + e);
  }
}

function showNext() {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  const upcoming = schedule.find((item) => item.time >= currentTime);
  const nextDiv = document.getElementById("next");
  if (upcoming) {
    nextDiv.textContent = `⏭ Next: ${upcoming.name} (${upcoming.type}) at ${upcoming.time}`;
  } else {
    nextDiv.textContent = "✅ No more items for today";
  }
}

function playItem(item) {
  if (!player) return;
  log(`▶ Playing: ${item.name} at ${item.time}`);
  lastPlayed = item;

  if (Notification.permission === "granted") {
    new Notification("▶ Now Playing", { body: `${item.name} (${item.type})` });
  }

  // Show replay button
  document.getElementById("replayBtn").style.display = "inline-block";

  if (item.type === "video") {
    player.setSize(320, 200);
  } else {
    player.setSize(0, 0); // hide video, keep audio
  }

  player.loadVideoById(item.videoId);
  player.playVideo();
}

// Replay last item
function replayLast() {
  if (lastPlayed) {
    log(`🔁 Replaying: ${lastPlayed.name} at ${lastPlayed.time}`);
    playItem(lastPlayed);
  }
}

// Main scheduler loop
setInterval(() => {
  if (isPlaying) return; // don't interrupt while playing

  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  schedule.forEach((item) => {
    if (item.time === currentTime) {
      playItem(item);
    }
  });

  showNext();
}, 5000);

// Load on start
loadSchedule();

// Replay button listener
document.addEventListener("DOMContentLoaded", () => {
  const replayBtn = document.createElement("button");
  replayBtn.id = "replayBtn";
  replayBtn.textContent = "🔁 Replay Last";
  replayBtn.style.display = "none";
  replayBtn.onclick = replayLast;
  document.body.insertBefore(replayBtn, document.getElementById("next"));
});
