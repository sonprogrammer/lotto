# Minimal Project Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the smallest repeatable local development and quality-check harness for the approved Next.js + Supabase project.

**Architecture:** Scaffold a Next.js App Router project in the existing repository while preserving the approved product documents. Add project scripts, formatting and test-runner configuration, and environment placeholders; leave product features, Supabase database setup, and actual feature tests for later approved work.

**Tech Stack:** Node.js 22, npm, Next.js App Router, TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, React Testing Library, Zod.

**Spec:** `spec.md` and `architecture.md` (approved drafts)

## Global Constraints

- Keep signed-out users limited to the random six-number preview; full account features require Kakao authentication.
- Lottery statistics and simulations must remain deterministic and must not claim improved or guaranteed winning odds.
- Use the selected stack in `architecture.md`; do not add dependencies without a documented need.
- Do not create product features in this harness task.
- Preserve `AGENTS.md`, `spec.md`, and `architecture.md` when scaffolding.
- Supported Node.js versions must satisfy both Vitest 5 and jsdom 29: Node.js 22.13 or later in the 22.x line, 24.x, or 26 and later. `.nvmrc` selects Node 22 and npm 10 or later is required.

## Review Focus

- Existing approved Markdown files must survive app scaffolding unchanged; verify their contents and file paths after scaffold.
- Project scripts must remain separate and callable (`dev`, `build`, `lint`, `typecheck`, `test`, `format:check`); inspect the resulting `package.json` scripts.
- `.env.example` must contain placeholders only and must not expose credentials; inspect every example value before completion.
- Vitest configuration must discover future TypeScript and TSX tests with a DOM environment and setup file; inspect the config and script while leaving product tests absent.
- Node and npm requirements must be explicit and compatible with both Next.js and Vitest; inspect `engines`, `.nvmrc`, and the lockfile metadata.

---

### Task 1: Scaffold the approved web runtime

**Files:**
- Create: `package.json`, `package-lock.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `eslint.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.nvmrc`, `.gitignore`, `README.md`
- Preserve: `AGENTS.md`, `spec.md`, `architecture.md`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`, `format:check`
- Produces: Next.js App Router root route and TypeScript path alias `@/*`

- [ ] Create a Next.js App Router scaffold using npm, TypeScript, Tailwind CSS, and ESLint; preserve the three approved Markdown files.
- [ ] Set `.nvmrc` to `22` and declare the supported Node engine range as `^22.13.0 || ^24.0.0 || >=26.0.0` in `package.json`.
- [ ] Add separate scripts for development, production build/start, lint, TypeScript checking, Vitest, formatting, and formatting checks.
- [ ] Document Node/npm prerequisites and the project commands in `README.md`.
- [ ] Inspect the scaffold and confirm the approved Markdown files remain present and unchanged.

### Task 2: Configure formatting and test tooling

**Files:**
- Create: `prettier.config.mjs`, `.prettierignore`
- Create: `vitest.config.mts`, `src/test/setup.ts`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: Task 1's npm scripts and TypeScript configuration
- Produces: Vitest DOM environment and setup entrypoint for future React component tests

- [ ] Add Prettier configuration compatible with the repository's TypeScript and Next.js files.
- [ ] Add Vitest with the React plugin, `jsdom`, React Testing Library, `user-event`, and `jest-dom` matchers.
- [ ] Add the approved Zod runtime dependency for validation in later features; do not add product validation logic in this task.
- [ ] Configure test discovery for `*.test.ts` and `*.test.tsx`; allow the initial harness to run with no product test files.
- [ ] Create the test setup module that registers `jest-dom` matchers and testing-library cleanup.
- [ ] Do not add product behavior tests in this harness-only task.

### Task 3: Add safe environment and setup guidance

**Files:**
- Create: `.env.example`
- Modify: `README.md`, `.gitignore`

**Interfaces:**
- Consumes: Task 1's project scripts and selected Supabase architecture
- Produces: documented environment-variable placeholders for later Supabase and server-side integration

- [ ] Add placeholders for the Supabase project URL and public client key; document server-only secrets as placeholders only if the scaffold needs them.
- [ ] Ensure local environment files and generated build/test artifacts are ignored by Git.
- [ ] Explain that Supabase project setup, migrations, OAuth secrets, AI credentials, and lottery data-source credentials are added when those integrations are selected.
- [ ] Inspect `.env.example` and `.gitignore` to confirm no real credentials or unrelated local files are included.

## Execution Notes

- Existing Node is `20.8.0`, below the selected dependency range; use Node 22.13+ (22.x), 24.x, or 26+ for the project runtime before installing dependencies.
- This environment cannot bind the internal port used during Turbopack CSS compilation, even with escalated execution; use Next.js's supported Webpack flags for both development and production build to keep bundlers consistent.
- Existing npm is `10.1.0`; use npm and commit its lockfile with the project when the user authorizes Git operations.
- This plan does not add or run product tests. It configures the runner for future features.
- Supabase local containers and database migrations are deferred until database implementation begins.
