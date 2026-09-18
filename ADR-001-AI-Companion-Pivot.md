# ADR-001: I'MU Pivot — AI Companion (Girlfriend/Boyfriend Chat)

## Status: ACCEPTED

## Context
I'MU was previously a general-purpose AI assistant ("Study Companion") with a homepage showing conversations, alarms, timetable, pomodoro, etc. The product lacked a clear problem statement and was competing with ChatGPT/Gemini in a saturated market.

**New Direction**: I'MU becomes an **AI companion** — a girlfriend/boyfriend-style chatbot that:
- Has a real personality, moods, and emotional depth
- Sends proactive messages (good morning, "khaiso?", "miss korlam")
- Mirrors the user's language (Banglish + English + Hinglish mix)
- Opens directly to chat (no homepage)
- Supports user-to-user real-time chat (friend system)
- Adapts gender persona based on user preference

## Key Changes

### 1. Remove HomeScreen → ChatScreen is Default
- After login, user goes directly to the AI chat
- No conversation list, no feature grid
- Chat history accessible via swipe or menu

### 2. Gender Selection (Signup + Settings)
- During signup: "Who do you want as your companion?" → Girl / Boy
- Stored in `profiles` table as `companion_gender`
- Settings: option to change companion gender

### 3. AI Personality System
- Complete system prompt at `backend/supabase/functions/ai-persona/SYSTEM_PROMPT.md`
- Backend edge function wraps OpenAI/Groq with this system prompt
- Mood system based on time-of-day + interaction patterns

### 4. Friend System (User-to-User Chat)
- Users can invite friends by username/email
- Friend request → Accept/Decline
- Real-time chat via Supabase Realtime
- Separate from AI chat (tabbed or swiped)

### 5. Proactive Messaging
- Edge function triggered by cron/scheduler
- Sends AI messages based on time of day
- Stored in messages table, delivered via FCM

## Files to Modify

### App (Flutter)
- `lib/main.dart` — Change default route to ChatScreen
- `lib/screens/auth_screen.dart` — Add gender selection step
- `lib/screens/home_screen.dart` — REMOVE or convert to chat list
- `lib/screens/chat_screen.dart` — Make primary screen, add friend tab
- `lib/screens/settings_screen.dart` — Add companion gender setting
- `lib/screens/friend_screen.dart` — NEW: Friend list + chat
- `lib/models/profile.dart` — NEW: Profile model with gender

### Backend (Supabase)
- `backend/supabase/functions/ai-persona/SYSTEM_PROMPT.md` — DONE
- `backend/supabase/functions/ai-companion/index.ts` — NEW: AI chat endpoint with persona
- `backend/supabase/functions/proactive-message/index.ts` — NEW: Scheduled messages
- `backend/supabase/migrations/` — Add gender column to profiles, friends table

## Implementation Order
1. ✅ AI System Prompt (DONE)
2. Modify main.dart — ChatScreen as default
3. Add gender selection to auth flow
4. Create AI companion edge function
5. Modify chat screen to use new AI endpoint
6. Add gender setting to settings
7. Build friend system (friend_screen.dart)
8. Implement proactive messaging
9. Test, commit, push
