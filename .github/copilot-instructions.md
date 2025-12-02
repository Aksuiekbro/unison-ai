# GitHub Copilot Instructions

## Project snapshot
- **Stack**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui; Supabase provides auth, storage, and Postgres. AI flows rely on Google Gemini via helpers in `lib/ai/*`.
- **Runtime split**: Prefer server components/routes; only opt into `"use client"` when local state or browser APIs are needed. Shared UI primitives live under `components/ui/` and follow shadcn patterns.

## Data + Supabase
- Always import `createClient` from `lib/supabase-server` inside RSCs/route handlers so session cookies propagate. Use `supabaseAdmin` (service key) only for background jobs (`app/api/personality/analyze/route.ts` shows both clients together).
- Database schema sources: `supabase/schema.sql` plus versioned migrations (e.g., `supabase/migrations/20251121_personality_async_queue.sql`). Update both when changing tables.
- Job seeker gating uses `users.personality_assessment_completed` and mirrored flags on `profiles`. Keep those flags in sync when mutating personality data.

## AI workflows
- Structured Gemini calls must run through `generateStructuredResponse` + `withRateLimit` (see `lib/ai/personality-analyzer.ts`, `lib/ai/resume-parser.ts`, `lib/ai/match-scorer.ts`). Provide schema objects and keep prompts bilingual when possible.
- Long-running AI is offloaded: route handlers capture input, `unstable_after` spawns background processing with `supabaseAdmin`, and clients poll status endpoints. Follow the pattern in `app/api/personality/analyze/route.ts` + `/api/personality/status` when adding new AI jobs.
- When enqueueing work, write status fields (`status`, `queued_at`, `processed_at`, `error_message`) before firing Gemini. Frontend components expect these enums: `queued | processing | completed | failed`.

## Frontend patterns
- `components/personality-test.tsx` illustrates async UX: optimistic completion card, jittered polling, and `sonner` toasts. Reuse that approach for other long tasks.
- Shared pages (e.g., `app/job-seeker/results/page.tsx`) switch between placeholder banners and real content depending on status flags—keep view logic server-side for consistency.
- Stick with `className` props + Tailwind utility classes; extend tokens via `styles/globals.css` or `tailwind.config.ts`.

## Build, test, and verification
- Dev server: `pnpm dev`. Production build: `pnpm build && pnpm start`. Linting can fail because of legacy `any` usage—scope fixes to touched files and explain remaining lint debt in PRs.
- Unit/integration tests live in `tests/` (Vitest). Mock Supabase/AI the way `tests/api/personality-analyze.test.ts` and `tests/api/personality-status.test.ts` do—wire `vi.mock('@/lib/supabase-server')` and stub chained Postgrest builders.
- End-to-end flows sit in `tests-e2e/` (Playwright). Use `pnpm e2e` for headless CI and `pnpm e2e:ui` locally when debugging AI-dependent steps.

## Environment + secrets
- Required env keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`. Personality analysis can be forced inline for testing via `PERSONALITY_ANALYSIS_INLINE=true` (see `env.example`). Never log secrets or embed keys client-side.

## Contribution checklist
- Touching schema? add a migration under `supabase/migrations/`, update `supabase/schema.sql`, and refresh `lib/database.types.ts` (via `supabase gen types` or manual edit).
- Modifying AI prompts? keep responses valid JSON, update corresponding validation (`validate*` functions), and extend fixtures/tests.
- UI changes that affect onboarding/job seeker gating must account for middleware redirects in `app/job-seeker/test/page.tsx` and related guards.
- Background jobs must either use Supabase Edge Functions or the existing `unstable_after` pattern—do not block HTTP responses while Gemini runs.
