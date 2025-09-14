let schedule = [];
let currentIndex = -1;
let player;

// Load YouTube IFrame API
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    playerVars: { autoplay: 0, controls: 1 },
    events: {
      onReady: () => log("✅ YouTube Player Ready"),
    },
  });
}

// Fetch schedule.json
async function loadSchedule() {
  try {
    log("📂 Loading schedule...");
    const response = await fetch("schedule.json");
    if (!response.ok) throw new Error("Schedule fetch failed");
    schedule = await response.json();

    if (Array.isArray(schedule) && schedule.length > 0) {
      log(`✅ Loaded ${schedule.length} schedule items`);
      displaySchedule();
      updateNextVideo();
      checkSchedule(); 
      setInterval(() => {
        checkSchedule();
        updateNextVideo();
      }, 60000); // check every minute
    } else {
      log("⚠️ Schedule is empty or not valid");
    }
  } catch (err) {
    log("❌ Error loading schedule: " + err.message);
  }
}

// Display schedule list
function displaySchedule() {
  const list = document.getElementById("scheduleList");
  if (!list) return;
  list.innerHTML = ""; 

  schedule.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.time} → ${item.name}`;
    list.appendChild(li);
  });
}

// Show upcoming video
function updateNextVideo() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  // find the next item after current time
  const nextItem = schedule.find(item => item.time > currentTime);

  const nextDiv = document.getElementById("nextVideo");
  if (nextDiv) {
    if (nextItem) {
      nextDiv.textContent = `⏭ Next: ${nextItem.name} at ${nextItem.time}`;
    } else {
      nextDiv.textContent = "✅ All scheduled videos for today are done.";
    }
  }
}

// Check schedule and play if time matches
function checkSchedule() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  const nextIndex = schedule.findIndex((item) => item.time === currentTime);

  if (nextIndex !== -1 && nextIndex !== currentIndex) {
    currentIndex = nextIndex;
    playItem(schedule[nextIndex]);
  }
}

// Play selected item
function playItem(item) {
  log(`▶ Playing: ${item.name} at ${item.time}`);

  if (item.videoId) {
    document.getElementById("playerContainer").style.display = "block";
    player.loadVideoById(item.videoId);
    sendNotification(`▶ Now Playing: ${item.name}`);
  } else {
    log("⚠️ Invalid video ID");
  }
}

// Send browser notification
function sendNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("Scheduled Player", { body: message });
  }
}

// Log helper
function log(message) {
  console.log(message);
  const logBox = document.getElementById("log");
  if (logBox) {
    logBox.innerHTML += `<div>${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }
}

// Ask for notification permission
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Init
window.onload = () => {
  loadSchedule();
};
