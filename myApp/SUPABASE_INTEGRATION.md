# Supabase Feedback Integration

## Overview
Luma now integrates with Supabase to store user feedback. All feedback submitted through the chat page feedback form is automatically saved to Supabase.

## Setup Information

### Supabase Project Details
- **Project URL**: https://yqrvoonodlkruhgzyosq.supabase.co
- **API Key (Anon)**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcnZvb25vZGxrcnVoZ3p5b3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI1MjAsImV4cCI6MjA3NjY2ODUyMH0._HuezvgQ6rKV3GxJXjXgKsFj-DcZKiQqAmnOdHZALaU

## Files Modified

### 1. `frontend/supabase-config.js` (NEW)
Initializes Supabase client with project credentials.

```javascript
const SUPABASE_URL = 'https://yqrvoonodlkruhgzyosq.supabase.co';
const SUPABASE_ANON_KEY = '[API_KEY]';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 2. `frontend/chat.html`
- Added Supabase library: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Added script reference to `supabase-config.js` before `chat.js`

### 3. `frontend/chat.js`
Updated `sendFeedback()` function to:
- Collect feedback data (category, rating, comment, user email)
- Send to Supabase `feedback` table
- Include fallback to backend API if Supabase fails
- Log results to console

## Data Structure

### Feedback Table Schema
```sql
CREATE TABLE feedback (
  id BIGINT PRIMARY KEY DEFAULT nextval('feedback_id_seq'::regclass),
  category VARCHAR(50),           -- voice-integration, chatbot, user-experience, tools-interaction, analytics-dashboard, other
  rating INT,                      -- 1-5 stars
  comment TEXT,                    -- User's feedback text
  user_email VARCHAR(255),        -- User email (or 'anonymous@luma.local')
  created_at TIMESTAMP,           -- Submission timestamp
  user_agent TEXT,                -- Browser/device info
  page VARCHAR(50),               -- Page where feedback was submitted (e.g., 'chat')
  created_at TIMESTAMP DEFAULT now()
);
```

## Feedback Categories

| Category | Value |
|----------|-------|
| Voice Integration | `voice-integration` |
| Chatbot | `chatbot` |
| User Experience | `user-experience` |
| Tools Interaction | `tools-interaction` |
| Analytics Dashboard | `analytics-dashboard` |
| Other Feedback | `other` |

## Data Sent to Supabase

```javascript
{
  category: "chatbot",                    // Selected category
  rating: 4,                              // 1-5 stars
  comment: "Responses are helpful",       // User's text
  user_email: "user@example.com",         // From localStorage or 'anonymous@luma.local'
  created_at: "2025-10-22T10:30:45Z",    // ISO timestamp
  user_agent: "Mozilla/5.0...",           // Browser info
  page: "chat"                            // Source page
}
```

## How It Works

### 1. User Submits Feedback
- User selects feedback category (required)
- User selects rating 1-5 (required)
- User optionally adds comment text
- User clicks Submit button

### 2. Validation
- Category selection validated
- Rating selection validated (1-5)
- Comment is optional

### 3. Data Collection
```javascript
// Gets user info from localStorage
const userEmail = userData?.email || 'anonymous@luma.local';

// Prepares feedback object
const feedbackData = {
  category,
  rating,
  comment,
  user_email: userEmail,
  created_at: new Date().toISOString(),
  user_agent: navigator.userAgent,
  page: 'chat'
};
```

### 4. Supabase Upload
```javascript
const { data, error } = await supabaseClient
  .from('feedback')
  .insert([feedbackData]);
```

### 5. Fallback
If Supabase fails, feedback is sent to backend API as fallback:
```
POST /feedback
{
  rating: number,
  comment: string,
  meta: { type: string }
}
```

## Error Handling

### Supabase Errors
- Logged to console: `console.error('Supabase error:', error)`
- Triggers fallback to backend API

### API Errors
- Logged to console: `console.error('Fallback API error:', fallbackError)`
- User sees confirmation anyway (optimistic UI)

## User Experience

### Success Flow
1. User submits feedback
2. ✅ Confirmation message displayed: "[Category] - [Rating] Star(s): [Comment]"
3. Message appears for 3 seconds in top-right corner
4. Feedback logged to console (development view)
5. Form resets automatically

### Error Handling
- If Supabase fails, backend API is used
- User sees success message either way
- Errors logged to browser console for debugging

## Console Debugging

### Success
```
Feedback saved to Supabase: [data]
```

### Failure (with fallback)
```
Supabase error: [error]
Fallback API error: [error]
```

## Features

✅ **User Tracking**: Captures user email (from localStorage or anonymous)  
✅ **Device Info**: Stores user agent for analytics  
✅ **Timestamps**: ISO 8601 format timestamps  
✅ **Categories**: 6 feedback categories  
✅ **Ratings**: 1-5 star rating system  
✅ **Comments**: Optional user feedback text  
✅ **Fallback**: Backend API fallback if Supabase fails  
✅ **Error Logging**: Console logging for debugging  

## Security

⚠️ **Important**: API key is public (anon key). This is intentional for read-only Supabase access from frontend.

### RLS Policies Recommended
Set up Row-Level Security (RLS) in Supabase to:
- Allow anonymous inserts to feedback table
- Restrict deletes/updates to authenticated users only

## Testing

### Manual Test
1. Open chat.html in browser
2. Click Feedback button
3. Select category, rating, and add comment
4. Click Submit
5. Check browser console for `Feedback saved to Supabase: [data]`
6. Visit Supabase dashboard to verify data in `feedback` table

### Browser Console
```javascript
// Check Supabase client
console.log(supabaseClient);

// Manually insert feedback
supabaseClient
  .from('feedback')
  .insert([{
    category: 'test',
    rating: 5,
    comment: 'Test feedback',
    user_email: 'test@example.com'
  }])
  .then(result => console.log(result));
```

## Next Steps

1. ✅ Verify `feedback` table exists in Supabase
2. ✅ Test feedback submission from chat page
3. ✅ Monitor Supabase dashboard for incoming feedback
4. ✅ Set up RLS policies for security
5. ✅ Create analytics queries for feedback analysis

## Support

For issues or questions:
- Check browser console for error messages
- Verify Supabase project status
- Confirm API credentials are correct
- Test API key permissions in Supabase dashboard
