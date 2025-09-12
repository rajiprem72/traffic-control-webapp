let player;
let schedule = [];
let lastPlayed = null;
let isPlaying = false;
const nextDiv = document.getElementById("next");
const logDiv = document.getElementById("log");

// ---- Logging helper ----
function log(msg) {
  const now = new Date().toLocaleTimeString();
  logDiv.textContent += `[${now}] ${msg}\n`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

// ---- Load schedule with cache-busting ----
async function loadSchedule() {
  try {
    const response = await fetch(`schedule.json?nocache=${Date.now()}`);
    schedule = await response.json();
    log(`📂 Schedule loaded (${schedule.length} items)`);
  } catch (err) {
    log("❌ Failed to load schedule: " + err);
  }
}

// ---- YouTube API Ready ----
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "300",
    width: "100%",
    videoId: "",
    playerVars: { autoplay: 0, controls: 1 },
    events: {
      onReady: () => {
        log("✅ YouTube Player Ready");
        startChecking();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          isPlaying = true;
        } else if (
          event.data === YT.PlayerState.ENDED ||
          event.data === YT.PlayerState.PAUSED
        ) {
          isPlaying = false;
        }
      },
    },
  });
}

// ---- Play Item ----
function playItem(item) {
  if (!item) return;
  lastPlayed = item;
  isPlaying = true;

  log(`▶️ Playing: ${item.name} (${item.type}) at ${item.time}`);

  if (item.type === "video") {
    player.loadVideoById(item.videoId);
  } else {
    // audio-only → hide video but play audio
    player.loadVideoById(item.videoId);
    player.mute();
    player.unMute(); // quick unmute so audio plays without showing video controls
  }

  // show replay button
  showReplayButton(item);
}

// ---- Replay Button ----
function showReplayButton(item) {
  nextDiv.innerHTML = `⏭ Next: ${item.name} (${item.type}) at ${item.time} `;
  const replayBtn = document.createElement("button");
  replayBtn.textContent = `🔁 Replay`;
  replayBtn.onclick = () => playItem(item);
  nextDiv.appendChild(replayBtn);
}

// ---- Check Schedule ----
function checkSchedule() {
  if (isPlaying) {
    // don’t interrupt while playing
    return;
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  // find if something matches now
  const currentItem = schedule.find((item) => item.time === currentTime);

  if (currentItem && lastPlayed !== currentItem) {
    playItem(currentItem);
  } else {
    // show upcoming
    const upcoming = schedule.find((item) => item.time > currentTime);
    if (upcoming) {
      const songName = upcoming.name || "(No name)";
      const songType = upcoming.type || "unknown";
      nextDiv.textContent = `⏭ Next: ${songName} (${songType}) at ${upcoming.time}`;
    } else {
      nextDiv.textContent = "✅ All scheduled items for today are done.";
    }
  }
}

// ---- Start Checking ----
function startChecking() {
  checkSchedule();
  setInterval(checkSchedule, 5000); // check every 5s
}

// ---- Init ----
loadSchedule();
