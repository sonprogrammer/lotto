# Guest Random Number Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter page with a polished signed-out preview that generates six random Lotto 6/45 numbers and reveals them in sequence while the numbers cycle inside stationary balls.

**Architecture:** Generate the combination in the browser using Web Crypto with unbiased rejection sampling, as allowed by the user's earlier instruction that either an API or frontend can provide the guest random numbers. While drawing, cycle temporary numbers inside stationary balls; reveal and freeze each result from first to sixth. Keep the preview isolated from authentication, Supabase, AI, and historical draw data. A small client component owns the draw state and sequential reveal/cycle timers; reduced-motion preferences skip cycling and reveal the complete result immediately.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, CSS animations, Vitest, React Testing Library.

**Spec:** `spec.md` sections 4.1 and 5; `architecture.md` section 2.

**Status:** Approved for implementation under the user's prior choice of either browser or API generation.

## Global Constraints

- Generate exactly six distinct integers from 1 through 45.
- The signed-out preview provides random generation only; do not add statistics, AI, saved combinations, or account data.
- Cycle visible temporary numbers inside stationary balls, then reveal and freeze the final numbers from first to sixth; follow `prefers-reduced-motion`.
- Do not claim that random results improve or guarantee winning odds.
- Do not add dependencies for this slice.

## Review Focus

- Randomness must avoid modulo bias and duplicate numbers; test rejection and uniqueness.
- Repeated clicks during a reveal must not replace an in-progress combination; test the disabled action and re-generation after completion.
- Reduced motion must skip continuous spinning and the sequential wait; test that all numbers appear immediately.
- The final combination must be announced once to assistive technology; test the completion status.
- Unrevealed slots must not expose their final numbers early; test before and between reveal steps.

---

### Task 1: Add an unbiased Lotto combination generator

**Files:**
- Create: `src/features/preview/lib/generate-lotto-numbers.ts`
- Test: `src/features/preview/lib/generate-lotto-numbers.test.ts`

**Interfaces:**
- Produces: `generateLottoNumbers(randomUint32?: () => number): number[]`

- [x] Write tests proving that six numbers are distinct, sorted, and within 1–45, and that rejected out-of-range samples and duplicates are skipped.
- [x] Run the tests and confirm they fail because the generator module is missing.
- [x] Implement Web Crypto-backed rejection sampling and sort the six accepted numbers ascending.
- [x] Run the generator tests and confirm they pass.

### Task 2: Build the animated guest preview

**Files:**
- Create: `src/features/preview/components/lotto-number-preview.tsx`
- Test: `src/features/preview/components/lotto-number-preview.test.tsx`
- Modify: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `generateLottoNumbers()` from Task 1.
- Produces: the home page guest preview, six accessible number balls, sequential reveal, and regenerate action.

- [x] Write component tests for the six waiting slots, cycling interim numbers, ordered reveal, prevention of concurrent generation, regeneration, reduced-motion behavior, and a single completion announcement.
- [x] Run the component tests and confirm they fail because the preview component is missing.
- [x] Implement the accessible preview client component with one-number-at-a-time reveal and cleanup of pending timers.
- [x] Replace the starter home page, add responsive styling and reduced-motion CSS, and update Korean page metadata.
- [x] Run component tests, then all project verification commands: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Execution Notes

- This checkout has no `.git` repository, so the approved feature work proceeds in the current project folder as the previous harness work did; there is no Git worktree or commit range.
- `spec.md` allows browser or API generation. The user previously allowed either; use browser generation to avoid a server round trip for a public random preview.
- Next.js's generated agent rules are disabled to preserve the requested minimal `AGENTS.md`.
