// Chat Guidance Feature - Suggests relevant features based on user conversation
// This module runs alongside chat.js without modifying core code

(function initChatGuidance() {
  'use strict';
  
  // Guidance configuration - keyword patterns mapped to suggestions
  const guidanceMap = {
    exercises: {
      keywords: ['exercise', 'workout', 'breathing', 'meditation', 'stretching', 'yoga', 'relax', 'calm', 'movement', 'physical', 'body'],
      message: '💡 Pro Tip: Check out the Exercises section for guided breathing exercises, meditation, and wellness routines tailored to your needs.',
      icon: '🧘',
      link: 'exercises.html'
    },
    analytics: {
      keywords: ['progress', 'track', 'improve', 'better', 'mood', 'pattern', 'trending', 'history', 'chart', 'statistics', 'data', 'analytics'],
      message: '💡 Pro Tip: Visit the Analytics Dashboard to track your mood patterns, progress, and wellness metrics over time.',
      icon: '📊',
      link: 'analytics.html'
    },
    health: {
      keywords: ['sleep', 'energy', 'tired', 'fatigue', 'health', 'wellness', 'vital', 'metric', 'symptom', 'feeling', 'physical'],
      message: '💡 Pro Tip: Use the Health Tracker to log your daily wellness metrics and monitor your overall well-being.',
      icon: '📈',
      link: 'health.html'
    },
    tools: {
      keywords: ['crisis', 'emergency', 'urgent', 'help', 'support', 'resources', 'contact', 'professional', 'therapy', 'counselor', 'therapist'],
      message: '💡 Pro Tip: Check the Tools section for emergency resources, hotlines, and professional support contacts.',
      icon: '🛠️',
      link: 'tools.html'
    },
    survey: {
      keywords: ['survey', 'questionnaire', 'assessment', 'test', 'evaluate', 'understand', 'diagnose', 'mental health check'],
      message: '💡 Pro Tip: Take the Mental Health Survey to get personalized insights and recommendations.',
      icon: '📋',
      link: 'survey.html'
    }
  };
  
  // Track shown suggestions to avoid repetition
  const shownSuggestions = new Set();
  
  // Wait for chat window to be available
  const waitForChatWindow = setInterval(() => {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      clearInterval(waitForChatWindow);
      initGuidanceListener(chatWindow);
    }
  }, 100);
  
  // Initialize guidance listener
  function initGuidanceListener(chatWindow) {
    // Override the addMsg function to analyze messages
    const originalAddMsg = window.addMsg;
    
    if (typeof originalAddMsg === 'function') {
      window.addMsg = function(role, text, canListen) {
        // Call original function
        originalAddMsg.call(this, role, text, canListen);
        
        // Analyze user messages for guidance suggestions
        if (role === 'user') {
          analyzeChatAndSuggest(text, chatWindow);
        }
      };
    }
  }
  
  // Analyze chat content and suggest relevant features
  function analyzeChatAndSuggest(userMessage, chatWindow) {
    const messageLower = userMessage.toLowerCase();
    
    // Find matching guidance
    for (const [key, guidance] of Object.entries(guidanceMap)) {
      // Skip if already shown recently
      if (shownSuggestions.has(key)) {
        continue;
      }
      
      // Check if any keywords match
      const matchFound = guidance.keywords.some(keyword => 
        messageLower.includes(keyword)
      );
      
      if (matchFound) {
        // Show guidance suggestion
        displayGuidanceSuggestion(guidance, chatWindow);
        shownSuggestions.add(key);
        
        // Clear suggestion after 2 messages to allow re-suggestion
        setTimeout(() => {
          shownSuggestions.delete(key);
        }, 60000); // Reset after 1 minute
        
        break; // Show only one suggestion per message
      }
    }
  }
  
  // Display guidance suggestion as a message
  function displayGuidanceSuggestion(guidance, chatWindow) {
    // Create guidance message container
    const guidanceDiv = document.createElement('div');
    guidanceDiv.className = 'guidance-suggestion';
    guidanceDiv.style.cssText = `
      margin: 12px 0;
      padding: 12px 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
      border-left: 4px solid #8b5cf6;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInMsg 0.3s ease;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    // Icon
    const iconSpan = document.createElement('span');
    iconSpan.textContent = guidance.icon;
    iconSpan.style.cssText = 'font-size: 20px; flex-shrink: 0;';
    
    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px;';
    
    // Message text
    const messageSpan = document.createElement('span');
    messageSpan.textContent = guidance.message;
    messageSpan.style.cssText = `
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.4;
    `;
    
    // Button
    const linkBtn = document.createElement('button');
    linkBtn.textContent = '→ Go to ' + guidance.link.split('.')[0].charAt(0).toUpperCase() + guidance.link.split('.')[0].slice(1);
    linkBtn.style.cssText = `
      align-self: flex-start;
      padding: 6px 12px;
      border: 1px solid #8b5cf6;
      border-radius: 6px;
      background: rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    linkBtn.onmouseover = () => {
      linkBtn.style.background = 'rgba(139, 92, 246, 0.4)';
      linkBtn.style.color = '#d8b4fe';
    };
    
    linkBtn.onmouseout = () => {
      linkBtn.style.background = 'rgba(139, 92, 246, 0.2)';
      linkBtn.style.color = '#a78bfa';
    };
    
    linkBtn.onclick = () => {
      // Track click
      console.log('User clicked guidance suggestion:', guidance.link);
      // Navigate to suggested page
      window.location.href = guidance.link;
    };
    
    contentDiv.appendChild(messageSpan);
    contentDiv.appendChild(linkBtn);
    
    guidanceDiv.appendChild(iconSpan);
    guidanceDiv.appendChild(contentDiv);
    
    // Add to chat window
    chatWindow.appendChild(guidanceDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  // Expose function for manual trigger (optional)
  window.triggerChatGuidance = function(featureKey) {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow && guidanceMap[featureKey]) {
      displayGuidanceSuggestion(guidanceMap[featureKey], chatWindow);
    }
  };
  
  console.log('✅ Chat Guidance Feature Loaded');
})();
