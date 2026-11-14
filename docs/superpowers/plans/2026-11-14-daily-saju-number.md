# 오늘의 사주 숫자 추천 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 사용자의 메인 화면에 한국시간 기준 하루 한 개의 AI 사주 추천 숫자를 보여주고 저장한다.

**Architecture:** 서버에서 `manseryeok`으로 생년 사주와 오늘의 일주를 계산하고, 민감한 입력을 제외한 계산 요약만 Groq에 보내 숫자 하나와 한국어 설명을 받는다. 프로필과 날짜별 결과는 MongoDB 개인 데이터로 저장하고, 사용자·KST 날짜 고유 키와 원자적 생성 선점으로 중복 추천을 막는다.

**Tech Stack:** Next.js App Router, TypeScript, MongoDB, Zod, TanStack Query, Groq, `manseryeok` (MIT), Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-daily-saju-number-design.md`, `spec.md`, `architecture.md`

## Global Constraints

- 프로젝트 코드는 FSD 구조를 따르고 Next.js 라우트 파일은 얇게 유지한다.
- React 컴포넌트와 커스텀 훅은 원칙적으로 파일 하나에 하나씩 둔다.
- 공통 UI나 상호작용이 반복되면 기존 공통 컴포넌트를 먼저 재사용한다.
- 개인 데이터는 인증된 사용자 ID로 격리하고 공용 Next.js 서버 캐시에 넣지 않는다.
- 모든 생년 정보, API 키, 외부 서비스 자격 증명은 서버에만 둔다.
- 화면 문구는 한국어로 쓰며 사주 추천이 당첨 확률을 높이거나 당첨을 예측한다고 표현하지 않는다.
- 같은 사용자·같은 `Asia/Seoul` 날짜에 성공 추천은 한 건만 저장한다.
- 출생 시각은 선택이며, 없으면 정오 계산 결과에서 시주를 제외한다.

## Review Focus

- 음력 윤달 여부는 음력 날짜일 때만 저장하고, 양력으로 전환할 때 입력값을 잘못 재사용하지 않는지 확인한다.
- 출생 시각이 없는 프로필은 시주를 Groq에 보내지 않고, 입력된 시각은 정확한 hour/minute로 계산하는지 확인한다.
- KST 자정 전후의 UTC 날짜와 추천 `dateKey`가 하루 앞뒤로 어긋나지 않는지 확인한다.
- 동시 홈 접속은 DB에 이미 결과가 있거나 다른 요청이 생성 중이면 Groq를 중복 호출하지 않는지 확인한다.
- 잘못된 AI JSON, 범위 밖 숫자, 비한국어 설명을 저장하지 않고 재시도 가능한 오류로 반환하는지 확인한다.

---

### Task 1: 사주 프로필 및 일일 추천 문서 모델

**Files:**

- Create: `src/entities/user/model/saju-profile.ts`
- Create: `src/entities/user/model/saju-profile.test.ts`
- Modify: `src/entities/user/model/document.ts`
- Modify: `src/entities/user/model/document.test.ts`
- Create: `src/entities/daily-saju/index.ts`
- Create: `src/entities/daily-saju/model/document.ts`
- Create: `src/entities/daily-saju/model/document.test.ts`

**Interfaces:**

- Produces `SajuProfileSchema`, `SajuProfileInputSchema`, and their inferred types with optional `displayName`, `birthDate: YYYY-MM-DD`, `calendarType: solar | lunar`, lunar-only `isLeapMonth`, and optional `birthTime: HH:mm`.
- Produces `DailySajuRecommendationDocumentSchema` for `generating` and `ready` records keyed by `userId` and `dateKey`; generating records have a 30-second `leaseExpiresAt`.

- [x] **Step 1: Write failing model tests** for valid solar/lunar profiles, optional name/time, lunar leap-month validation, valid 1–45 results, and rejected malformed documents.
- [x] **Step 2: Run the focused tests** with `npm test -- src/entities/user/model/saju-profile.test.ts src/entities/user/model/document.test.ts src/entities/daily-saju/model/document.test.ts`; confirm new cases fail before implementation.
- [x] **Step 3: Implement the schemas** in the listed model files and extend the existing user document with an optional `sajuProfile` field without changing Kakao `nickname`.
- [x] **Step 4: Run the focused tests** and confirm all profile and recommendation document cases pass.

### Task 2: Profile storage and management API

**Files:**

- Create: `src/entities/user/server/saju-profile-store.ts`
- Create: `src/entities/user/server/saju-profile-store.test.ts`

**Interfaces:**

- `getSajuProfile(userId: string): Promise<SajuProfile | null>`
- `saveSajuProfile(userId: string, input: SajuProfileInput): Promise<SajuProfile>`

- [x] **Step 1: Write failing store tests** for authenticated user scoping, profile upsert, optional fields, and leaving unrelated user documents unchanged.
- [x] **Step 2: Run the focused store tests** and confirm they fail for missing store functions.
- [x] **Step 3: Implement the MongoDB profile store** using the authenticated user's ObjectId; do not accept a user ID from the request body.
- [x] **Step 4: Run the focused model and store tests** and confirm they pass.

### Task 3: KST date and Manseryeok calculation

**Files:**

- Create: `src/features/daily-saju/index.ts`
- Create: `src/features/daily-saju/model/daily-saju-input.ts`
- Create: `src/features/daily-saju/model/daily-saju-input.test.ts`
- Create: `src/features/daily-saju/lib/get-kst-date-key.ts`
- Create: `src/features/daily-saju/lib/get-kst-date-key.test.ts`
- Create: `src/features/daily-saju/server/calculate-saju-context.ts`
- Create: `src/features/daily-saju/server/calculate-saju-context.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- `getKstDateKey(now: Date): string` returns `YYYY-MM-DD` in `Asia/Seoul`.
- `calculateSajuContext(profile: SajuProfile, today: string): SajuAiContext` returns birth year/month/day pillars, optional birth hour pillar, and today's day pillar only.

- [x] **Step 1: Write failing tests** for UTC/KST day boundaries, leap-month input validation, profile with known birth time, and profile with unknown birth time that omits its hour pillar.
- [x] **Step 2: Run focused tests** and verify the boundary and calculation cases fail before implementation.
- [x] **Step 3: Add `manseryeok`** and implement KST date formatting plus server-only context calculation; use noon only as the calculation input when birth time is absent and discard that calculated hour pillar.
- [x] **Step 4: Run focused tests** and verify all KST and saju-context cases pass.

### Task 4: Groq daily-number recommendation and idempotent persistence

**Files:**

- Create: `src/features/daily-saju/server/groq-daily-number.ts`
- Create: `src/features/daily-saju/server/groq-daily-number.test.ts`
- Create: `src/entities/daily-saju/server/daily-saju-store.ts`
- Create: `src/entities/daily-saju/server/daily-saju-store.test.ts`
- Create: `src/features/daily-saju/server/ensure-daily-recommendation.ts`
- Create: `src/features/daily-saju/server/ensure-daily-recommendation.test.ts`
- Create: `src/features/daily-saju/server/delete-saju-profile.ts`
- Create: `src/features/daily-saju/server/delete-saju-profile.test.ts`

**Interfaces:**

- `getGroqDailyNumber(context: SajuAiContext): Promise<{ number: number; explanation: string }>` sends no raw name, birth date, Kakao data, or user ID.
- `ensureDailyRecommendation(userId: string, dateKey: string): Promise<DailySajuRecommendation>` returns an existing result or atomically claims and stores one new result.
- `deleteSajuProfile(userId: string): Promise<void>` removes the profile and that user's daily recommendation history without making `entities/user` depend on `entities/daily-saju`.

- [x] **Step 1: Write failing Groq tests** for strict JSON output, Korean short explanation, number bounds, malformed output, provider error, and absence of personal identifiers in the request body.
- [x] **Step 2: Run focused Groq tests** and confirm validation and privacy cases fail before implementation.
- [x] **Step 3: Implement the Groq request** using the existing server model and timeout conventions; validate `{ number, explanation }` with Zod and never invent fallback output.
- [x] **Step 4: Write failing store/use-case tests** for existing-result reuse, one winner under concurrent requests, ready result persistence, failed-claim release, retry after provider failure, and profile deletion with daily history removal.
- [x] **Step 5: Implement unique `{ userId, dateKey }` index and atomic generation claim** with a 30-second lease; return an in-progress state to competing requests without calling Groq again and reclaim expired leases.
- [x] **Step 6: Implement `ensureDailyRecommendation`** to load the profile, calculate the KST saju context, request one AI result, validate, and store it.
- [x] **Step 7: Run focused Groq, store, and use-case tests** and confirm they pass.

### Task 5: Recommendation API

**Files:**

- Create: `src/app/api/daily-saju/recommendation/route.ts`
- Create: `src/app/api/daily-saju/recommendation/route.test.ts`
- Create: `src/app/api/saju-profile/route.ts`
- Create: `src/app/api/saju-profile/route.test.ts`

**Interfaces:**

- `POST /api/daily-saju/recommendation` accepts no user ID or date from the client; session and KST date are resolved server-side.
- Responses distinguish `profile-required`, `generating`, `ready`, and retryable provider errors.

- [x] **Step 1: Write failing route tests** for unauthenticated access, missing profile, existing result reuse, new result creation, provider errors, profile GET/PUT, and profile deletion.
- [x] **Step 2: Run the route tests** and confirm new route cases fail before implementation.
- [x] **Step 3: Implement thin recommendation POST and profile GET/PUT/DELETE routes** using `getCurrentUser`, `getKstDateKey`, `ensureDailyRecommendation`, and the approved profile use cases; set `Cache-Control: private, no-store`.
- [x] **Step 4: Run focused route tests** and confirm all cases pass.

### Task 6: Home profile form and daily recommendation card

**Files:**

- Create: `src/features/daily-saju/hooks/use-saju-profile.ts`
- Create: `src/features/daily-saju/hooks/use-save-saju-profile.ts`
- Create: `src/features/daily-saju/hooks/use-delete-saju-profile.ts`
- Create: `src/features/daily-saju/hooks/use-daily-saju-recommendation.ts`
- Create: `src/features/daily-saju/components/saju-profile-form.tsx`
- Create: `src/features/daily-saju/components/saju-profile-form.test.tsx`
- Create: `src/features/daily-saju/components/daily-saju-card.tsx`
- Create: `src/features/daily-saju/components/daily-saju-card.test.tsx`
- Modify: `src/features/auth/components/auth-aware-preview.tsx`
- Modify: `src/features/auth/components/auth-aware-preview.test.tsx`
- Modify: `src/features/preview/components/lotto-number-preview.tsx` only if needed to preserve guest behavior while separating the authenticated home.

**Interfaces:**

- Hooks own profile and recommendation requests and use per-user TanStack Query keys; UI components do not implement API requests directly.
- The profile form exposes optional display name, solar/lunar date, lunar-only leap-month choice, optional time, save, edit, and delete.
- The authenticated home shows the daily card; the guest home retains the existing six-ball random preview.
- The server home passes its KST `dateKey` to the client card so query keys do not depend on the browser's local timezone.
- The home composition uses the daily feature's public `index.ts` entry point and does not import its internal files from another feature.

- [x] **Step 1: Write failing component tests** for profile registration/edit/delete, conditional leap-month field, loading/error states, ready daily number reuse, and guest preview preservation.
- [x] **Step 2: Run focused component tests** and confirm the new states fail before implementation.
- [x] **Step 3: Implement the four separated hooks** with keys containing `userId` and server-provided KST date; clear private user caches on logout/account change using existing auth behavior.
- [x] **Step 4: Implement the profile form and daily card** using existing shared confirmation and lottery-ball UI; keep one component per file and Tailwind utility styling.
- [x] **Step 5: Update the home state split** so authenticated users see the daily saju home and guests retain the random preview.
- [x] **Step 6: Run focused home and component tests** and confirm all flows pass.

### Task 7: UX review and local verification

**Files:**

- Review all UI/API files changed by Tasks 2, 5, and 6.

- [x] Run the `ux-review` skill after frontend and backend flows are implemented; address applicable findings.
- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run format:check` in the feature worktree.
- [x] Inspect the final diff and confirm no secrets, unrelated changes, or undocumented requirements were introduced.
