// Tools page functionality
const API = (path) => `http://localhost:8000${path}`;

// --- Wellness Tools ---
function startMeditation() {
  const duration = prompt("How many minutes would you like to meditate? (1-30)", "10");
  if (duration && duration > 0 && duration <= 30) {
    alert(`Starting ${duration}-minute meditation session. Find a quiet place and focus on your breathing.`);
    // In a real app, this would start a meditation timer
  }
}

function openGratitudeJournal() {
  const entry = prompt("What are you grateful for today?");
  if (entry) {
    // Store gratitude entry
    const entries = JSON.parse(localStorage.getItem('gratitude_entries') || '[]');
    entries.push({
      date: new Date().toISOString().slice(0,10),
      entry: entry
    });
    localStorage.setItem('gratitude_entries', JSON.stringify(entries));
    alert("Gratitude entry saved! 🌟");
  }
}

function playMoodMusic() {
  alert("🎵 Opening calming music playlist. In a real app, this would connect to a music service.");
}

function openGrowthTracker() {
  alert("🌱 Growth tracker would show your progress over time. This feature is coming soon!");
}

// --- Emergency ---
document.getElementById('btnEmergency').onclick = async () => {
  const d = await fetch(API("/emergency")).then(r=>r.json());
  alert(`${d.notice}\n\nUS Help: ${d.us}`);
};

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
})();
