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

    function updateNextSong() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Find next scheduled item
      let nextItem = null;
      for (const item of schedule) {
        const [h, m] = item.time.split(":").map(Number);
        const itemMinutes = h * 60 + m;
        if (itemMinutes > currentMinutes) {
          nextItem = item;
          break;
        }
      }

      // If no future song today, wrap to the first item tomorrow
      if (!nextItem && schedule.length > 0) {
        nextItem = schedule[0];
      }

      if (nextItem) {
        document.getElementById("next").textContent =
          `⏭ Next: ${nextItem.name} at ${nextItem.time}`;
      }
    }

    setInterval(() => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, "0") + ":" +
                          now.getMinutes().toString().padStart(2, "0");

      // Play matching video
      schedule.forEach(item => {
        if (item.time === currentTime) {
          if (Notification.permission === "granted") {
            new Notification("▶ Time to play", { body: item.name });
          }

          document.getElementById("next").textContent =
            `▶ Playing: ${item.name} at ${item.time}`;
          log(`🎵 Playing: ${item.name} (${item.time})`);

          player.loadVideoById(item.videoId);
          player.playVideo();

          // After playing, update to next song
          setTimeout(updateNextSong, 2000);
        }
      });
    }, 60000); // check every minute

    // Show next song immediately at startup
    updateNextSong();
  })
  .catch(err => log("❌ Failed to load JSON: " + err));
