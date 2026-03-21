<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
+-----------------------------------------------------------------------+
| **ENGINEERING TEAM**                                                  |
|                                                                       |
| **Full-Stack Architecture**                                           |
|                                                                       |
| **& Development Standards**                                           |
|                                                                       |
| ─────────────────────────────                                         |
|                                                                       |
| Folder Structure • App & Pages Layer • Components • Redis             |
|                                                                       |
| NestJS Microservices • API Gateway • Video Chunk Uploads              |
|                                                                       |
| Web Workers • TypeScript • Tailwind • Frontend Patterns               |
|                                                                       |
| Version 2.0 \| Confidential                                           |
+-----------------------------------------------------------------------+

**1. Architecture Overview**

This document is the single source of truth for how every part of the
project is built. Every developer must follow these standards when
creating any new page, component, service, hook, or Redis utility. No
exceptions.

  ----------------- ----------------------------------------------------------
  **Pillar**        **Standard**

  **app/**          Route files ONLY. Each route imports one page component
                    from pages/ and renders it. Nothing else.

  **pages/**        Full page compositions. One folder per feature (e.g.
                    pages/dashboard/Dashboard.page.tsx). No inline JSX logic.

  **components/**   Reusable, single-purpose UI components. Never tied to a
                    specific page. Props are the only contract.

  **redis/**        ALL Redis logic lives here exclusively. No Redis imports
                    anywhere else --- not pages, not components, not hooks.

  **hooks/**        Custom React hooks only. Every reusable stateful or async
                    pattern must be extracted here.

  **workers/**      Web Worker scripts for heavy client-side processing (video
                    validation, compression, thumbnail gen).

  **Backend**       NestJS API Gateway on :3000 routes to individual
                    microservices. Frontend only ever talks to :3000.
  ----------------- ----------------------------------------------------------

**2. Folder Structure --- Complete Reference**

Every file has exactly one correct home. When you create a new file,
find its responsibility in this tree and place it there. If it does not
fit, discuss with the team before creating a new folder.

**2.1 Frontend (src/)**

+-----------------------------------------------------------------------+
| src/                                                                  |
|                                                                       |
| ├── app/ ← ROUTING ONLY (Next.js App Router)                          |
|                                                                       |
| │ ├── (auth)/                                                         |
|                                                                       |
| │ │ ├── login/                                                        |
|                                                                       |
| │ │ │ └── page.tsx ← import LoginPage from                            |
| \'@/pages/auth/Login.page\'                                           |
|                                                                       |
| │ │ └── register/                                                     |
|                                                                       |
| │ │ └── page.tsx ← import RegisterPage from                           |
| \'@/pages/auth/Register.page\'                                        |
|                                                                       |
| │ ├── dashboard/                                                      |
|                                                                       |
| │ │ └── page.tsx ← import DashboardPage from                          |
| \'@/pages/dashboard/Dashboard.page\'                                  |
|                                                                       |
| │ ├── videos/                                                         |
|                                                                       |
| │ │ ├── page.tsx                                                      |
|                                                                       |
| │ │ └── \[id\]/                                                       |
|                                                                       |
| │ │ └── page.tsx                                                      |
|                                                                       |
| │ ├── layout.tsx ← Root layout wrapper only                           |
|                                                                       |
| │ └── api/ ← Next.js API routes (thin proxy to Gateway)               |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── pages/ ← FULL PAGE COMPOSITIONS                                   |
|                                                                       |
| │ ├── auth/                                                           |
|                                                                       |
| │ │ ├── Login.page.tsx                                                |
|                                                                       |
| │ │ └── Register.page.tsx                                             |
|                                                                       |
| │ ├── dashboard/                                                      |
|                                                                       |
| │ │ └── Dashboard.page.tsx                                            |
|                                                                       |
| │ └── videos/                                                         |
|                                                                       |
| │ ├── VideoList.page.tsx                                              |
|                                                                       |
| │ └── VideoDetail.page.tsx                                            |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── components/ ← REUSABLE UI COMPONENTS                              |
|                                                                       |
| │ ├── ui/ ← Design system atoms                                       |
|                                                                       |
| │ │ ├── Button/                                                       |
|                                                                       |
| │ │ │ ├── Button.tsx                                                  |
|                                                                       |
| │ │ │ └── Button.types.ts                                             |
|                                                                       |
| │ │ ├── Input/                                                        |
|                                                                       |
| │ │ ├── Modal/                                                        |
|                                                                       |
| │ │ ├── Badge/                                                        |
|                                                                       |
| │ │ └── Spinner/                                                      |
|                                                                       |
| │ ├── layout/ ← Structural chrome                                     |
|                                                                       |
| │ │ ├── Navbar/                                                       |
|                                                                       |
| │ │ ├── Sidebar/                                                      |
|                                                                       |
| │ │ └── PageWrapper/                                                  |
|                                                                       |
| │ ├── forms/ ← Form field groups & wrappers                           |
|                                                                       |
| │ │ ├── FormField/                                                    |
|                                                                       |
| │ │ └── ValidationMessage/                                            |
|                                                                       |
| │ └── features/ ← Domain-scoped composites                            |
|                                                                       |
| │ ├── VideoUploader/                                                  |
|                                                                       |
| │ │ ├── VideoUploader.tsx                                             |
|                                                                       |
| │ │ ├── VideoUploader.types.ts                                        |
|                                                                       |
| │ │ └── useVideoUploader.ts ← hook co-located with feature            |
|                                                                       |
| │ ├── MetricsGrid/                                                    |
|                                                                       |
| │ └── UserCard/                                                       |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── hooks/ ← GLOBAL CUSTOM HOOKS                                      |
|                                                                       |
| │ ├── useAsync.ts                                                     |
|                                                                       |
| │ ├── useDebounce.ts                                                  |
|                                                                       |
| │ ├── usePagination.ts                                                |
|                                                                       |
| │ └── useIntersectionObserver.ts                                      |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── workers/ ← WEB WORKERS (client-side heavy processing)             |
|                                                                       |
| │ ├── video.worker.ts ← Thumbnail gen, validation, compression        |
|                                                                       |
| │ └── image.worker.ts                                                 |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── redis/ ← ALL REDIS LOGIC (server-side helpers only)               |
|                                                                       |
| │ ├── client.ts                                                       |
|                                                                       |
| │ ├── keys.ts                                                         |
|                                                                       |
| │ ├── cache/                                                          |
|                                                                       |
| │ │ ├── session.ts                                                    |
|                                                                       |
| │ │ ├── user.ts                                                       |
|                                                                       |
| │ │ └── rate-limit.ts                                                 |
|                                                                       |
| │ └── queues/                                                         |
|                                                                       |
| │ └── video.queue.ts                                                  |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── lib/ ← Pure utilities & SDK clients                               |
|                                                                       |
| │ ├── api.ts ← Axios/Fetch wrapper for Gateway                        |
|                                                                       |
| │ ├── formatters.ts                                                   |
|                                                                       |
| │ └── validators.ts                                                   |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── types/ ← Shared TypeScript types                                  |
|                                                                       |
| │ ├── api.types.ts                                                    |
|                                                                       |
| │ ├── user.types.ts                                                   |
|                                                                       |
| │ └── video.types.ts                                                  |
|                                                                       |
| │                                                                     |
|                                                                       |
| └── styles/                                                           |
|                                                                       |
| └── globals.css                                                       |
+-----------------------------------------------------------------------+

**2.2 Backend (NestJS Microservices)**

+-----------------------------------------------------------------------+
| backend/                                                              |
|                                                                       |
| ├── gateway/ ← API Gateway --- PORT :3000 (only public port)          |
|                                                                       |
| │ ├── src/                                                            |
|                                                                       |
| │ │ ├── main.ts                                                       |
|                                                                       |
| │ │ ├── app.module.ts                                                 |
|                                                                       |
| │ │ ├── auth/                                                         |
|                                                                       |
| │ │ │ └── auth.controller.ts ← Receives request → forwards to Auth    |
| Service                                                               |
|                                                                       |
| │ │ ├── video/                                                        |
|                                                                       |
| │ │ │ └── video.controller.ts                                         |
|                                                                       |
| │ │ └── user/                                                         |
|                                                                       |
| │ │ └── user.controller.ts                                            |
|                                                                       |
| │ └── package.json                                                    |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── auth-service/ ← PORT :3001 (internal only, never public)          |
|                                                                       |
| │ ├── src/                                                            |
|                                                                       |
| │ │ ├── main.ts ← NestJS Microservice (TCP transport)                 |
|                                                                       |
| │ │ ├── auth.module.ts                                                |
|                                                                       |
| │ │ ├── auth.controller.ts ← \@MessagePattern(\'auth.login\')         |
|                                                                       |
| │ │ └── auth.service.ts                                               |
|                                                                       |
| │ └── package.json                                                    |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── video-service/ ← PORT :3002 (internal only)                       |
|                                                                       |
| │ ├── src/                                                            |
|                                                                       |
| │ │ ├── main.ts                                                       |
|                                                                       |
| │ │ ├── video.module.ts                                               |
|                                                                       |
| │ │ ├── video.controller.ts ← \@MessagePattern(\'video.upload\')      |
|                                                                       |
| │ │ └── video.service.ts                                              |
|                                                                       |
| │ └── package.json                                                    |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── user-service/ ← PORT :3003 (internal only)                        |
|                                                                       |
| │ └── src/ \...                                                       |
|                                                                       |
| │                                                                     |
|                                                                       |
| └── notification-service/ ← PORT :3004 (internal only)                |
|                                                                       |
| └── src/ \...                                                         |
+-----------------------------------------------------------------------+

**3. app/ vs pages/ --- The Two-Layer Rule**

This is the most important frontend rule. These two folders have
completely different jobs and must never be confused.

  ----------------------------------- -----------------------------------
  **app/ (Routing Layer)**            **pages/ (Composition Layer)**

  One file per route: page.tsx        One file per page:
                                      Dashboard.page.tsx

  Imports exactly ONE page component  Imports many components, assembles
                                      full UI

  No JSX logic, no useState, no       May use hooks, pass data, handle
  useEffect                           layout

  May pass route params as props      Receives props from app/ route file

  Handles Next.js metadata exports    No routing concerns whatsoever
  ----------------------------------- -----------------------------------

**app/dashboard/page.tsx --- Route File (Correct)**

+-----------------------------------------------------------------------+
| // app/dashboard/page.tsx                                             |
|                                                                       |
| // ✅ ONLY job: import the page component and render it               |
|                                                                       |
| import { Metadata } from \'next\';                                    |
|                                                                       |
| import { DashboardPage } from \'@/pages/dashboard/Dashboard.page\';   |
|                                                                       |
| export const metadata: Metadata = {                                   |
|                                                                       |
| title: \'Dashboard\',                                                 |
|                                                                       |
| description: \'Your activity overview\',                              |
|                                                                       |
| };                                                                    |
|                                                                       |
| export default function DashboardRoute() {                            |
|                                                                       |
| return \<DashboardPage /\>;                                           |
|                                                                       |
| }                                                                     |
|                                                                       |
| // ❌ NEVER do this inside app/page.tsx:                              |
|                                                                       |
| // - Define components                                                |
|                                                                       |
| // - Write useState / useEffect                                       |
|                                                                       |
| // - Import from redis/                                               |
|                                                                       |
| // - Put any JSX other than the single page component                 |
+-----------------------------------------------------------------------+

**pages/dashboard/Dashboard.page.tsx --- Page Composition (Correct)**

+-----------------------------------------------------------------------+
| // pages/dashboard/Dashboard.page.tsx                                 |
|                                                                       |
| // ✅ Assembles components into a full page. Uses hooks. Passes data  |
| down.                                                                 |
|                                                                       |
| \'use client\';                                                       |
|                                                                       |
| import { useMemo, useState } from \'react\';                          |
|                                                                       |
| import { DashboardHeader } from                                       |
| \'@/components/features/DashboardHeader/DashboardHeader\';            |
|                                                                       |
| import { MetricsGrid } from                                           |
| \'@/components/features/MetricsGrid/MetricsGrid\';                    |
|                                                                       |
| import { RecentActivity } from                                        |
| \'@/components/features/RecentActivity/RecentActivity\';              |
|                                                                       |
| import { VideoUploader } from                                         |
| \'@/components/features/VideoUploader/VideoUploader\';                |
|                                                                       |
| import { PageWrapper } from                                           |
| \'@/components/layout/PageWrapper/PageWrapper\';                      |
|                                                                       |
| import { useAsync } from \'@/hooks/useAsync\';                        |
|                                                                       |
| import { fetchDashboardData } from \'@/lib/api\';                     |
|                                                                       |
| import type { DashboardData } from \'@/types/api.types\';             |
|                                                                       |
| export function DashboardPage() {                                     |
|                                                                       |
| const \[activeTab, setActiveTab\] = useState\<\'overview\' \|         |
| \'videos\'\>(\'overview\');                                           |
|                                                                       |
| const { data, loading, error } =                                      |
| useAsync\<DashboardData\>(fetchDashboardData, \[\]);                  |
|                                                                       |
| const metrics = useMemo(() =\> {                                      |
|                                                                       |
| if (!data) return \[\];                                               |
|                                                                       |
| return data.metrics.filter(m =\> m.value \> 0).sort((a, b) =\>        |
| b.value - a.value);                                                   |
|                                                                       |
| }, \[data\]);                                                         |
|                                                                       |
| if (loading) return \<PageWrapper\>\<Spinner /\>\</PageWrapper\>;     |
|                                                                       |
| if (error) return \<PageWrapper\>\<ErrorBoundary /\>\</PageWrapper\>; |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<PageWrapper\>                                                       |
|                                                                       |
| \<DashboardHeader user={data!.user} activeTab={activeTab}             |
| onTabChange={setActiveTab} /\>                                        |
|                                                                       |
| {activeTab === \'overview\' && \<MetricsGrid metrics={metrics} /\>}   |
|                                                                       |
| {activeTab === \'videos\' && \<VideoUploader userId={data!.user.id}   |
| /\>}                                                                  |
|                                                                       |
| \<RecentActivity items={data!.recentItems} /\>                        |
|                                                                       |
| \</PageWrapper\>                                                      |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**4. Component Standards**

Every component must be reusable, single-purpose, and page-agnostic. A
component must never know which page it is rendered on.

**4.1 Component Rules**

  ---------- -------------------------------------------------------------
  **RULE**   One component = one clear UI responsibility. If a component
             is doing two things, split it into two.

  ---------- -------------------------------------------------------------

-   Props are the only external interface --- no hardcoded page-specific
    values

-   A component file must NOT define another full component inside it
    (except small private sub-components used only by that file)

-   Co-locate the component\'s dedicated hook inside its folder (see
    VideoUploader example above)

-   Use TypeScript interfaces in a separate .types.ts file for all props

-   All styling via Tailwind utility classes --- no inline styles, no
    CSS modules

**4.2 Functional vs. Class Components**

Default is always functional components with hooks. Use class components
ONLY in these specific cases:

  ----------------------------------- -----------------------------------
  **Use Functional Component**        **Use Class Component**

  All standard UI rendering           Error Boundaries (React
                                      requirement)

  State with useState / useReducer    getSnapshotBeforeUpdate lifecycle
                                      needed

  Side effects with useEffect         Legacy 3rd-party lib requires class

  Memoization with useMemo            Complex shouldComponentUpdate
                                      tuning
  ----------------------------------- -----------------------------------

**Standalone Class Component --- Error Boundary**

+-----------------------------------------------------------------------+
| // components/ui/ErrorBoundary/ErrorBoundary.tsx                      |
|                                                                       |
| // ✅ Class component --- the ONE valid non-hook use case             |
|                                                                       |
| import { Component, ErrorInfo, ReactNode } from \'react\';            |
|                                                                       |
| interface Props {                                                     |
|                                                                       |
| children: ReactNode;                                                  |
|                                                                       |
| fallback?: ReactNode;                                                 |
|                                                                       |
| onError?: (error: Error, info: ErrorInfo) =\> void;                   |
|                                                                       |
| }                                                                     |
|                                                                       |
| interface State { hasError: boolean; error?: Error; }                 |
|                                                                       |
| export class ErrorBoundary extends Component\<Props, State\> {        |
|                                                                       |
| state: State = { hasError: false };                                   |
|                                                                       |
| static getDerivedStateFromError(error: Error): State {                |
|                                                                       |
| return { hasError: true, error };                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| componentDidCatch(error: Error, info: ErrorInfo) {                    |
|                                                                       |
| this.props.onError?.(error, info);                                    |
|                                                                       |
| console.error(\'\[ErrorBoundary\]\', error.message,                   |
| info.componentStack);                                                 |
|                                                                       |
| }                                                                     |
|                                                                       |
| render() {                                                            |
|                                                                       |
| if (this.state.hasError) {                                            |
|                                                                       |
| return this.props.fallback ?? (                                       |
|                                                                       |
| \<div className=\'p-4 rounded-lg bg-red-50 border border-red-200\'\>  |
|                                                                       |
| \<p className=\'text-sm text-red-700\'\>Something went wrong. Please  |
| refresh.\</p\>                                                        |
|                                                                       |
| \</div\>                                                              |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| return this.props.children;                                           |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**5. Redis --- Isolated Architecture**

Redis logic is completely isolated inside the /redis folder. Nothing
outside this folder may instantiate a Redis client or write cache logic
inline. API routes and server actions import named helper functions
only.

  ---------- -------------------------------------------------------------
  **✗        import Redis from \'ioredis\' inside a page, component, or
  DON\'T**   API route

  ---------- -------------------------------------------------------------

  --------- -------------------------------------------------------------
  **✓ DO**  import { getUserProfile } from \'@/redis/cache/user\' ---
            always use named helpers

  --------- -------------------------------------------------------------

**5.1 Redis Folder Structure**

+-----------------------------------------------------------------------+
| redis/                                                                |
|                                                                       |
| ├── client.ts ← Singleton connection --- imported only by helpers     |
|                                                                       |
| ├── keys.ts ← ALL key strings defined here as factory functions       |
|                                                                       |
| ├── cache/                                                            |
|                                                                       |
| │ ├── session.ts ← get/set/delete session cache                       |
|                                                                       |
| │ ├── user.ts ← get/set/invalidate user profile cache                 |
|                                                                       |
| │ ├── rate-limit.ts ← increment/check rate limit counters             |
|                                                                       |
| │ └── search.ts ← cache search results with TTL                       |
|                                                                       |
| └── queues/                                                           |
|                                                                       |
| └── video.queue.ts ← BullMQ queue for async video processing jobs     |
+-----------------------------------------------------------------------+

**5.2 Singleton Client**

+-----------------------------------------------------------------------+
| // redis/client.ts                                                    |
|                                                                       |
| import Redis from \'ioredis\';                                        |
|                                                                       |
| let client: Redis \| null = null;                                     |
|                                                                       |
| export function getRedisClient(): Redis {                             |
|                                                                       |
| if (!client) {                                                        |
|                                                                       |
| client = new Redis({                                                  |
|                                                                       |
| host: process.env.REDIS_HOST!,                                        |
|                                                                       |
| port: Number(process.env.REDIS_PORT),                                 |
|                                                                       |
| password: process.env.REDIS_PASSWORD,                                 |
|                                                                       |
| maxRetriesPerRequest: 3,                                              |
|                                                                       |
| lazyConnect: true,                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| client.on(\'error\', err =\> console.error(\'\[Redis\]\',             |
| err.message));                                                        |
|                                                                       |
| }                                                                     |
|                                                                       |
| return client;                                                        |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**5.3 Key Factory --- No Magic Strings**

+-----------------------------------------------------------------------+
| // redis/keys.ts --- every Redis key string is defined here           |
|                                                                       |
| export const Keys = {                                                 |
|                                                                       |
| session: (userId: string) =\> \`session:\${userId}\`,                 |
|                                                                       |
| userProfile: (userId: string) =\> \`user:profile:\${userId}\`,        |
|                                                                       |
| rateLimit: (ip: string) =\> \`rate:\${ip}\`,                          |
|                                                                       |
| search: (query: string) =\> \`search:\${encodeURIComponent(query)}\`, |
|                                                                       |
| videoJob: (jobId: string) =\> \`video:job:\${jobId}\`,                |
|                                                                       |
| } as const;                                                           |
|                                                                       |
| // TTLs in seconds --- all defined centrally                          |
|                                                                       |
| export const TTL = {                                                  |
|                                                                       |
| session: 60 \* 60 \* 24, // 24 hours                                  |
|                                                                       |
| userProfile: 60 \* 60, // 1 hour                                      |
|                                                                       |
| search: 60 \* 5, // 5 minutes                                         |
|                                                                       |
| } as const;                                                           |
+-----------------------------------------------------------------------+

**5.4 Cache Helper --- Full Pattern**

+-----------------------------------------------------------------------+
| // redis/cache/user.ts                                                |
|                                                                       |
| import { getRedisClient } from \'../client\';                         |
|                                                                       |
| import { Keys, TTL } from \'../keys\';                                |
|                                                                       |
| import type { UserProfile } from \'@/types/user.types\';              |
|                                                                       |
| export async function getUserProfile(userId: string):                 |
| Promise\<UserProfile \| null\> {                                      |
|                                                                       |
| const redis = getRedisClient();                                       |
|                                                                       |
| const cached = await redis.get(Keys.userProfile(userId));             |
|                                                                       |
| return cached ? (JSON.parse(cached) as UserProfile) : null;           |
|                                                                       |
| }                                                                     |
|                                                                       |
| export async function setUserProfile(userId: string, profile:         |
| UserProfile): Promise\<void\> {                                       |
|                                                                       |
| const redis = getRedisClient();                                       |
|                                                                       |
| await redis.setex(Keys.userProfile(userId), TTL.userProfile,          |
| JSON.stringify(profile));                                             |
|                                                                       |
| }                                                                     |
|                                                                       |
| export async function invalidateUserProfile(userId: string):          |
| Promise\<void\> {                                                     |
|                                                                       |
| await getRedisClient().del(Keys.userProfile(userId));                 |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**6. NestJS Microservices & API Gateway**

The frontend communicates with exactly one URL: the API Gateway on port
3000. The gateway is the only service exposed to the outside world. It
receives every request, resolves which microservice handles it, forwards
the message via TCP, and returns the response. Individual services are
never directly accessible.

**6.1 Port Map**

  --------------- ---------------- ---------------- ----------------------
  **Service**     **Port**         **Visibility**   **Responsibility**

  **API Gateway** :3000            PUBLIC           Routes all requests →
                                                    correct microservice

  Auth Service    :3001            INTERNAL         Login, register, JWT,
                                                    refresh tokens

  Video Service   :3002            INTERNAL         Upload, process,
                                                    store, stream video

  User Service    :3003            INTERNAL         Profile CRUD,
                                                    preferences, settings

  Notification    :3004            INTERNAL         Email, push, in-app
  Service                                           notifications
  --------------- ---------------- ---------------- ----------------------

**6.2 How a Request Flows**

+-----------------------------------------------------------------------+
| Frontend → POST /api/auth/login → Gateway :3000                       |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| gateway decides: auth.login pattern                                   |
|                                                                       |
| ↓ TCP                                                                 |
|                                                                       |
| Auth Service :3001                                                    |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| validates, returns JWT payload                                        |
|                                                                       |
| ↓ TCP response                                                        |
|                                                                       |
| Gateway :3000                                                         |
|                                                                       |
| ↓ HTTP response                                                       |
|                                                                       |
| Frontend                                                              |
+-----------------------------------------------------------------------+

**6.3 Gateway Controller --- Forwarding Pattern**

+-----------------------------------------------------------------------+
| // gateway/src/auth/auth.controller.ts                                |
|                                                                       |
| import { Controller, Post, Body, Inject } from \'@nestjs/common\';    |
|                                                                       |
| import { ClientProxy } from \'@nestjs/microservices\';                |
|                                                                       |
| import { firstValueFrom } from \'rxjs\';                              |
|                                                                       |
| import { LoginDto } from \'./dto/login.dto\';                         |
|                                                                       |
| \@Controller(\'auth\')                                                |
|                                                                       |
| export class AuthController {                                         |
|                                                                       |
| constructor(                                                          |
|                                                                       |
| \@Inject(\'AUTH_SERVICE\') private readonly authClient: ClientProxy,  |
|                                                                       |
| ) {}                                                                  |
|                                                                       |
| \@Post(\'login\')                                                     |
|                                                                       |
| async login(@Body() dto: LoginDto) {                                  |
|                                                                       |
| // Forward to Auth microservice via TCP                               |
|                                                                       |
| return firstValueFrom(                                                |
|                                                                       |
| this.authClient.send(\'auth.login\', dto)                             |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| \@Post(\'register\')                                                  |
|                                                                       |
| async register(@Body() dto: RegisterDto) {                            |
|                                                                       |
| return firstValueFrom(                                                |
|                                                                       |
| this.authClient.send(\'auth.register\', dto)                          |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**6.4 Microservice Controller --- Message Pattern**

+-----------------------------------------------------------------------+
| // auth-service/src/auth.controller.ts                                |
|                                                                       |
| import { Controller } from \'@nestjs/common\';                        |
|                                                                       |
| import { MessagePattern, Payload } from \'@nestjs/microservices\';    |
|                                                                       |
| import { AuthService } from \'./auth.service\';                       |
|                                                                       |
| import { LoginDto } from \'./dto/login.dto\';                         |
|                                                                       |
| \@Controller()                                                        |
|                                                                       |
| export class AuthController {                                         |
|                                                                       |
| constructor(private readonly authService: AuthService) {}             |
|                                                                       |
| // ✅ Listens for \'auth.login\' message from Gateway                 |
|                                                                       |
| \@MessagePattern(\'auth.login\')                                      |
|                                                                       |
| async login(@Payload() dto: LoginDto) {                               |
|                                                                       |
| return this.authService.login(dto);                                   |
|                                                                       |
| }                                                                     |
|                                                                       |
| \@MessagePattern(\'auth.register\')                                   |
|                                                                       |
| async register(@Payload() dto: RegisterDto) {                         |
|                                                                       |
| return this.authService.register(dto);                                |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**6.5 Registering a Microservice Client in the Gateway**

+-----------------------------------------------------------------------+
| // gateway/src/app.module.ts                                          |
|                                                                       |
| import { Module } from \'@nestjs/common\';                            |
|                                                                       |
| import { ClientsModule, Transport } from \'@nestjs/microservices\';   |
|                                                                       |
| import { AuthController } from \'./auth/auth.controller\';            |
|                                                                       |
| import { VideoController } from \'./video/video.controller\';         |
|                                                                       |
| \@Module({                                                            |
|                                                                       |
| imports: \[                                                           |
|                                                                       |
| ClientsModule.register(\[                                             |
|                                                                       |
| {                                                                     |
|                                                                       |
| name: \'AUTH_SERVICE\',                                               |
|                                                                       |
| transport: Transport.TCP,                                             |
|                                                                       |
| options: { host: \'localhost\', port: 3001 },                         |
|                                                                       |
| },                                                                    |
|                                                                       |
| {                                                                     |
|                                                                       |
| name: \'VIDEO_SERVICE\',                                              |
|                                                                       |
| transport: Transport.TCP,                                             |
|                                                                       |
| options: { host: \'localhost\', port: 3002 },                         |
|                                                                       |
| },                                                                    |
|                                                                       |
| {                                                                     |
|                                                                       |
| name: \'USER_SERVICE\',                                               |
|                                                                       |
| transport: Transport.TCP,                                             |
|                                                                       |
| options: { host: \'localhost\', port: 3003 },                         |
|                                                                       |
| },                                                                    |
|                                                                       |
| {                                                                     |
|                                                                       |
| name: \'NOTIFICATION_SERVICE\',                                       |
|                                                                       |
| transport: Transport.TCP,                                             |
|                                                                       |
| options: { host: \'localhost\', port: 3004 },                         |
|                                                                       |
| },                                                                    |
|                                                                       |
| \]),                                                                  |
|                                                                       |
| \],                                                                   |
|                                                                       |
| controllers: \[AuthController, VideoController\],                     |
|                                                                       |
| })                                                                    |
|                                                                       |
| export class AppModule {}                                             |
+-----------------------------------------------------------------------+

**7. Video Upload --- Chunks & Client-Side Processing**

Video files are never sent in one request. All uploads use chunked
uploading via tus-js-client. All heavy client-side work (validation,
thumbnail generation, compression) runs inside a Web Worker so the UI
thread is never blocked.

**7.1 Full Upload Flow**

+-----------------------------------------------------------------------+
| User selects file                                                     |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Web Worker (workers/video.worker.ts) ← runs off main thread           |
|                                                                       |
| ├── Validate: size, type, duration                                    |
|                                                                       |
| ├── Generate thumbnail (canvas API)                                   |
|                                                                       |
| └── Optional: compress with WebCodecs API                             |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| tus-js-client (components/features/VideoUploader)                     |
|                                                                       |
| ├── Splits file into chunks (default 5MB each)                        |
|                                                                       |
| ├── Uploads chunk 1 → Gateway :3000 → Video Service :3002             |
|                                                                       |
| ├── Uploads chunk 2 ... (parallel or sequential)                      |
|                                                                       |
| ├── On network drop → auto-resumes from last chunk                    |
|                                                                       |
| └── onProgress callback → UI progress bar update                      |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Video Service :3002                                                   |
|                                                                       |
| ├── Assembles chunks                                                  |
|                                                                       |
| ├── Stores to object storage (S3 / R2)                                |
|                                                                       |
| └── Emits Redis event → Notification Service                          |
+-----------------------------------------------------------------------+

**7.2 Web Worker --- Client-Side Processing**

+-----------------------------------------------------------------------+
| // workers/video.worker.ts                                            |
|                                                                       |
| // ✅ Runs on a separate thread --- never blocks the UI               |
|                                                                       |
| export interface VideoWorkerInput {                                   |
|                                                                       |
| file: File;                                                           |
|                                                                       |
| maxSizeMB: number;                                                    |
|                                                                       |
| allowedTypes: string\[\];                                             |
|                                                                       |
| }                                                                     |
|                                                                       |
| export interface VideoWorkerOutput {                                  |
|                                                                       |
| valid: boolean;                                                       |
|                                                                       |
| error?: string;                                                       |
|                                                                       |
| thumbnail?: string; // base64 data URL                                |
|                                                                       |
| duration?: number; // seconds                                         |
|                                                                       |
| sizeMB: number;                                                       |
|                                                                       |
| }                                                                     |
|                                                                       |
| self.onmessage = async (e: MessageEvent\<VideoWorkerInput\>) =\> {    |
|                                                                       |
| const { file, maxSizeMB, allowedTypes } = e.data;                     |
|                                                                       |
| const sizeMB = file.size / (1024 \* 1024);                            |
|                                                                       |
| if (!allowedTypes.includes(file.type)) {                              |
|                                                                       |
| self.postMessage({ valid: false, error: \`Type \${file.type} not      |
| allowed\`, sizeMB });                                                 |
|                                                                       |
| return;                                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| if (sizeMB \> maxSizeMB) {                                            |
|                                                                       |
| self.postMessage({ valid: false, error: \`File exceeds                |
| \${maxSizeMB}MB limit\`, sizeMB });                                   |
|                                                                       |
| return;                                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Generate thumbnail via OffscreenCanvas                             |
|                                                                       |
| const url = URL.createObjectURL(file);                                |
|                                                                       |
| const video = document.createElement(\'video\'); // NOTE: use         |
| OffscreenCanvas in full impl                                          |
|                                                                       |
| video.src = url;                                                      |
|                                                                       |
| video.currentTime = 1;                                                |
|                                                                       |
| video.onseeked = () =\> {                                             |
|                                                                       |
| const canvas = new OffscreenCanvas(320, 180);                         |
|                                                                       |
| const ctx = canvas.getContext(\'2d\')!;                               |
|                                                                       |
| ctx.drawImage(video, 0, 0, 320, 180);                                 |
|                                                                       |
| canvas.convertToBlob({ type: \'image/jpeg\', quality: 0.7             |
| }).then(blob =\> {                                                    |
|                                                                       |
| const reader = new FileReader();                                      |
|                                                                       |
| reader.onload = () =\> self.postMessage({                             |
|                                                                       |
| valid: true, thumbnail: reader.result as string,                      |
|                                                                       |
| duration: video.duration, sizeMB,                                     |
|                                                                       |
| });                                                                   |
|                                                                       |
| reader.readAsDataURL(blob);                                           |
|                                                                       |
| });                                                                   |
|                                                                       |
| };                                                                    |
|                                                                       |
| };                                                                    |
+-----------------------------------------------------------------------+

**7.3 VideoUploader Component with tus-js-client**

+-----------------------------------------------------------------------+
| // components/features/VideoUploader/useVideoUploader.ts              |
|                                                                       |
| import { useState, useCallback, useRef } from \'react\';              |
|                                                                       |
| import \* as tus from \'tus-js-client\';                              |
|                                                                       |
| interface UploadState {                                               |
|                                                                       |
| progress: number; // 0--100                                           |
|                                                                       |
| uploading: boolean;                                                   |
|                                                                       |
| done: boolean;                                                        |
|                                                                       |
| error: string \| null;                                                |
|                                                                       |
| }                                                                     |
|                                                                       |
| export function useVideoUploader(userId: string) {                    |
|                                                                       |
| const \[state, setState\] = useState\<UploadState\>({ progress: 0,    |
| uploading: false, done: false, error: null });                        |
|                                                                       |
| const \[preview, setPreview\] = useState\<string \| null\>(null);     |
|                                                                       |
| const uploadRef = useRef\<tus.Upload \| null\>(null);                 |
|                                                                       |
| const workerRef = useRef\<Worker \| null\>(null);                     |
|                                                                       |
| const processAndUpload = useCallback((file: File) =\> {               |
|                                                                       |
| // Step 1: Spin up Web Worker for client-side processing              |
|                                                                       |
| workerRef.current = new Worker(new URL(\'@/workers/video.worker.ts\', |
| import.meta.url));                                                    |
|                                                                       |
| workerRef.current.postMessage({ file, maxSizeMB: 500, allowedTypes:   |
| \[\'video/mp4\', \'video/webm\'\] });                                 |
|                                                                       |
| workerRef.current.onmessage = (e) =\> {                               |
|                                                                       |
| const result = e.data;                                                |
|                                                                       |
| if (!result.valid) { setState(s =\> ({ \...s, error: result.error     |
| })); return; }                                                        |
|                                                                       |
| if (result.thumbnail) setPreview(result.thumbnail);                   |
|                                                                       |
| // Step 2: Start chunked upload with tus                              |
|                                                                       |
| setState(s =\> ({ \...s, uploading: true, error: null }));            |
|                                                                       |
| uploadRef.current = new tus.Upload(file, {                            |
|                                                                       |
| endpoint: \`\${process.env.NEXT_PUBLIC_API_URL}/files/\`,             |
|                                                                       |
| retryDelays: \[0, 3000, 5000, 10000, 20000\], // auto-retry on        |
| failure                                                               |
|                                                                       |
| chunkSize: 5 \* 1024 \* 1024, // 5MB chunks                           |
|                                                                       |
| metadata: {                                                           |
|                                                                       |
| filename: file.name,                                                  |
|                                                                       |
| filetype: file.type,                                                  |
|                                                                       |
| userId,                                                               |
|                                                                       |
| },                                                                    |
|                                                                       |
| onProgress(bytesUploaded, bytesTotal) {                               |
|                                                                       |
| const pct = Math.round((bytesUploaded / bytesTotal) \* 100);          |
|                                                                       |
| setState(s =\> ({ \...s, progress: pct }));                           |
|                                                                       |
| },                                                                    |
|                                                                       |
| onSuccess() {                                                         |
|                                                                       |
| setState(s =\> ({ \...s, uploading: false, done: true, progress: 100  |
| }));                                                                  |
|                                                                       |
| },                                                                    |
|                                                                       |
| onError(err) {                                                        |
|                                                                       |
| setState(s =\> ({ \...s, uploading: false, error: err.message }));    |
|                                                                       |
| },                                                                    |
|                                                                       |
| });                                                                   |
|                                                                       |
| uploadRef.current.start();                                            |
|                                                                       |
| };                                                                    |
|                                                                       |
| }, \[userId\]);                                                       |
|                                                                       |
| const pause = useCallback(() =\> uploadRef.current?.abort(), \[\]);   |
|                                                                       |
| const resume = useCallback(() =\> uploadRef.current?.start(), \[\]);  |
|                                                                       |
| return { \...state, preview, processAndUpload, pause, resume };       |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**8. Frontend Hooks & Performance Patterns**

**8.1 useMemo --- When and How**

useMemo caches the result of an expensive calculation between renders.
Use it when a computation is genuinely expensive or when the result is
passed to a React.memo child component.

  --------- -------------------------------------------------------------
  **✓ DO**  useMemo on filtered/sorted arrays, derived objects passed to
            memoized children

  --------- -------------------------------------------------------------

  ---------- -------------------------------------------------------------
  **✗        useMemo on primitive values, simple property accesses, or
  DON\'T**   tiny arrays --- this adds overhead, not savings

  ---------- -------------------------------------------------------------

+-----------------------------------------------------------------------+
| // ✅ CORRECT --- expensive filter + sort on large dataset            |
|                                                                       |
| const visibleVideos = useMemo(() =\> {                                |
|                                                                       |
| return videos                                                         |
|                                                                       |
| .filter(v =\> v.status === filter && v.title.includes(search))        |
|                                                                       |
| .sort((a, b) =\> new Date(b.createdAt).getTime() - new                |
| Date(a.createdAt).getTime());                                         |
|                                                                       |
| }, \[videos, filter, search\]);                                       |
|                                                                       |
| // ❌ WRONG --- no benefit from memoizing a primitive                 |
|                                                                       |
| const count = useMemo(() =\> videos.length, \[videos\]); // just use  |
| videos.length directly                                                |
+-----------------------------------------------------------------------+

**8.2 useCallback --- Stable Function References**

+-----------------------------------------------------------------------+
| // ✅ CORRECT --- stable ref prevents child from re-rendering on      |
| every parent render                                                   |
|                                                                       |
| const handleDelete = useCallback(async (videoId: string) =\> {        |
|                                                                       |
| await deleteVideo(videoId);                                           |
|                                                                       |
| setVideos(prev =\> prev.filter(v =\> v.id !== videoId));              |
|                                                                       |
| }, \[\]); // empty deps = always the same function reference          |
|                                                                       |
| // ✅ CORRECT --- function depends on external value                  |
|                                                                       |
| const handleSearch = useCallback((query: string) =\> {                |
|                                                                       |
| setSearch(query);                                                     |
|                                                                       |
| setPage(1);                                                           |
|                                                                       |
| }, \[\]); // setters from useState are stable, no need to list them   |
+-----------------------------------------------------------------------+

**8.3 Custom useState --- Typed State Objects**

+-----------------------------------------------------------------------+
| // ✅ Complex state with typed initializer and partial updater        |
|                                                                       |
| interface VideoFilters {                                              |
|                                                                       |
| search: string;                                                       |
|                                                                       |
| status: \'all\' \| \'processing\' \| \'ready\' \| \'failed\';         |
|                                                                       |
| sortBy: \'date\' \| \'size\' \| \'name\';                             |
|                                                                       |
| page: number;                                                         |
|                                                                       |
| }                                                                     |
|                                                                       |
| const initFilters = (): VideoFilters =\> ({                           |
|                                                                       |
| search: \'\', status: \'all\', sortBy: \'date\', page: 1,             |
|                                                                       |
| });                                                                   |
|                                                                       |
| const \[filters, setFilters\] =                                       |
| useState\<VideoFilters\>(initFilters);                                |
|                                                                       |
| // Generic partial updater --- resets page on any filter change       |
|                                                                       |
| const updateFilter = useCallback(\<K extends keyof VideoFilters\>(    |
|                                                                       |
| key: K, value: VideoFilters\[K\],                                     |
|                                                                       |
| ) =\> {                                                               |
|                                                                       |
| setFilters(prev =\> ({                                                |
|                                                                       |
| \...prev,                                                             |
|                                                                       |
| \[key\]: value,                                                       |
|                                                                       |
| page: key !== \'page\' ? 1 : prev.page, // reset to page 1 on filter  |
| change                                                                |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }, \[\]);                                                             |
+-----------------------------------------------------------------------+

**8.4 Standard Custom Hooks Library**

  ------------------------ ----------------------------------------------
  **Hook**                 **Purpose**

  useAsync(fn, deps)       Handles loading / error / data for any async
                           function

  useDebounce(value, ms)   Returns debounced value, ideal for search
                           inputs

  usePagination(total,     Manages page state, total pages, prev/next
  size)                    navigation

  useIntersection(ref)     Tracks element visibility --- use for lazy
                           load and infinite scroll

  useLocalStorage(key,     Syncs state to localStorage with
  init)                    TypeScript-safe serialization

  useMediaQuery(query)     Reactive CSS media query matching --- avoids
                           layout shift

  useEventListener(evt,    Attaches/detaches DOM event listeners safely
  fn)                      with cleanup
  ------------------------ ----------------------------------------------

**9. TypeScript & Tailwind Conventions**

**9.1 TypeScript Rules**

-   All component props must have an explicit TypeScript interface in a
    .types.ts file

-   Never use any --- use unknown and narrow the type with guards

-   All API response shapes must be typed in types/api.types.ts

-   Use const assertions (as const) for literal objects like config maps
    and key factories

-   Prefer type for union/intersection types, interface for object
    shapes

+-----------------------------------------------------------------------+
| // types/video.types.ts                                               |
|                                                                       |
| export interface Video {                                              |
|                                                                       |
| id: string;                                                           |
|                                                                       |
| title: string;                                                        |
|                                                                       |
| status: VideoStatus;                                                  |
|                                                                       |
| sizeMB: number;                                                       |
|                                                                       |
| duration: number;                                                     |
|                                                                       |
| thumbnailUrl:string \| null;                                          |
|                                                                       |
| createdAt: string; // ISO 8601                                        |
|                                                                       |
| }                                                                     |
|                                                                       |
| export type VideoStatus = \'uploading\' \| \'processing\' \|          |
| \'ready\' \| \'failed\';                                              |
|                                                                       |
| // ✅ Component props interface                                       |
|                                                                       |
| export interface VideoCardProps {                                     |
|                                                                       |
| video: Video;                                                         |
|                                                                       |
| onDelete: (id: string) =\> void;                                      |
|                                                                       |
| onSelect?: (id: string) =\> void;                                     |
|                                                                       |
| className?: string;                                                   |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**9.2 Tailwind Rules**

-   All styling is done with Tailwind utility classes --- no inline
    style={{}} objects

-   Repeated class combinations must be extracted into a component, not
    duplicated

-   Use clsx or cn() utility for conditional classes --- never string
    template literals

-   Responsive variants follow mobile-first order: base → sm → md → lg →
    xl

-   Dark mode classes use the dark: prefix consistently

+-----------------------------------------------------------------------+
| // ✅ CORRECT --- use cn() for conditional Tailwind classes           |
|                                                                       |
| import { cn } from \'@/lib/utils\'; // wrapper around clsx +          |
| tailwind-merge                                                        |
|                                                                       |
| interface ButtonProps {                                               |
|                                                                       |
| variant: \'primary\' \| \'secondary\' \| \'danger\';                  |
|                                                                       |
| size?: \'sm\' \| \'md\' \| \'lg\';                                    |
|                                                                       |
| disabled?: boolean;                                                   |
|                                                                       |
| className?: string;                                                   |
|                                                                       |
| children: React.ReactNode;                                            |
|                                                                       |
| onClick?: () =\> void;                                                |
|                                                                       |
| }                                                                     |
|                                                                       |
| export function Button({ variant, size = \'md\', disabled, className, |
| children, onClick }: ButtonProps) {                                   |
|                                                                       |
| return (                                                              |
|                                                                       |
| \<button                                                              |
|                                                                       |
| onClick={onClick}                                                     |
|                                                                       |
| disabled={disabled}                                                   |
|                                                                       |
| className={cn(                                                        |
|                                                                       |
| \'inline-flex items-center justify-center rounded-lg font-medium      |
| transition-colors\',                                                  |
|                                                                       |
| \'focus:outline-none focus:ring-2 focus:ring-offset-2\',              |
|                                                                       |
| {                                                                     |
|                                                                       |
| \'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500\':     |
| variant === \'primary\',                                              |
|                                                                       |
| \'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400\':  |
| variant === \'secondary\',                                            |
|                                                                       |
| \'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500\':        |
| variant === \'danger\',                                               |
|                                                                       |
| \'px-3 py-1.5 text-sm\': size === \'sm\',                             |
|                                                                       |
| \'px-4 py-2 text-sm\': size === \'md\',                               |
|                                                                       |
| \'px-6 py-3 text-base\': size === \'lg\',                             |
|                                                                       |
| \'opacity-50 cursor-not-allowed pointer-events-none\': disabled,      |
|                                                                       |
| },                                                                    |
|                                                                       |
| className,                                                            |
|                                                                       |
| )}                                                                    |
|                                                                       |
| \>                                                                    |
|                                                                       |
| {children}                                                            |
|                                                                       |
| \</button\>                                                           |
|                                                                       |
| );                                                                    |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**10. Pull Request Checklist**

Every PR must pass ALL of these before requesting review. Reviewers will
reject PRs that violate any item below.

  --- ---------------------------- ---------------------------------------
      **Rule**                     **What to check**

  □   app/ files are routing-only  Only metadata + single page component
                                   import in app/\*/page.tsx

  □   Pages assemble components    Dashboard.page.tsx imports components,
                                   not the other way around

  □   No full-page component files No single component file renders an
                                   entire page layout

  □   Components are reusable      No page-specific imports or hardcoded
                                   values inside components

  □   Redis isolated               Zero direct Redis client usage outside
                                   /redis folder

  □   Redis keys via Keys.\*       No hardcoded key strings --- all use
                                   factory functions in redis/keys.ts

  □   Heavy work in Web Workers    Video/image processing never runs on
                                   the main thread

  □   Chunked video upload         tus-js-client used for all video
                                   uploads, no raw full-file POST

  □   Gateway is the only backend  Frontend only calls :3000 --- never
      entry                        :3001, :3002, etc. directly

  □   useMemo/useCallback used     Not applied to primitives or tiny
      correctly                    arrays --- only real expensive cases

  □   Custom hooks extracted       Any stateful logic used in 2+ places
                                   lives in /hooks/use\*.ts

  □   Class components justified   Class components only used for Error
                                   Boundaries or legacy adapters

  □   TypeScript --- no any        No any types. All props typed. API
                                   responses typed in types/

  □   Tailwind --- no inline       No style={{}} objects --- all styling
      styles                       via Tailwind + cn() utility

  □   File naming convention       Components = PascalCase.tsx \| Hooks =
                                   useCamelCase.ts \| Redis = camelCase.ts
  --- ---------------------------- ---------------------------------------

**Appendix --- Quick Reference**

**A. File Naming Convention**

  --------------------- ------------------------- ----------------------------------------
  **File Type**         **Naming Pattern**        **Example**

  Next.js Route         **lowercase/page.tsx**    **app/dashboard/page.tsx**

  Page Composition      **PascalCase.page.tsx**   **pages/dashboard/Dashboard.page.tsx**

  React Component       **PascalCase.tsx**        **components/ui/Button/Button.tsx**

  Component Types       **PascalCase.types.ts**   **Button.types.ts**

  Custom Hook           **useCamelCase.ts**       **hooks/useDebounce.ts**

  Redis Helper          **camelCase.ts**          **redis/cache/user.ts**

  Web Worker            **name.worker.ts**        **workers/video.worker.ts**

  TypeScript Types      **name.types.ts in        **types/video.types.ts**
                        types/**                  

  NestJS DTO            **name.dto.ts**           **auth/dto/login.dto.ts**
  --------------------- ------------------------- ----------------------------------------

**B. Message Pattern Naming --- NestJS**

All microservice message patterns follow the format: service.action
(lowercase, dot-separated)

+-----------------------------------------------------------------------+
| auth.login auth.register auth.refresh auth.logout                     |
|                                                                       |
| user.getProfile user.updateProfile user.deleteAccount                 |
|                                                                       |
| video.upload video.getById video.list video.delete                    |
|                                                                       |
| notification.send notification.markRead                               |
+-----------------------------------------------------------------------+

*This document is owned by the Engineering Team. All updates require a
PR to docs/architecture-standards.docx with team review.*

<!-- END:nextjs-agent-rules -->
