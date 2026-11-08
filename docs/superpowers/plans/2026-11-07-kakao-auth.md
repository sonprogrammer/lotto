# Kakao Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kakao sign-in and sign-out using Supabase Auth with an SSR cookie session, PKCE callback, and Next.js 16 session refresh.

**Architecture:** Use `@supabase/ssr` browser/server clients with the existing public Supabase URL and publishable key. Start OAuth with the Kakao provider, exchange the PKCE code in a route handler, refresh sessions in `src/proxy.ts`, and render signed-in state from verified claims. Return to `/` after sign-in/out; do not add profile display, email collection, account tables, or RLS in this authentication slice.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Vitest, React Testing Library.

**Spec:** `spec.md` sections 3, 4.2, and 5; `architecture.md` sections 2 and 4.

## Global Constraints

- Kakao is the only sign-in provider; do not add password or email login.
- Keep the public random preview available when Supabase environment variables are missing.
- Use a verified Supabase session for signed-in UI; never trust unsigned cookie contents.
- Use a PKCE callback and accept only same-site relative return paths.
- Do not display or use user profile data in this slice. Supabase's Kakao provider setup uses Kakao's `profile_nickname` and `profile_image` consent items; do not request email or add profile display/collection in the app.
- Keep Kakao client secrets in the Supabase provider configuration; never expose them in browser code or `.env.example`.
- Do not add account tables or RLS until account data features are implemented.

## Review Focus

- Missing or placeholder Supabase environment values must leave random preview usable and make login setup errors clear.
- Callback URLs with external hosts, protocol-relative paths, or backslashes must fall back to `/`.
- Missing callback codes or failed code exchange must not establish a signed-in state.
- A valid cookie session must refresh and produce signed-in UI; an invalid cookie must not be trusted.
- Sign-out must clear the Supabase session and return to the signed-out UI.

---

### Task 1: Configure Supabase SSR clients and session refresh

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/lib/supabase/config.ts`
- Test: `src/lib/supabase/config.test.ts`
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/update-session.ts`, `src/proxy.ts`

**Interfaces:**
- Produces: `getSupabaseConfig()` returning public URL/key or `null` when missing/placeholders; browser and server client factories; Next.js 16 session refresh Proxy.

- [x] Add tests for valid configuration, missing values, and scaffold placeholders.
- [x] Run the tests and confirm they fail because the configuration helper is missing.
- [x] Install the documented Supabase SSR and JavaScript clients; implement config validation and client factories.
- [x] Implement `src/proxy.ts` and session refresh with `auth.getClaims()` and cookie forwarding, bypassing Supabase when configuration is absent.
- [x] Run focused tests, ESLint, and TypeScript checking.

### Task 2: Implement Kakao OAuth callback and safe redirects

**Files:**
- Create: `src/features/auth/lib/safe-redirect.ts`
- Test: `src/features/auth/lib/safe-redirect.test.ts`
- Create: `src/app/auth/callback/route.ts`, `src/app/auth/error/page.tsx`

**Interfaces:**
- Consumes: `createSupabaseServerClient()` from Task 1.
- Produces: PKCE code exchange route; `getSafeRedirectPath(value: string | null): string`.

- [x] Write tests accepting local relative paths and rejecting absolute, protocol-relative, and backslash-based external destinations.
- [x] Run the tests and confirm they fail because the safe redirect helper is missing.
- [x] Implement the safe path helper and callback route; exchange valid codes, redirect to `/` on success, and to a clear auth error page on failure.
- [x] Run focused tests, ESLint, and TypeScript checking.

### Task 3: Add sign-in, session status, and sign-out UI

**Files:**
- Create: `src/features/auth/components/auth-control.tsx`
- Test: `src/features/auth/components/auth-control.test.tsx`
- Create: `src/features/auth/components/auth-aware-preview.tsx`
- Modify: `src/app/page.tsx`, `src/features/preview/components/lotto-number-preview.tsx`, `src/app/globals.css`, `README.md`

**Interfaces:**
- Consumes: Task 1 Supabase clients and Task 2 callback route.
- Produces: Kakao sign-in control, verified signed-in state with sign-out control, and local Kakao/Supabase setup instructions.

- [x] Write component tests for OAuth start, unconfigured Supabase guidance, signed-in state, and successful sign-out refresh.
- [x] Run the component tests and confirm they fail because the auth control is missing.
- [x] Implement Kakao OAuth initiation, pending/error feedback, and browser sign-out.
- [x] Read verified claims in an async server component wrapped in `Suspense`, preserving the public preview when Supabase is not configured.
- [x] Add minimal Kakao login setup instructions, including Supabase callback and allowed redirect URLs; do not include real secrets.
- [x] Run component tests and all project checks: `npm run format:check`, `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build`.

## Execution Notes

- The user approved Supabase SSR cookie sessions, PKCE callback, home return, and signed-in/sign-out controls.
- The existing checkout has no `.git` repository. Proceed in place as previously authorized; no branch or commit range is available.
- End-to-end Kakao login cannot be verified until the user configures a Supabase project and Kakao OAuth app; automated tests cover local behavior without credentials.
- Supabase's current SSR guide recommends `@supabase/ssr` but identifies it as beta; its API can change.
