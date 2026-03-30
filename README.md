# AssignmentHub

A full-stack team assignment management dashboard with AI-powered task creation, automated scheduling, real-time analytics, and role-based access control.

Built with **Next.js 16**, **Supabase**, **TypeScript**, and the **Gemini API**.

---

## Features

### Core
- **Dashboard** — Stat cards (Total, Completed, Overdue, Completion Rate) + Velocity Trends bar chart
- **Assignments CRUD** — Create, edit, delete assignments with priority, status, due dates, tags, and multiple assignees
- **Real-Time Sync** — Polling engine refreshes data every 30 seconds across all tabs

### Scheduling Engine
- **Recurring Schedules** — Daily, Weekly (pick days), Monthly (pick dates) with configurable trigger times
- **Auto-Creation** — Background cron engine checks schedules and auto-creates assignments at trigger time
- **Calendar View** — 35-day grid showing real assignments + projected scheduled "ghost" items

### AI Chatbot
- **Natural Language** — "Create a weekly assignment for reports every Monday at 9 AM"
- **Entity Extraction** — Parses title, description, recurrence, priority, and assignee from conversation
- **System Knowledge** — Can answer questions about the app ("How does scheduling work?", "Can members edit tasks?")
- **Preview & Confirm** — Shows extracted data card before creating

### Access Control
- **Admin** — Full CRUD on everything; sees Schedules, Templates, and Settings tabs
- **Member** — Can only change assignment status; scoped to their own tasks
- **Overdue Lockout** — System-enforced; no manual override of overdue status

### Templates
- **Save & Reuse** — Create assignment blueprints for recurring task patterns
- **Quick Create** — One-click to spawn a new assignment from any template

### Export
- **CSV** — Download assignments as a spreadsheet
- **PDF** — Print-formatted dark-themed report

### UI/UX
- **Dark / Light Mode** — Toggle with localStorage persistence
- **Toast Notifications** — Success/error/info feedback on all actions
- **Page Transitions** — Smooth fade+slide animation on tab switches
- **Mobile Responsive** — Hamburger drawer navigation on small screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| AI | Google Gemini API (gemini-2.0-flash) |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |

---

## Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://aistudio.google.com) (free tier)

### 1. Clone & Install

```bash
git clone <repo-url>
cd FullstackManagementSystem
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Database Setup

Open the **Supabase SQL Editor** and run the contents of `supabase-schema.sql`. This creates all tables, triggers, RLS policies, and functions.

Then run the admin policies:

```sql
create policy "Admins can update any profile" on public.profiles
for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins can delete profiles" on public.profiles
for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
```

### 4. Supabase Auth Config

In your Supabase Dashboard → **Authentication → Settings**, disable **"Confirm email"** to avoid rate-limiting during development.

### 5. Background Scheduling (Optional)

To enable fully autonomous schedule processing (even when no browser is open), enable `pg_cron` in Supabase:

1. Go to **Database → Extensions** → Enable `pg_cron`
2. Run in SQL Editor:
```sql
select cron.schedule(
  'process-schedules-every-minute',
  '* * * * *',
  $$select public.process_schedules();$$
);
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first registered user becomes Admin.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard (Server Component)
│   ├── layout.tsx                  # Root layout with providers
│   ├── login/page.tsx              # Auth page
│   ├── actions/
│   │   ├── assignments.ts          # Assignment CRUD + polling
│   │   ├── schedules.ts            # Schedule CRUD
│   │   ├── templates.ts            # Template CRUD
│   │   └── admin.ts                # User management actions
│   └── api/
│       ├── chat/route.ts           # Gemini AI endpoint
│       ├── cron/process-schedules/ # Schedule execution engine
│       └── webhooks/assignment/    # Webhook endpoint
├── components/
│   ├── AssignmentList.tsx           # Filterable assignment grid
│   ├── AssignmentModal.tsx          # Create/edit slide-over panel
│   ├── ScheduleList.tsx             # Schedule cards with pause/delete
│   ├── ScheduleModal.tsx            # Schedule configurator
│   ├── CalendarTab.tsx              # 35-day forecast calendar
│   ├── TemplatesTab.tsx             # Template grid + quick create
│   ├── AdminSettingsTab.tsx         # User role management
│   ├── AnalyticsChart.tsx           # Velocity trends bar chart
│   ├── ChatbotPanel.tsx             # AI chatbot slide-out
│   ├── ExportButton.tsx             # CSV + PDF export
│   ├── MobileNav.tsx                # Hamburger menu + theme toggle
│   ├── PageTransition.tsx           # Tab switch animation
│   ├── RealtimeListener.tsx         # Polling engine
│   ├── ToastProvider.tsx            # Global toast notification system
│   └── ThemeProvider.tsx            # Dark/light mode context
├── types/
│   └── database.ts                  # TypeScript interfaces
└── utils/
    ├── export.ts                    # CSV + PDF generation
    └── supabase/                    # Supabase client helpers
```

---

## API Reference

### Server Actions

| Action | File | Description |
|---|---|---|
| `createAssignment(fd)` | `assignments.ts` | Create a new assignment (admin only) |
| `updateAssignment(id, fd)` | `assignments.ts` | Update title, description, priority, status, due date |
| `deleteAssignment(id)` | `assignments.ts` | Delete an assignment (admin only) |
| `pulseRefresh()` | `assignments.ts` | Force server-side cache revalidation |
| `createSchedule(fd)` | `schedules.ts` | Create a recurring schedule |
| `updateSchedule(id, fd)` | `schedules.ts` | Update schedule config |
| `deleteSchedule(id)` | `schedules.ts` | Delete a schedule |
| `toggleSchedule(id, paused)` | `schedules.ts` | Pause/resume a schedule |
| `createTemplate(fd)` | `templates.ts` | Save an assignment template |
| `deleteTemplate(id)` | `templates.ts` | Delete a template |
| `updateUserRole(id, role)` | `admin.ts` | Change user role (admin only) |
| `deleteUser(id)` | `admin.ts` | Remove a user (admin only) |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | POST | Gemini AI — accepts `{ prompt }`, returns structured JSON |
| `/api/cron/process-schedules` | GET | Executes schedule engine, creates assignments if conditions met |
| `/api/webhooks/assignment` | POST | Webhook for external integrations |

---

## Testing

```bash
npm test          # Single run (26 tests)
npm run test:watch # Watch mode
```

### Test Coverage

| Suite | Tests | Coverage |
|---|---|---|
| Business Logic | 13 | Overdue detection, stats calculation, schedule recurrence matching |
| Export Utilities | 8 | CSV + PDF generation with edge cases |
| Component Rendering | 5 | Provider components, type validation |

---

## License

MIT
