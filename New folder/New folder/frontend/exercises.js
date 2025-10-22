// Exercises page functionality
const API = (path) => `http://localhost:8000${path}`;

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

// --- Fallback Exercises ---
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

// --- Suggestions ---
async function loadSuggestions() {
  const d = await fetch(API("/suggestions")).then(r=>r.json());
  const ul = document.getElementById("tipList");
  ul.innerHTML = "";
  d.tips.forEach(t => { 
    const li = document.createElement("li"); 
    li.textContent = t; 
    ul.appendChild(li); 
  });
}

// --- Utilities ---
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  return r.json();
}

// --- Logout ---
document.getElementById('logoutBtn').onclick = () => {
  if (confirm('Are you sure you want to logout?')) {
    // Clear user session
    localStorage.removeItem('mindmate_user');
    localStorage.removeItem('mindmate_survey');
    
    // Redirect to login page
    window.location.href = 'login.html';
  }
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
  
  loadPersonalizedExercises(); 
  loadSuggestions();
})();
