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
    renderScheduleList();
    updateNext();
  } catch (e) {
    log("❌ Failed to load schedule: " + e);
  }
}

// Render full schedule
function renderScheduleList() {
  const listDiv = document.getElementById("scheduleList");
  listDiv.innerHTML = "";
  schedule.forEach(item => {
    const div = document.createElement("div");
    div.textContent = `${item.name} - ${item.time}`;
    listDiv.appendChild(div);
  });
}

// Show next item
function updateNext() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const nextItem = schedule.find(item => item.time >= hhmm);

  if (nextItem) {
    nextDiv.textContent = `⏭ Next: ${nextItem.name} at ${nextItem.time}`;
  } else {
    nextDiv.textContent = "✅ All items for today are done.";
  }
}

// Check schedule every 5s
setInterval(() => {
  if (!unlocked || isPlaying) return; // don’t restart if already playing

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
  log(`▶ Playing: ${item.name} at ${item.time}`);
  lastPlayed = item;
  replayBtn.style.display = "inline-block";

  const playerDiv = document.getElementById("player");
  playerDiv.style.display = "block"; // show
