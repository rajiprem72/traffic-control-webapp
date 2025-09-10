let player;
let lastPlayed = null;
let schedule = [];

// Utility to log messages to page
function log(message) {
  const logDiv = document.getElementById('log');
  logDiv.textContent += message + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Update the "Next" display
function updateNext() {
  if (!schedule.length) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert schedule times into minutes of the day
  const futureItems = schedule
    .map(item => {
      const [h, m] = item.time.split(":").map(Number);
      return { ...item, totalMinutes: h * 60 + m };
    })
    .filter(item => item.totalMinutes > currentMinutes);

  const nextItem = futureItems.length ? futureItems[0] : schedule[0]; // fallback to first of next day

  document.getElementById("next").textContent =
    "Next: " + nextItem.name + " at " + nextItem.time;
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '0',
    width: '0',
    events: {
      onReady: (event) => {
        log("YouTube Player Ready");
        event.target.mute(); // allow autoplay silently
      }
    }
  });
}

// Ask for notification permission
Notification.requestPermission().then(result => {
  log("Notification permission: " + result);
  if (result === "granted") {
    new Notification("Test Notification", { body: "Notifications are working!" });
  }
});

// Load schedule from GitHub
fetch('https://raw.githubusercontent.com/rajiprem72/traffic-control-webapp/main/schedule.json')
  .then(res => res.json())
  .then(data => {
    schedule = data;
    log("Schedule loaded with " + schedule.length + " entries");
    updateNext();

    setInterval(() => {
      const now = new Date();
      const currentTime =
        now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0');

      log("Checking time: " + currentTime);

      schedule.forEach(item => {
        if (item.time === currentTime && lastPlayed !== currentTime) {
          lastPlayed = currentTime;

          // Log with name + time
          log("▶ Playing: " + item.name + " at " + item.time);

          // Send notification
          if (Notification.permission === "granted") {
            new Notification("Time to play video", { body: item.name + " at " + item.time });
          }

          // Play video
          if (player && player.loadVideoById) {
            player.loadVideoById(item.videoId);
            player.unMute();
            player.playVideo();
          } else {
            log("⚠ Player not ready yet");
          }

          // Update upcoming
          updateNext();
        }
      });
    }, 5000); // check every 5 seconds
  })
  .catch(err => log("Failed to load JSON: " + err));
