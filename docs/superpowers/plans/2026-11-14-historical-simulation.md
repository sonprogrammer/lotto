# Issue #12 Historical Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an authenticated user simulate the existing statistical combination generator against the latest 30 completed draws, reproduce runs, and inspect historical rank and payout results.

**Architecture:** Keep simulation in its own FSD feature and user-owned entity. The server reads shared lottery draw records, computes each target from only its preceding 30 draws, then stores the reproducible run and round details in a user-scoped MongoDB document. The authenticated UI submits a run and browses saved summaries and details.

**Tech Stack:** Next.js App Router, React, TypeScript, MongoDB, Zod, existing deterministic analysis and generation functions, TanStack Query, Vitest, React Testing Library, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-14-historical-simulation-design.md`

## Global Constraints

- Use the latest 30 completed rounds as simulation targets.
- For each target, use only the preceding 30 public draws.
- Use the existing statistical generation rules; do not call Groq or another generative AI.
- Generate 5 combinations per target by default; accept 1–10.
- The ticket-cost estimate is 1,000 KRW per combination.
- Historical results do not predict or improve future winning chances.
- Simulation runs and results belong to the authenticated user.
- Keep Next.js route files thin and follow FSD; one component or hook per file.

## Review Focus

- Future leakage: target and later draws must not affect target analysis or generated combinations; test with changed future data.
- Reproduction: identical draw snapshot and settings must yield identical combinations and payouts; test repeated execution.
- Insufficient history: fewer than 60 completed draws cannot supply 30 targets with 30 preceding draws; return a clear domain error.
- Missing payout records: preserve matched rank while marking payout as unknown and exclude unknown money from known payout total; test it.
- User isolation: list and detail queries must include the authenticated `userId`; test cross-user reads as not found.

---

### Task 1: Define simulation input, persisted run, and result calculation

**Files:**

- Create: `src/entities/simulation/model/simulation-run.ts`
- Create: `src/entities/simulation/model/simulation-run.test.ts`
- Create: `src/entities/simulation/lib/evaluate-combination.ts`
- Create: `src/entities/simulation/lib/evaluate-combination.test.ts`
- Create: `src/entities/simulation/index.ts`

**Interfaces:**

- `evaluateCombination(numbers, draw): { matchedNumberCount, bonusMatched, rank, amountPerWinner }`; rank uses official 6/45 rank rules, with rank 2 requiring five main numbers plus bonus.
- `SimulationRunDocument` stores `_id`, `userId`, settings, generator version, base latest round, created time, totals, and each target round's analysis range, seed, generated numbers, ranks, and nullable payouts.
- A missing prize entry leaves `amountPerWinner: null`; missing payouts do not count as known payout.

- [ ] **Step 1: Write failing tests** for rank 1–5 and no rank, bonus-dependent second place, missing prize amount, schema bounds, and duplicate/invalid combinations.
- [ ] **Step 2: Run** `npm test -- src/entities/simulation/model/simulation-run.test.ts src/entities/simulation/lib/evaluate-combination.test.ts`; confirm failures are due to missing implementation.
- [ ] **Step 3: Implement** the Zod document schema and pure result evaluator with rank payout lookup from the target draw.
- [ ] **Step 4: Run the same tests** and confirm all pass.

### Task 2: Build the deterministic, no-leakage simulation engine

**Files:**

- Create: `src/features/simulation/lib/run-simulation.ts`
- Create: `src/features/simulation/lib/run-simulation.test.ts`
- Create: `src/features/generation/index.ts`

**Interfaces:**

- `runSimulation({ draws, combinationsPerRound }): SimulationRunDraft` accepts validated, ascending complete draw records and returns the reproducible run payload without a Mongo `_id` or owner.
- Require at least 60 rounds; simulate the latest 30 target rounds and each target's immediately preceding 30 rounds.
- Use `calculateWeeklyAnalysis` and `generateCombinations` with seed `historical-simulation:v1:<targetRound>:<combinationCount>`; no AI, prompt, or fixed-number inputs.
- Cost is `30 * combinationsPerRound * 1000` KRW. Payout totals include only known rank amounts and record how many matched tickets have unknown payout.

- [ ] **Step 1: Write failing tests** for latest 30 targets, the precise 30-round analysis window, future-data invariance, same-settings determinism, count bounds, insufficient history, and missing-prize accounting.
- [ ] **Step 2: Run** `npm test -- src/entities/simulation/lib/run-simulation.test.ts`; confirm failures are due to missing implementation.
- [ ] **Step 3: Implement** the engine using sorted target windows and target-derived deterministic seeds; never include a target round in its own analysis.
- [ ] **Step 4: Run the same tests** and confirm all pass.

### Task 3: Persist and retrieve private simulation runs

**Files:**

- Create: `src/entities/simulation/server/simulation-store.ts`
- Create: `src/entities/simulation/server/simulation-store.test.ts`
- Modify: `src/entities/simulation/index.ts`

**Interfaces:**

- `createSimulationRun(userId, draft)` inserts one validated run document and returns its serialized representation.
- `listSimulationRuns(userId, limit)` returns newest run summaries only.
- `getSimulationRun(userId, id)` returns a full run or `null`; both owner and valid ObjectId are required.
- Persist all round details inside one `simulation_runs` document so each run is inserted atomically and can be reproduced without retaining duplicate draw-source data.

- [ ] **Step 1: Write failing tests** verifying owner scoping for list/detail, invalid IDs, and serialization.
- [ ] **Step 2: Run** `npm test -- src/entities/simulation/server/simulation-store.test.ts`; confirm expected failures.
- [ ] **Step 3: Implement** MongoDB access following existing entity stores and always scope operations by `userId`.
- [ ] **Step 4: Run the same tests** and confirm all pass.

### Task 4: Add authenticated simulation API

**Files:**

- Create: `src/app/api/simulations/route.ts`
- Create: `src/app/api/simulations/route.test.ts`
- Create: `src/app/api/simulations/[id]/route.ts`
- Create: `src/app/api/simulations/[id]/route.test.ts`
- Create: `src/features/simulation/server/create-simulation.ts`

**Interfaces:**

- `POST /api/simulations` accepts `{ combinationsPerRound?: integer 1..10 }`, requires login, loads public draw documents from MongoDB, runs the engine, persists under the session user, and returns the created run.
- `GET /api/simulations` returns up to 20 summaries for the current user.
- `GET /api/simulations/[id]` returns the user's run or 404; responses are `private, no-store`.
- Return 401 when signed out, 400 for invalid input/insufficient history, and a generic retryable 502 for infrastructure failure.

- [ ] **Step 1: Write failing route tests** for auth, payload validation, private cache headers, errors, and owner-scoped details.
- [ ] **Step 2: Run** `npm test -- src/app/api/simulations/route.test.ts src/app/api/simulations/[id]/route.test.ts`; confirm expected failures.
- [ ] **Step 3: Implement** thin handlers and the server use case, reading draw records without calling an external source or an AI provider.
- [ ] **Step 4: Run the same tests** and confirm all pass.

### Task 5: Add the simulation UI and private query hooks

**Files:**

- Create: `src/app/simulation/page.tsx`
- Create: `src/features/simulation/api/simulation-api.ts`
- Create: `src/features/simulation/model/query-key.ts`
- Create: `src/features/simulation/hooks/use-simulation-runs.ts`
- Create: `src/features/simulation/hooks/use-simulation-run.ts`
- Create: `src/features/simulation/hooks/use-create-simulation.ts`
- Create: `src/features/simulation/components/simulation-dashboard.tsx`
- Create: `src/features/simulation/components/simulation-controls.tsx`
- Create: `src/features/simulation/components/simulation-summary.tsx`
- Create: `src/features/simulation/components/simulation-round-list.tsx`
- Create: `src/features/simulation/components/simulation-dashboard.test.tsx`
- Modify: `src/widgets/site-header/ui/site-header.tsx`

**Interfaces:**

- The page requires login and passes `displayName` and `userId` to the dashboard.
- The dashboard provides 1–10 combinations per round (default 5), run action, aggregate metrics, saved-run list, and selected run detail.
- Show loading skeleton, first-use empty state, retryable errors, and disable duplicate submission.
- Label the calculation as a historical comparison, state that it does not predict or raise future odds, and explain that unknown prize amounts are excluded from known totals.
- Include `userId` in TanStack Query keys and do not place private records in Next.js shared server cache.

- [ ] **Step 1: Write failing UI tests** for the defaults, starting a run, loading/empty/error states, result summary/detail, and notice language.
- [ ] **Step 2: Run** `npm test -- src/features/simulation/components/simulation-dashboard.test.tsx`; confirm failures due to missing UI.
- [ ] **Step 3: Implement** one component/hook per file with Tailwind utilities and existing shared UI/number-ball components where relevant; add a `/simulation` nav link.
- [ ] **Step 4: Run the same tests** and confirm all pass.

### Task 6: Update technical documentation and verify the feature

**Files:**

- Modify: `architecture.md`
- Modify: `spec.md`

- [ ] **Step 1:** Update simulation rules, MongoDB model, private cache policy, and route/UI behavior to match the approved design.
- [ ] **Step 2:** Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run format:check`; fix issues introduced by the feature.
- [ ] **Step 3:** Run the `ux-review` skill against the completed simulation flow, address findings, then repeat the local verification commands.
- [ ] **Step 4:** Inspect the final diff and confirm the no-future-leakage tests, per-user query filters, and no-AI behavior are present.
