let player;
let schedule = [];
let lastPlayed = null;
let currentIndex = -1;

// YouTube API ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "200",
    width: "300",
    events: {
      onReady: () => log("✅ YouTube Player Ready"),
    },
  });
}

// Utility log function
function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
  console.log(msg);
}

// Notification
function notify(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// Show replay button
function showReplayButton(item) {
  const nextDiv = document.getElementById("next");
  nextDiv.innerHTML = `
    ⏮ Missed: ${item.name} (${item.type}) 
    <button onclick='replayItem(${JSON.stringify(item)})'>▶ Replay</button>
  `;
}

// Replay function
function replayItem(item) {
  log(`🔁 Replaying: ${item.name} (${item.type})`);

  if (player && player.loadVideoById) {
    player.loadVideoById(item.videoId);
  }

  // Toggle player visibility
  const playerDiv = document.getElementById("player");
  if (item.type === "video") {
    playerDiv.style.display = "block";
  } else {
    playerDiv.style.display = "none";
  }
}

// Play scheduled item
function playItem(item) {
  log(`▶ Playing: ${item.name} (${item.type}) at ${item.time}`);
  notify("▶ Now Playing", `${item.name} (${item.type})`);

  if (player && player.loadVideoById) {
    player.loadVideoById(item.videoId);
  }

  // Toggle player visibility
  const playerDiv = document.getElementById("player");
  if (item.type === "video") {
    playerDiv.style.display = "block"; // show video
  } else {
    playerDiv.style.display = "none";  // hide video
  }

  // Save last played
  lastPlayed = item;
  showReplayButton(item);
}

// Find next item
function updateNextItem() {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  const upcoming = schedule.find((item) => item.time > currentTime);

  const nextDiv = document.getElementById("next");
  if (upcoming) {
    nextDiv.innerHTML = `⏭ Next: ${upcoming.name} (${upcoming.type}) at ${upcoming.time}`;
  } else {
    nextDiv.innerHTML = "✅ All items done for today";
  }
}

// Main scheduler loop
function checkSchedule() {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  const item = schedule.find((entry) => entry.time === currentTime);

  if (item && (!lastPlayed || lastPlayed.time !== item.time)) {
    playItem(item);
  }

  updateNextItem();
}

// Fetch schedule.json
function loadSchedule() {
  fetch("schedule.json?cache=" + Date.now()) // cache-buster
    .then((res) => res.json())
    .then((data) => {
      schedule = data;
      log(`📂 Schedule loaded (${schedule.length} items)`);

      updateNextItem();
    })
    .catch((err) => log("❌ Failed to load schedule: " + err));
}

// Ask permission for notifications
if (Notification.permission !== "granted") {
  Notification.requestPermission().then((p) =>
    log("🔔 Notification permission: " + p)
  );
} else {
  log("🔔 Notification permission: granted");
}

// Load schedule
loadSchedule();

// Check every 30s
setInterval(checkSchedule, 30000);
