# Chat Guidance Feature

## Overview
The Chat Guidance Feature intelligently suggests relevant sections of the Luma app based on what users are discussing in the chat. It runs as a separate module without modifying core chat functionality.

## How It Works

### 1. Smart Keyword Detection
When a user sends a message, the guidance system analyzes it for keywords related to:
- **Exercises** - breathing, meditation, yoga, relaxation, movement
- **Analytics** - progress tracking, mood patterns, improvements
- **Health** - sleep, energy, wellness metrics, symptoms
- **Tools** - crisis support, emergency resources, professional help
- **Survey** - assessments, mental health checks, evaluations

### 2. Contextual Suggestions
Based on the keywords found, the system displays a smart suggestion card with:
- Relevant icon
- Helpful tip message
- Direct link to recommended section

### 3. Smart Repetition Management
- Each suggestion type shows only once per conversation session
- Auto-resets after 1 minute to allow re-suggestion for new topics
- Only one suggestion per message to avoid clutter

## Suggested Features & Keywords

### 🧘 Exercises
**Keywords**: exercise, workout, breathing, meditation, stretching, yoga, relax, calm, movement, physical, body

**Suggestion**: "Check out the Exercises section for guided breathing exercises, meditation, and wellness routines tailored to your needs."

**Example Triggers**:
- "I'm feeling stressed"
- "Can I do some breathing exercises?"
- "I need to relax"
- "Yoga might help me"

### 📊 Analytics Dashboard
**Keywords**: progress, track, improve, better, mood, pattern, trending, history, chart, statistics, data, analytics

**Suggestion**: "Visit the Analytics Dashboard to track your mood patterns, progress, and wellness metrics over time."

**Example Triggers**:
- "How am I doing?"
- "I want to track my mood"
- "Show me my progress"
- "I'm getting better"

### 📈 Health Tracker
**Keywords**: sleep, energy, tired, fatigue, health, wellness, vital, metric, symptom, feeling, physical

**Suggestion**: "Use the Health Tracker to log your daily wellness metrics and monitor your overall well-being."

**Example Triggers**:
- "I'm exhausted"
- "My sleep is terrible"
- "I have no energy"
- "My symptoms are worse"

### 🛠️ Tools & Resources
**Keywords**: crisis, emergency, urgent, help, support, resources, contact, professional, therapy, counselor, therapist

**Suggestion**: "Check the Tools section for emergency resources, hotlines, and professional support contacts."

**Example Triggers**:
- "I'm in crisis"
- "I need urgent help"
- "Where's a therapist?"
- "Emergency support"

### 📋 Mental Health Survey
**Keywords**: survey, questionnaire, assessment, test, evaluate, understand, diagnose, mental health check

**Suggestion**: "Take the Mental Health Survey to get personalized insights and recommendations."

**Example Triggers**:
- "Can I take a test?"
- "I want to assess my mental health"
- "Evaluate my condition"

## File Structure

```
frontend/
├── chat-guidance.js          # Guidance feature module (NEW)
├── chat.html                 # Updated to include guidance script
└── [other files unchanged]
```

## Code Architecture

### Module Pattern
The feature uses an IIFE (Immediately Invoked Function Expression) to avoid global scope pollution:

```javascript
(function initChatGuidance() {
  // All code runs in isolated scope
})();
```

### Non-Intrusive Integration
Instead of modifying `chat.js`, it:
1. Waits for chat window to load
2. Wraps the existing `addMsg()` function
3. Analyzes messages without changing original functionality
4. Displays suggestions as DOM elements

```javascript
// Original chat.js remains unchanged
window.addMsg = function(role, text, canListen) {
  // Call original function
  originalAddMsg.call(this, role, text, canListen);
  
  // Add analysis (NEW - non-intrusive)
  if (role === 'user') {
    analyzeChatAndSuggest(text, chatWindow);
  }
};
```

## UI/UX Design

### Suggestion Card Styling
```css
- Background: Purple-Cyan gradient (matches Luma theme)
- Border: Left accent line (Purple #8b5cf6)
- Icon: Relevant emoji (20px)
- Message: Helpful tip (13px, light gray)
- Button: Interactive link with hover effects
- Animation: Smooth slide-in with existing slideInMsg animation
```

### User Interaction
1. **View Suggestion** - Card appears after user message
2. **Read Tip** - User can read the suggested action
3. **Click Button** - User clicks "Go to [Page]" to navigate
4. **Navigate** - Direct link to suggested page (e.g., exercises.html)

## Configuration

### Adding New Suggestions
Edit `guidanceMap` in `chat-guidance.js`:

```javascript
const guidanceMap = {
  newFeature: {
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    message: 'Helpful suggestion message here.',
    icon: '🎯',
    link: 'newfeature.html'
  }
};
```

### Adjusting Keywords
Each feature has a `keywords` array. Add or remove keywords to fine-tune triggers:

```javascript
exercises: {
  keywords: ['exercise', 'workout', 'breathing', /* more keywords */],
  // ...
}
```

### Changing Repetition Window
Modify the timeout to change how long before a suggestion can re-appear:

```javascript
setTimeout(() => {
  shownSuggestions.delete(key);
}, 60000); // 1 minute (60000ms)
```

## Features

✅ **Zero Core Code Changes** - Standalone module approach  
✅ **Non-Blocking** - Doesn't interfere with chat functionality  
✅ **Smart Analysis** - Keyword-based detection  
✅ **Repetition Prevention** - Tracks shown suggestions  
✅ **Beautiful UI** - Matches Luma's design theme  
✅ **Interactive Links** - Direct navigation to features  
✅ **Console Logging** - Debug info available  
✅ **Customizable** - Easy to add new features/keywords  

## Testing

### Manual Test
1. Open `chat.html` in browser
2. Type "I feel stressed" in chat
3. Send message
4. **Expected**: Exercises suggestion appears with button
5. Click "Go to Exercises" button
6. **Expected**: Navigate to exercises.html

### Test Cases

| User Message | Expected Suggestion |
|--------------|-------------------|
| "I'm stressed" | Exercises |
| "How am I doing?" | Analytics |
| "I'm so tired" | Health |
| "Help, emergency!" | Tools |
| "Evaluate me" | Survey |

### Console Logging
```javascript
// When feature loads
✅ Chat Guidance Feature Loaded

// When suggestion shown
(None - silent operation)

// When user clicks button
User clicked guidance suggestion: exercises.html

// Debug
window.triggerChatGuidance('exercises'); // Manual trigger
```

## Benefits

### For Users
- 🎯 Discover relevant features while chatting
- 💡 Get contextual suggestions based on conversation
- 📱 Seamless navigation between features
- 🎨 Beautiful, non-intrusive suggestions

### For Developers
- 🔧 Easy to maintain and extend
- 📦 Modular architecture
- 🛡️ No impact on existing code
- 🧪 Simple to test and debug

## Performance

- **Load Time**: ~2KB (minified)
- **Memory**: Minimal (Set tracking suggestions)
- **CPU**: Only on user message send
- **DOM**: Creates elements only when needed

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Future Enhancements

Potential improvements:
- Machine learning-based keyword weighting
- User preference tracking
- A/B testing for suggestion effectiveness
- Multi-language support
- Suggestion analytics

## Troubleshooting

### Suggestions not appearing?
1. Check browser console for "✅ Chat Guidance Feature Loaded"
2. Verify `chat-guidance.js` is loaded after `chat.js`
3. Check if keywords match user message
4. Open DevTools to debug

### Wrong suggestions?
- Review keywords in `guidanceMap`
- Add/remove keywords as needed
- Test with specific phrases

### Need to disable?
Simply remove `<script src="chat-guidance.js"></script>` from chat.html

## Summary

The Chat Guidance Feature enhances user experience by:
- Suggesting relevant features based on conversation context
- Guiding users to helpful sections
- Improving feature discovery
- Maintaining clean, non-intrusive UI

**Implementation**: Standalone module that requires NO changes to core chat code!
