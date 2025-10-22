// Health page functionality
const API = (path) => `http://localhost:8000${path}`;

const healthForm = document.getElementById("healthForm");
const moodChartCtx = document.getElementById("moodChart");
let moodChart;

// --- Health Tracker ---
healthForm.onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    date: document.getElementById("hDate").value || new Date().toISOString().slice(0,10),
    mood: +document.getElementById("hMood").value,
    sleep_hours: +document.getElementById("hSleep").value,
    steps: +document.getElementById("hSteps").value,
    exercise_minutes: +document.getElementById("hExMin").value,
    notes: document.getElementById("hNotes").value
  };
  const d = await postJSON(API("/health"), payload);
  if (d.unlocked && d.unlocked.length) {
    alert(`🏅 Achievement Unlocked: ${d.unlocked.map(u => u.title).join(', ')}`);
    renderAchievements();
  }
  alert("Health data saved!");
  // Update chart
  appendMoodPoint(payload.date, payload.mood);
};

function appendMoodPoint(date, mood) {
  if (!moodChart) {
    moodChart = new Chart(moodChartCtx, {
      type: "line",
      data: { labels: [date], datasets: [{ label: "Mood (1–5)", data: [mood] }] },
      options: { responsive: true, scales: { y: { min:1, max:5, ticks:{ stepSize:1 }}}}
    });
  } else {
    moodChart.data.labels.push(date);
    moodChart.data.datasets[0].data.push(mood);
    moodChart.update();
  }
}

// --- Achievements ---
async function renderAchievements() {
  const d = await fetch(API("/achievements")).then(r=>r.json());
  const w = document.getElementById("achievements");
  w.innerHTML = "";
  d.achievements.forEach(a => {
    const b = document.createElement("span");
    b.className = "badge";
    b.title = a.description;
    b.textContent = `🏅 ${a.title}`;
    w.appendChild(b);
  });
}

// --- Utilities ---
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  return r.json();
}

// --- Check Authentication ---
function checkAuth() {
  const user = localStorage.getItem('mindmate_user');
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// --- Apply Theme ---
function applyTheme(theme) {
  if (theme) {
    document.body.className = `theme-${theme}`;
  }
}

// --- Init ---
(function init() {
  // Check authentication
  if (!checkAuth()) return;
  
  // Apply theme from survey
  const surveyData = localStorage.getItem('mindmate_survey');
  if (surveyData) {
    const data = JSON.parse(surveyData);
    if (data.theme) {
      applyTheme(data.theme);
    } else if (data.lifeSituation && data.lifeSituation.length > 0) {
      const firstSituation = data.lifeSituation[0];
      const themeMap = {
        'depressed': 'depressed',
        'lonely': 'lonely', 
        'sad': 'sad',
        'betrayed': 'betrayed',
        'love': 'love',
        'happy': 'happy',
        'anxious': 'anxious',
        'stressed': 'anxious'
      };
      const theme = themeMap[firstSituation];
      if (theme) {
        applyTheme(theme);
      }
    }
  }
  
  document.getElementById("hDate").value = new Date().toISOString().slice(0,10);
  renderAchievements();
})();
