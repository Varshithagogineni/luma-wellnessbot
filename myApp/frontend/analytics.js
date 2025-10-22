// Analytics page functionality
const API = (path) => `http://localhost:8001${path}`;

// --- Analytics ---
async function loadAnalytics() {
  const d = await fetch(API("/analytics")).then(r => r.json());
  document.getElementById("kChats").textContent = d.total_user_messages ?? "0";
  document.getElementById("kCrisis").textContent = d.crisis_flags ?? "0";
  document.getElementById("kMood").textContent = d.mood_avg ?? "—";
  document.getElementById("kHealth").textContent = d.health_count ?? "0";
}

// --- Achievements ---
async function renderAchievements() {
  const d = await fetch(API("/achievements")).then(r => r.json());
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

// --- Feedback ---
const feedbackForm = document.getElementById("feedbackForm");
feedbackForm.onsubmit = async (e) => {
  e.preventDefault();
  const rating = +document.getElementById("fRating").value;
  const comment = document.getElementById("fComment").value;
  await postJSON(API("/feedback"), { rating, comment, meta: { ua: navigator.userAgent } });
  alert("Thanks for helping improve the chatbot!");
  renderAchievements();
};

// --- Utilities ---
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  loadAnalytics();
  renderAchievements();
})();
