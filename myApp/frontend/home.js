// Home page functionality
const API = (path) => `http://localhost:8000${path}`;

// Check authentication - Only needed for other pages
// NOT called on home page to allow signup
function checkAuth() {
  const user = localStorage.getItem('lumaUser');
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Apply theme from survey
function applyTheme(theme) {
  if (theme) {
    document.body.className = `theme-${theme}`;
  }
}

// Emergency button
document.getElementById('btnEmergency').onclick = async () => {
  const d = await fetch(API("/emergency")).then(r=>r.json());
  alert(`${d.notice}\n\nUS Help: ${d.us}`);
};

document.addEventListener('DOMContentLoaded', function() {
  // Modal Elements
  const signupModal = document.getElementById('signupModal');
  const signupBtn = document.getElementById('signupBtn');
  const loginBtn = document.getElementById('loginBtn');
  const closeModal = document.getElementById('closeModal');
  const createAccountForm = document.getElementById('createAccountForm');

  // Open Signup Modal
  if (signupBtn) {
    signupBtn.addEventListener('click', function() {
      signupModal.style.display = 'block';
    });
  }

  // Close Modal
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      signupModal.style.display = 'none';
    });
  }

  // Close Modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === signupModal) {
      signupModal.style.display = 'none';
    }
  });

  // Login Button Handler
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      const userData = localStorage.getItem('lumaUser');
      if (userData) {
        alert('You are already logged in!');
      } else {
        alert('Redirecting to login page...');
        window.location.href = 'login.html';
      }
    });
  }

  // Create Account Form Handler
  if (createAccountForm) {
    createAccountForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      // Validate email
      const emailRegex = /^[^\s@]+@gmail\.com$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid Gmail address');
        return;
      }
      
      // Validate password strength
      if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }
      
      // Store user data in localStorage
      const userData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        moodTheme: 'default'
      };
      
      localStorage.setItem('lumaUser', JSON.stringify(userData));
      
      // Show success message
      alert(`Welcome ${firstName}! Your account has been created successfully. Customizing your experience...`);
      
      // Customize experience based on user
      customizeExperience(firstName);
      
      // Reset form
      createAccountForm.reset();
      
      // Close modal
      signupModal.style.display = 'none';
      
      // Show personalized greeting
      showPersonalizedGreeting(firstName);
      
      // Hide signup button and show profile info
      updateUIForLoggedInUser();
    });
  }

  // Check if user already logged in on page load
  checkExistingUser();
});

// Customize user experience based on state of mind
function customizeExperience(firstName) {
  console.log(`Customizing experience for ${firstName}`);
  
  // Apply personalization
  const userData = JSON.parse(localStorage.getItem('lumaUser'));
  userData.isPersonalized = true;
  localStorage.setItem('lumaUser', JSON.stringify(userData));
}

// Show personalized greeting
function showPersonalizedGreeting(firstName) {
  const welcomeContent = document.querySelector('.welcome-content h2');
  if (welcomeContent) {
    welcomeContent.textContent = `Welcome back, ${firstName}! 💚`;
  }
}

// Check if user already has an account
function checkExistingUser() {
  const userData = localStorage.getItem('lumaUser');
  if (userData) {
    const user = JSON.parse(userData);
    showPersonalizedGreeting(user.firstName);
    updateUIForLoggedInUser();
  }
}

// Update UI for logged in users
function updateUIForLoggedInUser() {
  const authButtonsSection = document.querySelector('.auth-buttons-section');
  if (authButtonsSection) {
    authButtonsSection.innerHTML = `
      <div class="user-profile-info">
        <p>✨ Account created successfully!</p>
        <p>Explore Luma's features to customize your experience</p>
      </div>
    `;
  }
}

// Logout function
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('lumaUser');
        alert('Logged out successfully');
        location.reload();
      }
    });
  }
});

// Initialize
(function init() {
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
})();
