# I'MU — AI Study Companion

A full-stack AI-powered study platform with Android app, admin panel, and serverless backend.

## Architecture

```
app/          → Flutter Android app (Riverpod + Isar)
admin/        → Next.js admin panel (Vercel deployed)
backend/      → Supabase Edge Functions + PostgreSQL
```

## Stack

- **Mobile**: Flutter 3.x, Riverpod, Isar, Lottie, flutter_markdown
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **Admin**: Next.js 14, Tailwind CSS, shadcn/ui
- **Notifications**: Firebase Cloud Messaging
- **AI**: OpenAI/Anthropic via Supabase Edge Functions (API keys never exposed)

## Getting Started

### Mobile App
```bash
cd app
flutter pub get
flutter run
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

### Backend
```bash
cd backend
supabase init
supabase db push
supabase functions deploy
```

## Production Build
```bash
cd app
flutter build apk --release --split-per-abi
```
