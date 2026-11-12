# 번호 조합 생성 통합 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세 생성 방식을 하나로 통합하고 매 생성 요청에서 통계와 선택 입력을 바탕으로 Groq AI 추천을 제공한다.

**Architecture:** 클라이언트는 선택 번호 0~6개와 선택 의견을 단일 생성 요청에 담는다. 서버는 매 요청 Groq을 최대 한 번 호출해 기본 또는 사용자 의견을 해석하고, 검증된 조건을 통계 기반 조합 생성기에 전달한다.

**Tech Stack:** Next.js 16, TypeScript, Zod, TanStack Query, Groq HTTP API, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-11-12-number-generation-design.md`

## Global Constraints

- 번호는 1~45의 서로 다른 정수 6개이며, 고른 번호는 모든 조합에 포함한다.
- 한 번에 1~10개 조합을 만들고 기본값은 5개다. 번호 6개를 모두 고르면 1개 조합만 만든다.
- 프롬프트가 비어 있어도 기본 프롬프트로 AI를 호출한다. 한 생성 요청의 AI 호출은 최대 1회다.
- 입력 및 집계 통계만 AI에 보내며 계정 식별 정보와 원본 전체 회차는 보내지 않는다.
- AI 추천은 당첨 예측이나 확률 상승으로 표현하지 않는다.
- React 컴포넌트와 커스텀 훅은 각각 별도 파일에 둔다.
- 저장 프롬프트 관리 UI는 이슈 #7 범위다. 이 계획에서는 직접 입력과 기본 프롬프트만 제공한다.

## Review Focus

- 번호 미선택은 유효하고, 번호 중복·범위 오류는 요청 스키마에서 거절한다.
- 번호 6개 선택과 조합 개수 2개 이상은 거절하고, 1개 요청은 통과시킨다.
- 사용자 의견이 비어 있으면 서버 기본 프롬프트가 실제 Groq 요청에 전달된다.
- 사용자 의견이 있으면 기본 프롬프트 대신 해당 의견이 전달되고 선택 번호와 함께 해석된다.
- Groq 실패·한도 초과 시 AI가 성공한 것처럼 결과를 만들지 않고 기존 오류·재시도 흐름을 유지한다.

---

### Task 1: 요청 모델과 생성 폼 통합

**Files:**

- Modify: `src/features/generation/model/generation-request.ts`
- Test: `src/features/generation/model/generation-request.test.ts`
- Modify: `src/features/generation/hooks/use-generation-form.ts`
- Modify: `src/features/generation/components/generation-dashboard.tsx`
- Test: `src/features/generation/components/generation-dashboard.test.tsx`

**Interfaces:**

- Request body: `{ fixedNumbers: number[], period: AnalysisPeriod, count: number, prompt?: string }`.
- `GenerationRequest` no longer has `method`; `fixedNumbers` accepts zero through six unique values.
- The form has no generation-mode state. It submits one request for any number of selected balls, including none.

- [x] **Step 1: Add failing request-schema tests** asserting empty `fixedNumbers` defaults to `[]`, 0–6 unique numbers pass, invalid/duplicate values fail, prompt max length remains 500, and six fixed numbers require `count: 1`.
- [x] **Step 2: Run `npm test -- src/features/generation/model/generation-request.test.ts` and confirm the new assertions fail against the method-specific schema.**
- [x] **Step 3: Remove `method` and method-specific refinements from `GenerationRequestSchema`; preserve period, count, prompt and six-number constraints.**
- [x] **Step 4: Add failing dashboard tests** asserting there is no mode selector, balls can be selected from zero through six, and submit payload omits `method`.
- [x] **Step 5: Run `npm test -- src/features/generation/components/generation-dashboard.test.tsx` and confirm the new assertions fail.**
- [x] **Step 6: Remove mode state and conditional picker from `use-generation-form.ts`; always allow 0–6 numbers and submit the unified request.**
- [x] **Step 7: Simplify `generation-dashboard.tsx` to one ball picker and add visible copy that no opinion uses the default analysis prompt.**
- [x] **Step 8: Run both targeted test files and confirm they pass.**

### Task 2: Always apply AI recommendation once per request

**Files:**

- Modify: `src/features/generation/server/run-generation.ts`
- Test: `src/features/generation/server/run-generation.test.ts`
- Modify: `src/app/api/generation/route.test.ts`

**Interfaces:**

- `runGeneration(request: GenerationRequest)` always calls `getGroqRecommendation` exactly once.
- The recommendation receives `request.prompt` when non-empty; otherwise it receives `DEFAULT_AI_PROMPT`.
- It always receives all selected fixed numbers and aggregate analysis. Validated AI constraints feed `generateCombinations`.

- [x] **Step 1: Add failing server tests** for no prompt using the default prompt, custom prompt replacing the default, zero fixed numbers being accepted, and exactly one recommendation call for a request producing multiple combinations.
- [x] **Step 2: Run `npm test -- src/features/generation/server/run-generation.test.ts` and confirm the no-prompt case fails because the recommendation constraints are currently bypassed.**
- [x] **Step 3: Remove conditional AI gating in `run-generation.ts`; always send one recommendation request and always apply its validated constraints.**
- [x] **Step 4: Update API route fixtures to omit `method`; assert a request with no selected numbers is accepted and invalid selected numbers remain rejected.**
- [x] **Step 5: Run targeted server and API tests; confirm all pass, including Groq error handling and one-call behavior.**

### Task 3: Align product and technical documentation

**Files:**

- Modify: `spec.md`
- Modify: `architecture.md`
- Modify: `docs/superpowers/specs/2026-11-12-number-generation-design.md`

- [x] **Step 1: Update `spec.md`** to describe one generation flow, 0–6 optional fixed numbers, default prompt when no opinion is provided, one AI call per request, and issue #7 saved-prompt UX (up to five title/content entries selected by title or entered anew).
- [x] **Step 2: Update `architecture.md`** to remove the three generation-mode enum and the redundant `generationMethod` field from future saved-combination documents; describe one AI-assisted statistics generation flow and update saved prompts to have separate `title` and `content` fields.
- [x] **Step 3: Review the three documents against the approved design and ensure issue #7 remains documentation/architecture scope only in this implementation.**

### Task 4: Align saved-combination model with unified generation

**Files:**

- Modify: `src/entities/saved-combination/model/document.ts`
- Test: `src/entities/saved-combination/model/document.test.ts`

**Interfaces:**

- `SavedCombinationDocument` no longer includes `generationMethod`, because the product has one generation flow.
- Existing documents carrying the legacy field remain parseable; Zod strips the obsolete unknown key by default.

- [x] **Step 1: Add a failing model test** asserting the saved combination schema accepts a valid document without `generationMethod` and parsed output does not expose that obsolete field.
- [x] **Step 2: Run `npm test -- src/entities/saved-combination/model/document.test.ts` and confirm the new assertion fails while the schema still declares the legacy field.**
- [x] **Step 3: Remove `generationMethod` from `SavedCombinationDocumentSchema` and update the shared valid fixture to the new shape.**
- [x] **Step 4: Run the model test and confirm both new-shape acceptance and existing validation cases pass.**

### Task 5: UX review and local verification

**Files:** All changed UI and feature files.

- [x] **Step 1: Run the `ux-review` skill** on the unified generation screen, including empty input, selected balls, loading, AI error, and retry states; apply any relevant findings.
- [x] **Step 2: Fix reviewed copy** so the initial empty state does not imply numbers or opinions are required, and explain clearly that no opinion uses the default prompt for AI recommendation. Remove obsolete mode-card CSS left behind by the removed modes.
- [x] **Step 3: Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run format:check`; all must pass.**
- [x] **Step 4: Review the final diff for remaining method labels, branches, or tests that assume automatic/selected/AI-assisted modes.**
- [x] **Step 5: Report local verification results and prepare the PR update. Do not inspect GitHub Actions status unless requested.**

### Task 6: Resolve final branch-review findings

**Files:**

- Modify: `src/features/generation/hooks/use-generation-form.ts`
- Modify: `src/features/generation/components/generation-dashboard.tsx`
- Test: `src/features/generation/components/generation-dashboard.test.tsx`
- Modify: `src/features/generation/lib/generate-combinations.ts`
- Test: `src/features/generation/lib/generate-combinations.test.ts`
- Create: `src/features/generation/lib/summarize-generation-analysis.ts`
- Test: `src/features/generation/lib/summarize-generation-analysis.test.ts`
- Modify: `src/features/generation/server/run-generation.ts`
- Test: `src/features/generation/server/run-generation.test.ts`
- Modify: `src/features/generation/hooks/use-generate-combinations.ts`
- Modify: `src/features/generation/components/generation-results.tsx`
- Test: `src/features/generation/components/generation-dashboard.test.tsx`
- Modify: `src/features/generation/model/generation-request.ts`
- Modify: `src/features/analysis/index.ts`
- Modify: `architecture.md`

- [x] **Step 1: Add failing regressions** for edits during a pending request not enabling a second request; same generation seed yielding the same candidate batch while different seeds can vary a constrained batch; and deterministic top-five frequency/absence summary rendered with results.
- [x] **Step 2: Fix pending input behavior** by disabling generation controls while pending and guarding form handlers; keep one request in flight until it settles.
- [x] **Step 3: After ranking candidates by score, take the top `min(count * 3, candidateCount)` window, use the request-seeded RNG to sample `count` candidates without replacement, then order the selected results by score.** Preserve deterministic scores, constraints, no duplicates, and same-seed reproducibility while allowing different seeds to yield different batches when the candidate pool permits.
- [x] **Step 4: Add `summarizeGenerationAnalysis(analysis: WeeklyAnalysis): GenerationStatisticsSummary`** returning up to five most frequent numbers and up to five longest current absence gaps, sorted deterministically by metric descending and number ascending for ties; return it alongside the generation result and render it separately from the AI explanation.
- [x] **Step 5: Replace internal analysis imports with the public `@/features/analysis` exports; update `architecture.md` to say Groq is selected and leave account/model limits as operational checks.**
- [x] **Step 6: Run targeted generation tests, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run format:check`; all must pass.**
- [x] **Step 7: Review the fix diff and rerun the `ux-review` skill for pending controls and the statistics summary.**

**Task 6 interfaces:** `GenerationStatisticsSummary` has `mostFrequentNumbers: Array<{ number: number; count: number }>` and `longestCurrentAbsences: Array<{ number: number; drawsSinceLastAppearance: number }>`. Omit numbers with zero frequency and omit never-seen (`null`) gaps; cap each list at five.
