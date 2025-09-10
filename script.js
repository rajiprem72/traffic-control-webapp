let player;

function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

// YouTube IFrame API setup
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "0",
    width: "0",
    events: {
      onReady: () => log("✅ YouTube Player Ready")
    }
  });
}

// Request notification permission
Notification.requestPermission().then(result => {
  log("🔔 Notification permission: " + result);
});

fetch("schedule.json")
  .then(res => res.json())
  .then(schedule => {
    log("📂 Schedule loaded (" + schedule.length + " items)");

    setInterval(() => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, "0") + ":" +
                          now.getMinutes().toString().padStart(2, "0");

      schedule.forEach(item => {
        if (item.time === currentTime) {
          // Send notification
          if (Notification.permission === "granted") {
            new Notification("▶ Time to play", { body: item.name });
          }

          // Update screen
          document.getElementById("next").textContent =
            `▶ Playing: ${item.name} at ${item.time}`;
          log(`🎵 Playing: ${item.name} (${item.time})`);

          // Play video
          player.loadVideoById(item.videoId);
          player.playVideo();
        }
      });
    }, 60000); // check every minute
  })
  .catch(err => log("❌ Failed to load JSON: " + err));
