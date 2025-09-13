// ========== Helper Functions ==========
function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

async function fetchSchedule() {
  try {
    const res = await fetch("schedule.json");
    return await res.json();
  } catch (e) {
    log("❌ Failed to load schedule.json: " + e);
    return [];
  }
}

// ========== Video Playback ==========
function playVideo(item) {
  const player = document.getElementById("videoPlayer");
  player.src = item.file;
  player.play()
    .then(() => log("▶️ Playing: " + item.name))
    .catch(err => log("⚠️ Play failed: " + err));

  // Notification
  if ("Notification" in window && Notification.permission === "granted") {
    const notif = new Notification("📺 Now Playing", {
      body: item.name,
      requireInteraction: true
    });

    notif.onclick = () => {
      player.currentTime = 0;
      player.play();
      log("🔁 Replay clicked for: " + item.name);
    };
  }
}

// ========== Schedule Checker ==========
async function startScheduler() {
  const schedule = await fetchSchedule();

  // Show schedule in UI
  const list = document.getElementById("scheduleList");
  list.innerHTML = "";
  schedule.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.time} → ${item.name}`;
    list.appendChild(li);
  });

  // Check every 30 sec
  setInterval(() => {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5); // HH:MM

    schedule.forEach(item => {
      if (item.time === hhmm) {
        playVideo(item);
      }
    });
  }, 30000);
}

// ========== Notifications Permission ==========
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// ========== Install PWA ==========
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    log("📲 Install outcome: " + outcome);
    deferredPrompt = null;
    installBtn.style.display = "none";
  }
});

// ========== Service Worker ==========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => log("✅ Service Worker registered"))
    .catch(err => log("❌ SW registration failed: " + err));
}

// Start
startScheduler();
