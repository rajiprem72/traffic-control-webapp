let schedule = [];
let lastPlayed = null;
let player;
let replayButton;

async function loadSchedule() {
  try {
    const response = await fetch("schedule.json?nocache=" + Date.now()); // avoid cache
    schedule = await response.json();
    log("✅ Schedule loaded");
  } catch (err) {
    log("❌ Error loading schedule: " + err);
  }
}

function init() {
  loadSchedule();
  setInterval(checkSchedule, 1000);
  replayButton = document.getElementById("replayButton");
}

function log(msg) {
  console.log(msg);
  const logDiv = document.getElementById("log");
  if (logDiv) {
    logDiv.innerHTML = msg;
  }
}

function notify(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function createPlayer(videoId, type) {
  if (player && player.destroy) {
    player.destroy();
  }

  player = new YT.Player("player", {
    height: type === "video" ? "200" : "0",
    width: type === "video" ? "300" : "0",
    videoId: videoId,
    events: {
      onReady: () => {
        player.playVideo();
        log("▶ Playing now...");
      },
      onError: (e) => log("❌ Player error: " + e.data),
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          log("⏹ Finished: " + lastPlayed.name);
          document.getElementById("player").style.display = "none"; // auto-hide
        }
      },
    },
  });

  const playerDiv = document.getElementById("player");
  if (type === "video") {
    playerDiv.style.display = "block";
  } else {
    playerDiv.style.display = "none";
  }
}

function playItem(item) {
  log(`▶ Playing: ${item.name} (${item.type}) at ${item.time}`);
  notify("▶ Now Playing", `${item.name} (${item.type})`);

  createPlayer(item.videoId, item.type);

  lastPlayed = item;
  showReplayButton(item);
  updateNextItem(item);
}

function replayItem(item) {
  log(`🔁 Replaying: ${item.name} (${item.type})`);
  createPlayer(item.videoId, item.type);
}

function showReplayButton(item) {
  if (replayButton) {
    replayButton.style.display = "inline-block";
    replayButton.innerText = `▶ Replay: ${item.name} (${item.type})`;
    replayButton.onclick = () => replayItem(item);
  }
}

function updateNextItem(currentItem) {
  const index = schedule.findIndex((i) => i.time === currentItem.time);
  const next = schedule[index + 1];
  const nextDiv = document.getElementById("next");
  if (nextDiv) {
    if (next) {
      nextDiv.innerText = `⏭ Next: ${next.name} (${next.type}) at ${next.time}`;
    } else {
      nextDiv.innerText = "✅ End of today's schedule";
    }
  }
}

function checkSchedule() {
  if (!schedule || schedule.length === 0) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  const item = schedule.find((i) => i.time === currentTime);

  if (item && (!lastPlayed || lastPlayed.time !== item.time)) {
    playItem(item);
  }
}

window.onload = () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  init();
};
