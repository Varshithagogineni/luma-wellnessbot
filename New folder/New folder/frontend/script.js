const API = (path) => `http://localhost:8000${path}`;

const chatWindow = document.getElementById("chatWindow");
const chatText = document.getElementById("chatText");
const btnSend = document.getElementById("btnSend");
const btnMic = document.getElementById("btnMic");
const btnEmergency = document.getElementById("btnEmergency");

// --- Utilities ---
function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  return r.json();
}

// --- Chat ---
btnSend.onclick = async () => {
  const t = chatText.value.trim();
  if (!t) return;
  addMsg("user", t);
  chatText.value = "";
  const data = await postJSON(API("/chat"), { text: t });
  addMsg("bot", data.reply);
  speak(data.reply);
  if (data.unlocked && data.unlocked.length) renderAchievements();
  loadAnalytics();
};
chatText.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) btnSend.click(); });

// --- Voice In (Web Speech API) ---
let rec;
btnMic.onclick = () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser."); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!rec) {
    rec = new SR(); rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = e => { chatText.value = e.results[0][0].transcript; };
  }
  rec.start();
};

// --- Emergency ---
btnEmergency.onclick = async () => {
  const d = await fetch(API("/emergency")).then(r=>r.json());
  alert(`${d.notice}\n\nUS Help: ${d.us}`);
};

// --- Exercises ---
async function loadExercises() {
  const d = await fetch(API("/exercises")).then(r=>r.json());
  const ul = document.getElementById("exerciseList");
  ul.innerHTML = "";
  d.exercises.forEach(ex => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${ex.name}</strong>: ${ex.steps.join(" • ")}`;
    ul.appendChild(li);
  });
}

// --- Personalized Exercises ---
async function loadPersonalizedExercises() {
  try {
    const d = await fetch(API("/exercises/personalized")).then(r=>r.json());
    const ul = document.getElementById("exerciseList");
    ul.innerHTML = "";
    
    // Add personalization info
    if (d.personalization && d.personalization.detected_moods.length > 0) {
      const moodInfo = document.createElement("div");
      moodInfo.className = "personalization-info";
      moodInfo.innerHTML = `
        <h3>🎯 Personalized for you</h3>
        <p>Based on your recent messages, we detected: ${d.personalization.detected_moods.join(", ")}</p>
        <p><em>${d.personalization.recommendation_reason}</em></p>
      `;
      ul.appendChild(moodInfo);
    }
    
    d.exercises.forEach(ex => {
      const li = document.createElement("li");
      li.className = "exercise-item";
      
      let content = `<strong>${ex.name}</strong>: ${ex.steps.join(" • ")}`;
      
      // Add difficulty and category badges
      if (ex.difficulty) {
        content += ` <span class="badge difficulty-${ex.difficulty}">${ex.difficulty}</span>`;
      }
      if (ex.category) {
        content += ` <span class="badge category">${ex.category.replace('_', ' ')}</span>`;
      }
      
      // Add reason if available
      if (ex.reason) {
        content += `<br><small class="reason">💡 ${ex.reason}</small>`;
      }
      
      li.innerHTML = content;
      
      // Add reaction buttons
      const reactionDiv = document.createElement("div");
      reactionDiv.className = "exercise-reactions";
      reactionDiv.innerHTML = `
        <button class="reaction-btn helpful" onclick="submitExerciseReaction('${ex.name}', 'helpful')">👍 Helpful</button>
        <button class="reaction-btn not-helpful" onclick="submitExerciseReaction('${ex.name}', 'not_helpful')">👎 Not helpful</button>
        <button class="reaction-btn too-difficult" onclick="submitExerciseReaction('${ex.name}', 'too_difficult')">😰 Too difficult</button>
        <button class="reaction-btn too-easy" onclick="submitExerciseReaction('${ex.name}', 'too_easy')">😊 Too easy</button>
        <button class="reaction-btn loved" onclick="submitExerciseReaction('${ex.name}', 'loved_it')">❤️ Loved it</button>
      `;
      
      li.appendChild(reactionDiv);
      ul.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading personalized exercises:", error);
    // Fallback to regular exercises
    loadExercises();
  }
}

// --- Exercise Reaction Submission ---
async function submitExerciseReaction(exerciseName, reaction) {
  try {
    const feedback = prompt(`Tell us more about your experience with "${exerciseName}" (optional):`);
    const response = await postJSON(API("/exercises/reaction"), {
      exercise_name: exerciseName,
      reaction: reaction,
      user_feedback: feedback || ""
    });
    
    // Show feedback
    alert(response.message);
    
    // Reload personalized exercises to get updated recommendations
    loadPersonalizedExercises();
  } catch (error) {
    console.error("Error submitting exercise reaction:", error);
    alert("Thanks for your feedback! We'll use this to improve your recommendations.");
  }
}

// --- FAQ ---
async function loadFAQ() {
  const d = await fetch(API("/faq")).then(r=>r.json());
  const wrap = document.getElementById("faqDynamic");
  wrap.innerHTML = "";
  d.faqs.forEach(f => {
    const det = document.createElement("details");
    const sum = document.createElement("summary"); sum.textContent = f.q;
    const p = document.createElement("p"); p.textContent = f.a;
    det.appendChild(sum); det.appendChild(p); wrap.appendChild(det);
  });
}

// --- Health Tracker ---
const healthForm = document.getElementById("healthForm");
const moodChartCtx = document.getElementById("moodChart");
let moodChart;
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
  if (d.unlocked && d.unlocked.length) renderAchievements();
  alert("Saved!");
  loadAnalytics(); // will update average mood
  // naive chart add:
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

// --- Suggestions ---
async function loadSuggestions() {
  const d = await fetch(API("/suggestions")).then(r=>r.json());
  const ul = document.getElementById("tipList");
  ul.innerHTML = "";
  d.tips.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
}

// --- Analytics ---
async function loadAnalytics() {
  const d = await fetch(API("/analytics")).then(r=>r.json());
  document.getElementById("kChats").textContent = d.total_user_messages ?? "0";
  document.getElementById("kCrisis").textContent = d.crisis_flags ?? "0";
  document.getElementById("kMood").textContent = d.mood_avg ?? "—";
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

// --- Feedback ---
const feedbackForm = document.getElementById("feedbackForm");
feedbackForm.onsubmit = async (e) => {
  e.preventDefault();
  const rating = +document.getElementById("fRating").value;
  const comment = document.getElementById("fComment").value;
  await postJSON(API("/feedback"), { rating, comment, meta: { ua: navigator.userAgent }});
  alert("Thanks for helping improve the chatbot!");
  renderAchievements();
};

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

// --- Theme Management ---
function applyTheme(theme) {
  if (theme) {
    document.body.className = `theme-${theme}`;
  }
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

// --- Init ---
(function init() {
  // Check authentication
  if (!checkAuth()) return;
  
  // Apply theme from survey
  const surveyData = localStorage.getItem('mindmate_survey');
  if (surveyData) {
    const data = JSON.parse(surveyData);
    // Handle both old single selection and new multiple selection format
    if (data.theme) {
      // Old format - single selection
      applyTheme(data.theme);
    } else if (data.lifeSituation && data.lifeSituation.length > 0) {
      // New format - multiple selections, use first one for theme
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
  loadPersonalizedExercises(); loadFAQ(); loadSuggestions(); loadAnalytics(); renderAchievements();
})();
