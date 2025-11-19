# Repository Guidelines

## Project Structure & Module Organization
Unison-AI is a Next.js 15 app. UI routes, server actions, and API handlers live in `app/`, reusable UI primitives sit in `components/`, and hooks/utilities reside in `hooks/` and `lib/`. Tailwind theming stays in `styles/` plus `tailwind.config.ts`, static assets in `public/`, and Supabase code and schema diffs in `supabase/`, `SCHEMA_REVIEW.md`, and `new_db.sql`. Tests use three homes: `tests/` for Vitest suites, `tests-e2e/` for Playwright flows, and `test_data/` for fixtures.

## Build, Test, and Development Commands
- `pnpm dev` – run the Next dev server with hot reload.
- `pnpm build` – produce the production bundle; fails on type or lint errors.
- `pnpm start` – serve the latest build (use for staging checks).
- `pnpm lint` – invoke `next lint` with the project ESLint rules.
- `pnpm test` – run all Vitest specs; add `--run` in CI for deterministic output.
- `pnpm e2e` / `pnpm e2e:ui` – execute Playwright suites headless or with the inspector.

## Coding Style & Naming Conventions
Code in TypeScript with ESM imports. Use 2-space indentation, `PascalCase` for React components, `camelCase` for helpers, and `kebab-case` for route folders (e.g., `app/job-matches/[id]`). Prefer server components unless client hooks or mutable state are required. Compose styles with Tailwind utilities and extend tokens through `styles/` or `tailwind.config.ts`. Run `pnpm lint` before opening a PR.

## Testing Guidelines
Unit and integration tests belong next to the code or in `tests/` using Vitest’s `describe/it` style; name files `*.test.ts`. Mock Supabase clients with the helpers already in `tests/` to avoid live calls. End-to-end coverage belongs in `tests-e2e/` and should reference flows in the filename (`auth-onboarding.spec.ts`). Store deterministic payloads under `test_data/` and reset them after each run.

## Commit & Pull Request Guidelines
Follow the `type(scope): summary` pattern from the existing history (e.g., `feat(match-service): add match score job`). Keep commits focused and reference tickets in the body if needed. Pull requests should describe the change, list validation commands (`pnpm test`, `pnpm e2e`), link issues, and attach UI evidence when relevant. Wait for CI to pass and secure at least one review before merging.

## Security & Configuration Tips
Copy `env.example` to `.env.local`, fill Supabase keys, and keep secrets out of Git. Consume shared clients from `lib/` instead of instantiating Supabase directly. Background jobs and agents should document required scopes in their PR for reviewer confirmation.
