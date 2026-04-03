# RowIQ — Train Smarter

A PWA for rowing coaches and athletes to manage training, wellness, and team communication.

## Demo Accounts

All passwords: `Demo1234!`

| Role | Email | Notes |
|------|-------|-------|
| Coach | `coach@rowiq.demo` | Mike Teti — UC Berkeley Men's Rowing |
| Athlete | `alex@rowiq.demo` | Alex Chen — soreness streak alert |
| Athlete | `jordan@rowiq.demo` | Jordan Rivera — low sleep alert |
| Athlete | `sam@rowiq.demo` | Sam Park — exam week flag |
| Athlete | `taylor@rowiq.demo` | Taylor Kim |
| Athlete | `morgan@rowiq.demo` | Morgan Walsh |
| Athlete | `casey@rowiq.demo` | Casey Liu |
| Athlete | `riley@rowiq.demo` | Riley Torres |
| Athlete | `jamie@rowiq.demo` | Jamie Scott |

Team invite code: **CAL-ROW-2026**

---

## Running Locally (Demo Mode)

No Supabase required — the app runs fully on in-memory mock data.

```bash
npm install
npm run dev        # http://localhost:5173
```

---

## Deploying to Production

### Prerequisites

- [Vercel](https://vercel.com) account (free)
- [Supabase](https://supabase.com) account (free)
- Node.js 20+

---

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `rowiq`, pick a region close to your users
3. Save the **database password**

---

### Step 2: Run the Database Schema

In the Supabase Dashboard → **SQL Editor**:

1. Paste and run `supabase/migrations/001_initial_schema.sql`

This creates all tables, indexes, RLS policies, and the auto-profile trigger.

---

### Step 3: Create Demo Auth Users

In **Authentication → Users → Add user** (or use the Supabase CLI):

```bash
npx supabase auth users create --email coach@rowiq.demo --password Demo1234!
# Repeat for all 9 demo accounts listed above
```

Note the UUID for each user from the Auth dashboard.

---

### Step 4: Seed Demo Data

1. Open `supabase/seed.sql`
2. Replace the `REPLACE_WITH_*_UUID` placeholders at the top with real UUIDs from Step 3
3. Paste and run in the **SQL Editor**

---

### Step 5: Get Supabase API Keys

In **Settings → API**:
- Copy **Project URL** (e.g. `https://abcxyz.supabase.co`)
- Copy **anon/public** key

---

### Step 6: Deploy to Vercel

```bash
npm install -g vercel
vercel

# When prompted for environment variables, add:
#   VITE_SUPABASE_URL = https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY = your-anon-key
```

Or via the Vercel Dashboard:
1. Import your GitHub repo
2. Add environment variables in **Project Settings → Environment Variables**
3. Redeploy

The `vercel.json` already contains the SPA rewrite rule — no extra config needed.

---

### Step 7: Verify PWA

1. Open your Vercel URL on a mobile browser
2. Chrome Android: banner appears to "Add to Home Screen"
3. Safari iOS: Share → Add to Home Screen
4. Run Lighthouse audit (target: PWA score ≥ 90)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Radix UI |
| State | Zustand (auth) + TanStack Query |
| Charts | Recharts |
| Backend | Supabase (Auth + Postgres + Realtime) |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | Vercel + Supabase (both free tier) |

## Project Structure

```
src/
├── features/
│   ├── auth/       # Login, RegisterCoach, RegisterAthlete
│   ├── coach/      # Dashboard, Roster, Calendar, AthleteProfile, CreateSession
│   ├── athlete/    # Today, MorningCheckin, PostSession, History, Calendar, Profile
│   └── messaging/  # Coach ↔ Athlete messages
├── components/
│   ├── ui/         # Button, Card, Badge, Input, Slider, etc.
│   └── layout/     # AppShell (top bar + bottom nav)
├── lib/
│   ├── mock-data.ts   # All demo data (used when Supabase env vars absent)
│   ├── supabase.ts    # Supabase client
│   └── utils.ts       # Helpers
├── stores/
│   └── auth.ts        # Zustand auth store (demo + real Supabase modes)
└── types/
    └── database.ts    # Full TypeScript type system
supabase/
├── migrations/
│   └── 001_initial_schema.sql
└── seed.sql
```

## Development Notes

- **Demo mode**: Automatically active when `VITE_SUPABASE_URL` is not set. All data is in-memory.
- **Path aliases**: `@/` maps to `src/`
- **PWA**: Service worker pre-caches all assets; Supabase API calls use NetworkFirst strategy
- **RLS**: All tables have Row Level Security — athletes only see their own data; coaches see all team data
by78uby7un
