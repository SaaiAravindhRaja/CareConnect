<p align="center">
  <img src="./src/assets/careconnect-logo.png" alt="CareConnect Logo" width="300">
</p>

<h1 align="center">CareConnect</h1>

<p align="center">
  <strong>AI-Powered Caregiver-Care Recipient Relationship Platform</strong>
</p>

<p align="center">
  <em>Helping caregivers provide respectful, meaningful, and joyful care</em>
</p>

---

## Problem Statement

Caregivers often struggle to provide personalized, dignified care that truly aligns with care recipients' preferences. Manual note-taking is inconsistent, preferences are forgotten, and meaningful moments can be lost. This leads to care that feels generic rather than personal.

## Our Solution

CareConnect helps caregivers provide respectful, meaningful, and joyful care by:

- **Learning preferences over time** through logged interactions
- **Suggesting personalized activities** based on what's worked before
- **Maintaining dignity and respect** with quick-view preference cards
- **Capturing beautiful moments** to share with family

---

## Features

### Core Features

- **Digital Memory Book** - Log daily interactions with mood, success ratings, tags, and photos
- **Preference Profile** - Visual dashboard of learned preferences (activities, communication style, routines)
- **AI Activity Suggestions** - Personalized recommendations based on time of day, mood, and history
- **Respect & Dignity Dashboard** - Quick-view cards with what matters most to the care recipient

### AI-Powered Features

- **Smart Suggestions** - GPT-4 powered activity recommendations tailored to the individual
- **Preference Extraction** - Automatically learns preferences from logged interactions
- **Confidence Scoring** - Shows how confident the AI is about each preference

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI GPT-4o-mini
- **Icons**: Lucide React
- **Charts**: Recharts

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (optional - mock data available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd careconnect
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key  # Optional
```

5. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Create a storage bucket named `photos` (optional, for photo uploads)

6. Start the development server:
```bash
npm run dev
```

---

## Project Structure

```
careconnect/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components (Button, Card, Input, etc.)
│   │   ├── Layout/       # App layout and navigation
│   │   └── ...           # Feature-specific components
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── MemoryBook.tsx    # Memory book timeline
│   │   ├── LogInteraction.tsx # Log new interaction
│   │   ├── Suggestions.tsx   # AI suggestions
│   │   ├── Preferences.tsx   # Preferences dashboard
│   │   └── Profile.tsx       # Care recipient profile
│   ├── lib/
│   │   ├── supabase.ts   # Supabase client & helpers
│   │   ├── openai.ts     # OpenAI integration
│   │   └── utils.ts      # Utility functions
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React contexts (Auth)
│   └── types/            # TypeScript types
├── supabase/
│   └── schema.sql        # Database schema
└── ...
```

---

## Demo Flow

1. **Sign up** as a caregiver (Maria)
2. **Add care recipient** (Mr. Chen, 78 years old)
3. **Log an interaction**: "Listened to Bach's Brandenburg Concertos together"
   - Mood: 5/5
   - Success: 5/5
   - Tags: music, classical, morning
4. **View preferences** - AI learns "Enjoys classical music, especially Bach"
5. **Get AI suggestions** - "Play Bach's Brandenburg Concertos - he loved it yesterday"
6. **Accept suggestion** and log another successful moment

---

## API Endpoints (Supabase)

All data operations go through Supabase's auto-generated REST API:

- `auth.users` - Authentication
- `caregivers` - Caregiver profiles
- `care_recipients` - Care recipient profiles
- `care_relationships` - Links caregivers to recipients
- `interactions` - Memory book entries
- `preferences` - Learned preferences
- `activity_suggestions` - AI-generated suggestions

Row Level Security (RLS) ensures caregivers only see their own data.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_OPENAI_API_KEY` | No | OpenAI API key (mock data if not provided) |

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---


