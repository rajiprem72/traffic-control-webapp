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
    updateNext();
  } catch (e) {
    log("❌ Failed to load schedule: " + e);
  }
}

// Show next item
function updateNext() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const nextItem = schedule.find(item => item.time >= hhmm);

  if (nextItem) {
    nextDiv.textContent = `⏭ Next: ${nextItem.name} (${nextItem.type}) at ${nextItem.time}`;
  } else {
    nextDiv.textContent = "✅ All items for today are done.";
  }
}

// Check schedule every 5s
setInterval(() => {
  if (!unlocked || isPlaying) return; // don’t restart if playing

  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);

  const match = schedule.find(item => item.time === hhmm);
  if (match) {
    playItem(match);
  } else {
    updateNext();
  }
}, 5000);

// Play a scheduled item
function playItem(item) {
  log(`▶ Playing: ${item.name} (${item.type}) at ${item.time}`);
  lastPlayed = item;
  replayBtn.style.display = "inline-block";

  if (item.type === "audio") {
    document.getElementById("player").style.display = "none";
    player.loadVideoById(item.videoId);
  } else {
    document.getElementById("player").style.display = "block";
    player.loadVideoById(item.videoId);
  }
  isPlaying = true;
  player.playVideo();
}

// Replay button
replayBtn.addEventListener("click", () => {
  if (lastPlayed) {
    playItem(lastPlayed);
  }
});

// Unlock audio/video button
document.getElementById("unlockAudio").addEventListener("click", () => {
  unlocked = true;
  log("🔓 Audio/Video unlocked by user");
  alert("Audio/Video enabled. The schedule will now play automatically.");
});

// YouTube Iframe API ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "0",
    width: "0",
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
