# VyNexa Connect — Enterprise System Implementation Document

> **Document Version**: 3.2.0  
> **Last Updated**: October 2026  
> **Target Runtime**: Cloudflare Workers / Nitro (`.output/server/wrangler.json`), TanStack Start (SSR), Supabase PostgreSQL, Cloudflare D1, Cloudflare RealtimeKit.

---

## 1. Executive Summary & Architecture Overview

**VyNexa Connect** (Project VyNexa by Vyntyra Consultancy Services) is an enterprise-grade corporate careers, talent onboarding, Computer-Based Testing (CBT), proctoring, and video collaboration platform.

```
                      ┌───────────────────────────────────────────┐
                      │            Client Browser (PWA)           │
                      │  - React 19 / TanStack Router (SSR)       │
                      │  - TensorFlow.js Prohibited Device Vision │
                      │  - 24-Hour Cookie Lifecycle Management    │
                      └─────────────────────┬─────────────────────┘
                                            │
                       HTTPS / WebSocket (Cloudflare CDN)
                                            │
                      ┌─────────────────────▼─────────────────────┐
                      │ Cloudflare Workers / Nitro Server Engine  │
                      │  - TanStack Start Server Functions        │
                      │  - Strict 24-Hr Cookie Header Optimization│
                      │  - Zero-Overhead Blank Canvas Streaming   │
                      └──────────────┬──────────────────┬─────────┘
                                     │                  │
                ┌────────────────────┴───┐          ┌───┴────────────────────┐
                ▼                        ▼          ▼                        ▼
     ┌──────────────────────┐  ┌──────────────┐  ┌───────┐         ┌──────────────────┐
     │ Supabase PostgreSQL  │  │Supabase Auth │  │  R2   │         │  Cloudflare D1   │
     │  - Applications      │  │  - RBAC      │  │Storage│         │  - RealtimeKit   │
     │  - CBT Exam Master   │  │  - Sessions  │  │(CV/PDF│         │    Meeting Rooms │
     │  - Exam Submissions  │  │              │  │)      │         │    & Schedules   │
     └──────────────────────┘  └──────────────┘  └───────┘         └──────────────────┘
```

### Core Technology Stack:
1. **Frontend / Routing**: TanStack Start + TanStack Router (SSR + Client-side navigation), React 19, Tailwind CSS, Lucide Icons, Radix UI.
2. **Edge Server Runtime**: Nitro compiled for Cloudflare Workers (`nitro: { preset: 'cloudflare-pages' / 'cloudflare-module' }`).
3. **Database & Auth**: Supabase PostgreSQL (Row-Level Security, Realtime subscriptions, Auth for Admin, Employee, and Interns).
4. **Computer Vision & AI Proctoring**: `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, `@tensorflow-models/coco-ssd` for browser-edge unauthorized device detection.
5. **Video & WebRTC**: Cloudflare RealtimeKit (`@cloudflare/realtimekit`, `@cloudflare/realtimekit-react-ui`) for meeting rooms and proctoring video feeds.
6. **Cookie & Header Optimization**: Custom 24-hour cookie clearing lifecycle engine (`src/lib/cookie-maintenance.ts`) preventing Cloudflare Worker CPU limits (Error 1102).

---

## 2. Directory Structure & Key Modules

```
c:\Users\Jamia\Downloads\VyNexa Connect\
├── src\
│   ├── components\
│   │   ├── admin-cbt-operations.tsx          # CBT Exam Master, Attempts, Proctoring & Screen Share Config
│   │   ├── admin-dynamic-feedbacks-view.tsx   # Dynamic candidate feedback dispatcher
│   │   ├── admin-intern-tasks-view.tsx        # Task assignment, cohort rollover, credit manager
│   │   ├── cbt-streams.tsx                    # Live proctoring monitor & blank screen stream switcher
│   │   ├── email-automation-hub.tsx           # Automated bulk email dispatcher & tracking
│   │   ├── monthly-calendar.tsx               # Enterprise schedule & meeting visualizer
│   │   ├── ui\                                # Reusable UI component library (Radix UI / Tailwind)
│   │   │   ├── sidebar.tsx                    # App sidebar with 24-hour cookie max-age
│   │   │   └── vyntyra-meet-admin.tsx         # Vyntyra Meet room scheduler & password gate
│   ├── hooks\
│   │   └── useProctoringEnforcement.ts        # TensorFlow device detection, focus, fullscreen & hotkeys
│   ├── lib\
│   │   ├── cbt.functions.ts                   # CBT assessment CRUD, evaluation, questions & marksheet
│   │   ├── cbt-report.ts                      # High-fidelity PDF test report generation
│   │   ├── cookie-maintenance.ts              # 24-hour cookie cleaner & Cloudflare Worker CPU protector
│   │   ├── meetings.functions.ts              # Cloudflare D1 meeting rooms & token minting
│   │   ├── operations.functions.ts            # Candidate operations, NOCs, tasks, and payouts
│   │   └── workflow.functions.ts              # Candidate recruitment pipelines & selection email automation
│   └── routes\
│       ├── __root.tsx                         # Root shell, 24-hr cookie cleaner hook, SEO metadata
│       ├── index.tsx                          # Landing page & public portal
│       ├── careers.tsx                        # Job application portal & CV upload
│       ├── status.tsx & status.$token.tsx     # Candidate application & exam tracking
│       ├── auth\
│       │   ├── admin.tsx                      # Admin sign-in
│       │   ├── employee.tsx                   # Employee/mentor sign-in
│       │   └── intern.tsx                     # Intern sign-in with 24-hour session security
│       ├── _authenticated\
│       │   ├── route.tsx                      # Authenticated session boundary & auto cookie invalidation
│       │   ├── intern.tsx                     # Intern workspace, tasks, CBT exams & retake actions
│       │   ├── employee.tsx                   # Mentor grading, report approvals & meetings
│       │   ├── admin\
│       │   │   ├── index.tsx                  # Executive dashboard
│       │   │   ├── operations.tsx             # Candidate lifecycle & CBT proctoring operations
│       │   │   └── email-campaigns.tsx        # Email automation center
│       │   └── cbt\
│       │       ├── $testId.tsx                # Live exam screen: dual timers, all Q-types, AI proctoring
│       │       └── results\$testId.tsx        # Exam marksheet, accuracy breakdown, retake CTA & PDF export
│       └── meet\
│           └── $roomId.tsx                    # WebRTC meeting room gateway with intern RBAC & password gate
└── supabase\migrations\                       # SQL schema definitions & database migrations
```

---

## 3. Comprehensive Breakdown by Page & Module

### 3.1. Public & Candidate Pages

#### `src/routes/index.tsx` (`/`)
- **Purpose**: Brand showcase, company mission, active search engine demonstration, dynamic portal modules, and quick access navigation.
- **Key Features**:
  - Dynamically responds to admin module toggles (e.g. applications open/closed).
  - High-performance SEO metadata with JSON-LD Organization and Careers schema.
  - Zero heavy third-party tracking scripts to guarantee sub-second Time to Interactive (TTI).

#### `src/routes/careers.tsx` (`/careers`)
- **Purpose**: Talent recruitment and candidate application portal.
- **Key Features**:
  - Domain selector: Tech, Management, Design, Operations, Data Analytics.
  - Multi-page application wizard with real-time field validation via Zod.
  - Resume / CV file upload directly to Supabase storage bucket (`resumes`).
  - Integrated Cloudflare Turnstile CAPTCHA to mitigate spam bots without degrading user experience.
  - Dispatches automated confirmation emails upon receipt via `applications.functions.ts`.

#### `src/routes/status.tsx` & `status.$token.tsx` (`/status`, `/status/:token`)
- **Purpose**: Real-time application tracker for candidates.
- **Key Features**:
  - Authenticated via secure candidate tracking token (`status.$token.tsx`).
  - Displays dynamic timeline: *Application Submitted → Under Review → CBT Assessment Allocated → Interview → Offer Letter Generated*.
  - When CBT assessment is scheduled, renders a direct launch button into `/cbt/:testId`.
  - In-app preview and download of official Offer Letters and NOCs.

#### `src/routes/verify.tsx` (`/verify`)
- **Purpose**: Public verification portal for certificates, letters of recommendation, and NOCs issued by Vyntyra.
- **Key Features**:
  - Instant validation of QR codes printed on PDF credentials.
  - Verifies cryptographically signed verification hashes against Supabase database records.

---

### 3.2. Authentication System & 24-Hour Cookie Lifecycle

#### `src/routes/auth/intern.tsx` (`/auth/intern`)
- **Session Duration**: Strictly **24 hours** (`24 * 60 * 60 * 1000 ms`).
- **Cookie Policy**: `vyntyra_intern_session_id` and `vyntyra_intern_session_expiry` are set with `max-age=86400; path=/; SameSite=Lax`.
- **Audit Logging**: Each successful authentication records the IP, user agent, session ID, and expiration timestamp to the server audit log via `recordSession`.

#### `src/routes/_authenticated/route.tsx`
- **Session Boundary**: Wraps all private routes (`/admin`, `/intern`, `/employee`, `/cbt`).
- **Defensive Expiry Enforcement**:
  - Evaluates `localStorage.getItem("vyntyra_intern_session_expiry")`.
  - If expired or when user logs out (`SIGNED_OUT` event), automatically calls `clearAllCookies()`, deletes session tokens, and redirects the user to the appropriate login portal.

#### `src/lib/cookie-maintenance.ts` (CPU Limit & Header Protection)
- **Problem Solved**: Stale session cookies accumulated over weeks previously caused incoming HTTP headers to exceed 4KB. In Cloudflare Workers / Nitro, parsing bloated cookie headers on every SSR request rapidly exhausted the 10ms–50ms CPU execution budget (Cloudflare Error 1102).
- **Core Functions**:
  - `clearAllCookies()`: Comprehensive multi-domain and multi-path cookie deletion with `max-age=0` and past expiry dates.
  - `run24HourCookieMaintenance()`: Reads `vynexa_last_cookie_purge_v1`. If 24 hours have elapsed or total cookie length exceeds 2048 bytes, flushes all stale cookies immediately.
  - `use24HourCookieCleaner()`: Hook attached to `RootComponent` in `src/routes/__root.tsx`. Runs on component mount, on window focus, and on a 30-minute interval.

---

### 3.3. Computer-Based Testing (CBT) & Assessment Engine

#### `src/routes/_authenticated/cbt/$testId.tsx` (`/cbt/:testId`)
The live assessment environment features enterprise-grade isolation and dual timing:

1. **Dual Independent Timers**:
   - **Overall Test Timer**: Displays remaining time for the entire examination. When 0 is reached, triggers auto-submission.
   - **Isolated Per-Question Timer**: Controlled via `questionTimersRef` and synchronized with `per_question_time_limit`. Navigating between questions preserves individual elapsed times without bleeds or total resets.
2. **Complete Question Type Support**:
   - `single_choice`: Radio selection.
   - `multiple_choice`: Multi-select checkboxes.
   - `true_false`: Intuitive Boolean toggles.
   - `scenario`: Case study prompt with detailed question text.
   - `code_snippet` & `coding`: Interactive code evaluation editor.
   - `written`: Essay/short-answer text area.
3. **AI Proctoring & Real-Time Malpractice Engine**:
   - **Webcam Feed**: Monitored via `useProctoringEnforcement`.
   - **TensorFlow COCO-SSD Model**: Scans camera frames at regular intervals for prohibited objects (`cell phone`, `laptop`, `tv`, `remote`, `tablet`).
   - **Center Screen Warning Overlay**: If a device is detected, immediately presents a bold, high-contrast center alert notifying the candidate of violation.
   - **Environment Integrity**: Blocks right-click, copy-paste, fullscreen exits, tab switches, and window blur.
   - **Ctrl Keys Toggle**: When `allow_ctrl_keys = false`, intercepts `Ctrl+C`, `Ctrl+V`, `Ctrl+T`, `Ctrl+W`, `Ctrl+N`, `Alt+Tab`.
   - **Proctoring Modes**:
     - `disabled`: Open environment.
     - `camera_only`: Logs events and alerts user; does not prematurely end test.
     - `camera_malpractice`: Enforces strict violation limits; auto-submits exam on persistent malpractice.
4. **Admin-Managed External Screen Sharing**:
   - Checks `exam.allow_screen_share`. If disabled by admin, zero-overhead blank canvas stream (`createBlankCanvasTrack`) is used as fallback, ensuring no unwanted desktop content is captured or broadcasted.
5. **Post-Exam Retake Button**:
   - If candidate finishes and `remainingAttempts > 0`, a prominent **"Retake Assessment"** button is displayed immediately in the completion dialog.

#### `src/routes/_authenticated/cbt/results/$testId.tsx` (`/cbt/results/:testId`)
- **Score Calculation & Statistics**: Accurate percentage score calculated against total marks.
- **Accuracy Breakdown**: Displays exact counts of **Correct**, **Incorrect**, and **Skipped / Unanswered** questions.
- **Question-by-Question Review**: Shows question prompt, selected answer, correct answer, status badge, and detailed explanation.
- **Retake Assessment CTA**: Available directly on the marksheet if the test configuration allows multiple attempts (`max_attempts = 3` or `unlimited`).
- **PDF Report Download**: Built using `jspdf` and `jspdf-autotable` via `src/lib/cbt-report.ts` for formal corporate records.

---

### 3.4. Candidate & Intern Dashboard (`/intern`)

#### `src/routes/_authenticated/intern.tsx`
- **Assessment Management & Retake Buttons**:
  - Displays all allocated CBT tests.
  - Shows test status (`Not Started`, `In Progress`, `Completed`, `Evaluated`).
  - Shows total allocated attempts and remaining attempts.
  - **Dynamic Retake Button**: If a test has been attempted but remaining attempts exist, displays a green **"Retake Test"** button alongside the "Review Results" button.
- **Task Workspace**:
  - Filter tasks by status: *Assigned, In Review, Completed, Needs Revision*.
  - Task rich descriptions, attachments, and GitHub/Drive submission URLs.
  - Credit tracking and milestone progress bars.
- **Meeting Widget**: Automatically shows scheduled Vyntyra Meet video sessions mirrored from Cloudflare D1.
- **Credential Downloads**: One-click download of official Offer Letters, Certificates, and NOCs once approved by admin.

---

### 3.5. Admin Operations & Command Center (`/admin`, `/admin/operations`)

#### `src/components/admin-cbt-operations.tsx`
The primary control panel for all enterprise CBT exams:
1. **Attempt Configuration**:
   - Set attempts to **Single (1)**, **3 Times**, or **Unlimited**.
   - Admin can reset a specific candidate's attempts or modify test quotas on the fly.
2. **Proctoring Mode Selector**:
   - `Disabled`: Standard testing without camera checks.
   - `Camera Only`: Web-cam enabled, real-time logging, warning notifications.
   - `Camera + Direct Malpractice`: Automatic exam termination on device detection or tab switching violations.
3. **Proctoring Controls**:
   - **`Allow Ctrl Keys`**: Toggle to permit or block keyboard combinations.
   - **`Allow Screen Share`**: Admin toggle to enable candidate screen sharing or keep external screen sharing blank.
4. **Exam Paper Management**:
   - Dynamic subject-adaptive question generation using Gemini AI (`src/lib/cbt.functions.ts`).
   - Download complete printable test paper (PDF / formatted document).
   - Test adjustments modal: modify duration, passing percentage, and deadline.
   - Cascade delete for exams and all associated candidate attempts.

#### `src/components/cbt-streams.tsx` (Live Proctoring Monitor)
- **Live Video Grid**: Real-time feeds of all active candidates.
- **Dynamic Screen Display**:
  - If `allow_screen_share` is active, displays the candidate's shared desktop.
  - If `allow_screen_share` is disabled, displays a secure blank canvas with an informative placeholder ("Screen Sharing Disabled by Administrator"), completely eliminating unauthorized data leakage and saving edge bandwidth.

---

### 3.6. Vyntyra Meet Video Collaboration (`/meet/:roomId`)

#### `src/routes/meet/$roomId.tsx` & `src/lib/meetings.functions.ts`
- **Engine**: Cloudflare RealtimeKit WebRTC SDK.
- **Dual Access Modes**:
  - **Internal Meeting**: Requires active Supabase session. If `allowedEmails` list is provided, only explicitly whitelisted interns can enter; unauthorized users see an `Access Denied` gate.
  - **External Meeting**: Public guests can enter with their name and meeting password/PIN.
- **Super Hosts & Hosts**: Specified by email in admin scheduler. Automatically assigned `group_call_host` permissions upon room entry.
- **Automatic Sync**: Mirrored directly to the Supabase `meetings` table, appearing instantly on intern dashboards.

---

## 4. Database Schema Reference

### `cbt_exams` Table
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `title` | `text` | Exam title |
| `category` | `text` | Domain / Subject |
| `duration_minutes` | `integer` | Overall exam countdown duration |
| `per_question_time_limit` | `integer` | Isolated seconds per question (or null for untimed) |
| `max_attempts` | `integer` | 1, 3, or null (unlimited) |
| `proctoring_mode` | `text` | `'disabled'`, `'camera_only'`, `'camera_malpractice'` |
| `allow_ctrl_keys` | `boolean` | Whether Ctrl key shortcuts are allowed |
| `allow_screen_share` | `boolean` | Whether external screen sharing is enabled |
| `is_active` | `boolean` | Active / Inactive status |

### `cbt_exam_submissions` Table
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `exam_id` | `uuid` | Foreign key to `cbt_exams.id` (CASCADE delete) |
| `candidate_id` | `uuid` | Intern / Candidate ID |
| `score` | `numeric` | Final score achieved |
| `accuracy_stats` | `jsonb` | `{ correct: N, incorrect: N, skipped: N, total: N }` |
| `attempt_number` | `integer` | Current attempt index (1, 2, 3...) |
| `proctoring_logs` | `jsonb` | Malpractice logs, detected objects, timestamps |
| `status` | `text` | `'in_progress'`, `'completed'`, `'terminated'` |

---

## 5. Build, Preview, and Deployment Guide

### Prerequisites
- Node.js 20+ / 22+
- npm or bun

### 1. Environment Configuration (`.env`)
```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
CLOUDFLARE_D1_DATABASE_ID="your-d1-db-id"
REALTIMEKIT_API_KEY="your-realtimekit-api-key"
```

### 2. Local Development
```bash
npm install
npm run dev
```

### 3. Production Build
```bash
npm run build
```
The build invokes `vite build` followed by Nitro compilation into `.output/`:
- `.output/public`: Client assets, scripts, stylesheets, PWA manifest.
- `.output/server`: Cloudflare Workers bundle and Nitro route manifest (`wrangler.json`).

### 4. Deployment
To deploy to Cloudflare Pages or Cloudflare Workers:
```bash
npx wrangler pages deploy .output/public
# OR using nitro deploy
npx nitro deploy --prebuilt
```

---

## 6. Detailed AI Agent & Developer Rebuild Prompt

If you ever need an autonomous coding agent, Lovable, or another engineer to rebuild, reproduce, or verify this entire system from scratch, use the detailed, unambiguous prompt below:

```markdown
You are tasking an autonomous AI fullstack engineer to build or verify "VyNexa Connect" — an enterprise recruitment, CBT assessment, proctoring, and video collaboration platform built on TanStack Start (SSR) and Cloudflare Workers.

### 1. Architectural Architecture & Edge Runtime Constraints:
- Framework: TanStack Start with TanStack Router, React 19, Tailwind CSS.
- Target Hosting: Cloudflare Workers / Nitro.
- CPU Preservation Rule: Cloudflare Workers has strict 10ms–50ms execution limits. You MUST implement an automated 24-hour cookie clearing lifecycle (`src/lib/cookie-maintenance.ts`) that enforces `max-age=86400` on all session cookies (`vyntyra_intern_session_id`, `sidebar_state`). When 24 hours have elapsed or total cookie size exceeds 2048 bytes, immediately purge all cookies via `clearAllCookies()` to prevent header bloat and Cloudflare Error 1102.
- Authenticated Layout (`src/routes/_authenticated/route.tsx`): Verify `vyntyra_intern_session_expiry`. If expired or on `SIGNED_OUT`, flush all cookies and redirect to `/auth/intern`.

### 2. CBT Assessment & Multi-Attempt Retake Engine:
- Database Schema (`cbt_exams`): Must support `max_attempts` (1, 3, or null for unlimited), `proctoring_mode` ('disabled' | 'camera_only' | 'camera_malpractice'), `allow_ctrl_keys` (boolean), `allow_screen_share` (boolean), `duration_minutes` (integer), and `per_question_time_limit` (integer).
- Candidate & Intern Dashboard (`/intern`): In the CBT assessments card, show total attempts and remaining attempts. If remaining attempts > 0 after an attempt, show a green "Retake Assessment" button alongside "Review Results".
- Live Exam Screen (`/cbt/$testId`):
  1. Implement Dual Timers: Total test countdown AND isolated per-question countdown (`questionTimersRef`) that persists per question without bleeding into other questions.
  2. Implement all question types: single_choice, multiple_choice, true_false, scenario, coding/code_snippet, and written essay.
  3. AI Proctoring: Load `@tensorflow-models/coco-ssd` to scan the webcam feed. If any prohibited device ('cell phone', 'laptop', 'tv', 'remote', 'tablet') is detected, display a prominent center screen warning overlay. Enforce blur, tab switch, and fullscreen exit limits.
  4. Proctoring Modes: 'disabled' (no check), 'camera_only' (logs & warnings only), 'camera_malpractice' (immediate exam termination if violations exceed threshold).
  5. Screen Sharing: Honor `allow_screen_share`. If disabled by admin, feed a zero-overhead blank canvas track (`createBlankCanvasTrack`) so candidate screens remain completely blank on proctoring feeds.
  6. Post-Exam Overlay: Display score, completion status, and a "Retake Test" button if attempts remain.
- Results Screen (`/cbt/results/$testId`): Display total score, accuracy breakdown (Correct, Incorrect, Skipped counts), next attempt recommendations, Retake button, and downloadable high-res PDF report.

### 3. Admin Command Center (`/admin/operations`):
- Exam Master panel must feature:
  1. Attempts Selector: Single, 3 attempts, Unlimited.
  2. Proctoring Mode Selector: Disabled, Camera Only, Camera + Direct Malpractice.
  3. Security Switches: Toggle Ctrl Keys and Toggle External Screen Sharing.
  4. Test Adjustments Modal: Duration, deadline, passing marks, and cascade delete.

### 4. Vyntyra Meet (`/meet/$roomId`):
- Built on Cloudflare RealtimeKit WebRTC.
- Internal mode requires authenticated intern email whitelist.
- External mode presents an encrypted password/PIN gate.
- Mirrored to Supabase `meetings` table for instant calendar display on intern dashboards.

Verify the entire build by running `npm run build` and ensure clean TypeScript compilation with zero errors.
```
