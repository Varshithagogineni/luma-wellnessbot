// Chat page functionality
const API = (path) => `http://localhost:8001${path}`;

const chatWindow = document.getElementById("chatWindow");
const chatText = document.getElementById("chatText");
const btnSend = document.getElementById("btnSend");
const btnMic = document.getElementById("btnMic");
const btnEmergency = document.getElementById("btnEmergency");

// Global speech synthesis control
let currentUtterance = null;
let isListening = false;

// --- Utilities ---
function addMsg(role, text, canListen = false) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  // Create message content
  const msgContent = document.createElement("div");
  msgContent.className = "msg-content";
  msgContent.textContent = text;

  div.appendChild(msgContent);

  // Add listen button for bot messages
  if (canListen && role === "bot") {
    const btnContainer = document.createElement("div");
    btnContainer.className = "msg-actions";

    const listenBtn = document.createElement("button");
    listenBtn.className = "btn-listen";
    listenBtn.textContent = "🔊 Listen";
    listenBtn.title = "Hear the response";

    listenBtn.onclick = () => {
      if (isListening) {
        // Stop listening
        window.speechSynthesis.cancel();
        isListening = false;
        listenBtn.textContent = "🔊 Listen";
        listenBtn.classList.remove("listening");
      } else {
        // Start listening
        isListening = true;
        listenBtn.textContent = "⏹️ Stop";
        listenBtn.classList.add("listening");
        speak(text, () => {
          // On finish
          isListening = false;
          listenBtn.textContent = "🔊 Listen";
          listenBtn.classList.remove("listening");
        });
      }
    };

    btnContainer.appendChild(listenBtn);
    div.appendChild(btnContainer);
  }

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function speak(text, onFinish = null) {
  try {
    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;

    if (onFinish) {
      u.onend = () => {
        onFinish();
      };
    }

    currentUtterance = u;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error("Speech synthesis error:", e);
  }
}

async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

// --- Chat ---
btnSend.onclick = async () => {
  const t = chatText.value.trim();
  if (!t) return;
  addMsg("user", t, false);
  chatText.value = "";
  const data = await postJSON(API("/chat"), { text: t });
  addMsg("bot", data.reply, true);  // Enable listen button for bot messages
  if (data.unlocked && data.unlocked.length) {
    // Show achievement notification
    // alert(`🏅 Achievement Unlocked: ${data.unlocked.map(u => u.title).join(', ')}`);
  }
};

chatText.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) btnSend.click();
});

// --- Voice Input ---
let rec;
btnMic.onclick = () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!rec) {
    rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = e => { chatText.value = e.results[0][0].transcript; };
  }
  rec.start();
};

// --- Emergency ---
btnEmergency.onclick = async () => {
  const d = await fetch(API("/emergency")).then(r => r.json());
  alert(`${d.notice}\n\nUS Help: ${d.us}`);
};

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

// --- FAQ ---
async function loadFAQ() {
  const d = await fetch(API("/faq")).then(r => r.json());
  const wrap = document.getElementById("faqDynamic");
  wrap.innerHTML = "";
  d.faqs.forEach(f => {
    const det = document.createElement("details");
    const sum = document.createElement("summary");
    sum.textContent = f.q;
    const p = document.createElement("p");
    p.textContent = f.a;
    det.appendChild(sum);
    det.appendChild(p);
    wrap.appendChild(det);
  });
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

  loadFAQ();
})();

// --- Feedback Dropdown Functionality ---
(function initFeedback() {
  const feedbackBtn = document.getElementById('btnFeedback');
  const dropdown = document.querySelector('.dropdown');
  const stars = document.querySelectorAll('.star');
  const feedbackText = document.getElementById('feedbackText');
  const submitBtn = document.getElementById('submitFeedback');
  const categoryRadios = document.querySelectorAll('.category-radio');

  let selectedRating = 0;
  let selectedCategory = '';

  if (!feedbackBtn) return;

  // Toggle dropdown on button click
  feedbackBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('show');
    // Reset form when opening
    if (dropdown.classList.contains('show')) {
      resetFeedbackForm();
    }
  });

  // Handle category selection
  categoryRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.checked) {
        selectedCategory = this.value;
      }
    });
  });

  // Handle star rating selection
  stars.forEach(star => {
    star.addEventListener('click', function () {
      selectedRating = parseInt(this.getAttribute('data-rating'));
      updateStars(selectedRating);
    });

    star.addEventListener('mouseover', function () {
      const hoverRating = parseInt(this.getAttribute('data-rating'));
      updateStars(hoverRating);
    });
  });

  // Reset stars on mouse leave
  document.querySelector('.star-rating').addEventListener('mouseleave', function () {
    updateStars(selectedRating);
  });

  // Handle submit button
  submitBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (selectedRating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!selectedCategory) {
      alert('Please select a feedback category');
      return;
    }

    const comment = feedbackText.value.trim();

    // Send feedback to backend
    sendFeedback(selectedCategory, comment, selectedRating);

    // Show confirmation
    const categoryLabel = getCategoryLabel(selectedCategory);
    showFeedbackConfirmation(`${categoryLabel} - ${selectedRating} Star${selectedRating !== 1 ? 's' : ''}: ${comment || 'No comment'}`, selectedRating);

    // Close dropdown
    dropdown.classList.remove('show');

    // Reset form
    resetFeedbackForm();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== feedbackBtn) {
      dropdown.classList.remove('show');
    }
  });

  // Update stars visual
  function updateStars(rating) {
    stars.forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  // Get category label from value
  function getCategoryLabel(value) {
    const labels = {
      'voice-integration': 'Voice Integration',
      'chatbot': 'Chatbot',
      'user-experience': 'User Experience',
      'tools-interaction': 'Tools Interaction',
      'analytics-dashboard': 'Analytics Dashboard',
      'other': 'Other Feedback'
    };
    return labels[value] || value;
  }

  // Reset feedback form
  function resetFeedbackForm() {
    selectedRating = 0;
    selectedCategory = '';
    feedbackText.value = '';
    updateStars(0);
    categoryRadios.forEach(radio => radio.checked = false);
  }
})();

// Send feedback to Supabase
async function sendFeedback(category, comment, rating) {
  try {
    // Get current user session
    const userSession = localStorage.getItem('lumaUser');
    const userData = userSession ? JSON.parse(userSession) : null;
    const userEmail = userData ? userData.email : 'anonymous@luma.local';

    // Prepare feedback data
    const feedbackData = {
      category: category,
      rating: rating,
      comment: comment,
      user_email: userEmail,
      created_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page: 'chat'
    };

    // Send to Supabase
    const { data, error } = await supabaseClient
      .from('feedback')
      .insert([feedbackData]);

    if (error) {
      console.error('Supabase error:', error);
      // Fallback to backend API if Supabase fails
      try {
        await fetch(API('/feedback'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: rating,
            comment: comment,
            meta: { type: category }
          })
        });
      } catch (fallbackError) {
        console.error('Fallback API error:', fallbackError);
      }
    } else {
      console.log('Feedback saved to Supabase:', data);
    }
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
}

// Get rating from feedback type
function getRatingFromType(type) {
  const ratingMap = {
    'very-helpful': 5,
    'helpful': 4,
    'neutral': 3,
    'not-helpful': 2,
    'suggest-improvement': 4
  };
  return ratingMap[type] || 3;
}

// Show confirmation message
function showFeedbackConfirmation(feedbackText, rating) {
  const msg = document.createElement('div');
  msg.className = 'feedback-confirmation';
  msg.textContent = `Thank you for your feedback: ${feedbackText} (Rating: ${rating})`;
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    font-weight: 600;
    animation: slideInFeedback 0.3s ease;
    z-index: 10000;
  `;

  document.body.appendChild(msg);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    msg.style.animation = 'slideOutFeedback 0.3s ease';
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}
