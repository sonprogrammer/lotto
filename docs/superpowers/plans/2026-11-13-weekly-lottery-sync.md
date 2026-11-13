# 주간 당첨 번호 자동 반영 구현 계획

> **For agentic workers:** 구현 시 superpowers:executing-plans 스킬을 사용하고 작업을 순서대로 진행합니다. 각 단계는 체크박스로 추적합니다.

**Goal:** 매주 토요일 오후 9시대에 당첨 결과를 동기화하고, 동기화 상태와 다음 예정 시각을 당첨 내역 화면에서 확인할 수 있게 합니다.

**Architecture:** Vercel Cron이 인증된 서버 경로를 호출하고 기존 동행복권 공개 결과 조회 주소와 MongoDB upsert 동기화를 사용합니다. 실행 상태는 공통 MongoDB 문서에 저장하며, 상태 API와 회차별 당첨 내역 화면은 기존 FSD 및 TanStack Query 흐름에 맞춥니다.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB, Zod, Vitest, TanStack Query, Tailwind CSS, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-11-13-weekly-lottery-sync-design.md`

## Global Constraints

- 당첨 자료는 AI가 만들지 않고 현재 동행복권 결과 조회 주소에서 가져옵니다.
- 예약 실행은 Vercel Hobby에서 매주 토요일 21시대(한국 시간)로 설정합니다.
- `CRON_SECRET`은 Production 환경에만 설정하며 저장소에 비밀값을 기록하지 않습니다.
- 공개 당첨 자료는 공통 데이터로 취급하고 개인 번호·세션 데이터와 섞지 않습니다.
- 같은 회차를 다시 처리해도 중복 문서를 만들지 않습니다.
- 잘못된 형식이나 불완전한 회차 응답은 저장하지 않습니다.
- 새 회차 또는 저장 자료 이상이 확인될 때 전체 회차를 다시 받아 upsert하며, 매주 전체 이력을 강제로 다시 조회하지 않습니다.
- 기존 과거 회차 정정은 전체 회차 동기화가 다시 수행될 때 반영합니다.
- 라우트 파일은 얇게 두고 FSD 레이어를 유지합니다. 컴포넌트와 훅은 각각 별도 파일로 둡니다.
- 상태 화면은 로딩·오류·빈 상태를 구분하며 브라우저 기본 alert/confirm/prompt를 사용하지 않습니다.

## Review Focus

- 비밀값 누락·불일치로 Cron을 직접 호출하면 거부하고 상태를 변경하지 않습니다. → Cron route 인증 테스트.
- 제공처가 빈 최신 응답이나 일시 장애를 반환하면 실패 상태를 남기고 이전 성공 정보를 보존합니다. → sync runner 재시도·실패 테스트.
- 동기화 재실행 또는 중복 전달에서도 동일 회차 문서는 하나만 유지합니다. → 기존 upsert 테스트와 Cron 재실행 테스트.
- 잘못된 JSON, 불완전 이력, 최신 회차 불일치는 성공으로 기록하지 않고 기존 이력을 보존합니다. → sync 실패 상태 테스트.
- KST 토요일 21시 전후의 다음 예정 시각 계산이 정확합니다. → 예정 시각 경계값 테스트.

---

## 파일 구조

- `vercel.json`: 토요일 12:00 UTC(한국 시간 21:00) Cron 선언.
- `.env.example`: `CRON_SECRET` 변수명과 빈 예시 값만 추가.
- `src/entities/lottery-draw/model/sync-status.ts`: 동기화 상태 문서 Zod 스키마와 타입.
- `src/entities/lottery-draw/server/lottery-sync-status.ts`: 상태 문서 조회·기록·완료 처리와 공통 상태 캐시 무효화.
- `src/entities/lottery-draw/server/run-lottery-draw-sync.ts`: 동기화 실행 기록과 Cron 재시도 정책을 조정.
- `src/entities/lottery-draw/server/sync-lottery-draws.ts`: 원본 조회의 재시도 가능한 네트워크·제공처 오류와 재시도 불가능한 데이터 검증 오류를 구분.
- `src/entities/lottery-draw/server/next-sync-time.ts`: KST 기준 다음 토요일 21시 계산.
- `src/entities/lottery-draw/index.ts`: 새 서버 API 공개.
- `src/app/api/cron/lottery-sync/route.ts`: `CRON_SECRET` 검사 후 동기화 runner 호출, 변경 시 공통 캐시 태그 만료.
- `src/app/api/lottery-draws/sync-status/route.ts`: 로그인 확인 후 공통 동기화 상태 반환.
- `src/features/analysis/hooks/use-lottery-sync-status.ts`: 상태 조회 TanStack Query 훅.
- `src/features/analysis/components/lottery-sync-status.tsx`: 동기화 시각·상태 UI.
- `src/features/analysis/components/lottery-sync-status.test.tsx`: 상태 UI 로딩·성공·실패 렌더링 테스트.
- `src/entities/lottery-draw/server/lottery-sync-status.test.ts`: 상태 저장소 테스트.
- `src/entities/lottery-draw/server/run-lottery-draw-sync.test.ts`: 재시도·실패 상태 테스트.
- `src/entities/lottery-draw/server/next-sync-time.test.ts`: 예정 시각 경계값 테스트.
- `src/app/api/cron/lottery-sync/route.test.ts`: 인증, 성공, 중복/실패 응답 테스트.
- `src/app/api/lottery-draws/sync-status/route.test.ts`: 로그인 보호 및 상태 응답 테스트.
- `src/features/analysis/components/lottery-draw-history.tsx`: 상태 표시 컴포넌트 배치.
- `src/features/analysis/components/lottery-draw-history.test.tsx`: 상태 요약이 실제 회차 목록과 함께 보이는지 검증.
- `spec.md`: 갱신 주기, 상태 표시, 수동 복구 흐름 반영.
- `architecture.md`: Vercel Cron, 상태 문서, 공개 자료 조회 출처, 실패·재시도 정책 반영.

## 작업

### Task 1: 동기화 상태 모델과 저장소

**Files:**

- Create: `src/entities/lottery-draw/model/sync-status.ts`
- Create: `src/entities/lottery-draw/server/lottery-sync-status.ts`
- Create: `src/entities/lottery-draw/server/lottery-sync-status.test.ts`
- Modify: `src/entities/lottery-draw/index.ts`

**Interface:**

- `LotterySyncStatus`: `{ lastAttemptAt: Date | null; lastSuccessAt: Date | null; state: "idle" | "running" | "success" | "failed"; latestRound: number | null; errorSummary: string | null }`
- `getLotterySyncStatus(): Promise<LotterySyncStatus>`
- `markLotterySyncStarted(runId: string, attemptedAt: Date): Promise<void>`
- `markLotterySyncSucceeded(runId: string, completedAt: Date, latestRound: number): Promise<void>`
- `markLotterySyncFailed(runId: string, failedAt: Date, errorSummary: string): Promise<void>`
- `LOTTERY_SYNC_STATUS_CACHE_TAG = "lottery-sync-status"`; status reads use Next.js server cache and every status transition expires this tag.

- [x] `getLotterySyncStatus`가 상태 문서가 없을 때 `idle`과 null 시각·회차를 반환하는 테스트를 작성합니다.
- [x] 시작·성공·실패 기록 후 상태 필드와 마지막 성공 시각 보존을 검증하는 저장소 테스트를 작성합니다.
- [x] 상태 조회가 공통 Next.js 서버 캐시에 들어가고 모든 상태 변경이 상태 태그를 즉시 만료하는지 검증합니다.
- [x] MongoDB `lottery_sync_status` 컬렉션의 고정 문서 ID에 Zod 검증을 적용해 저장소 함수를 구현합니다.
- [x] 상태 문서에 최근 시도 시각, 마지막 성공 시각, 최신 회차, 현재 상태, 사용자에게 노출 가능한 오류 요약만 기록합니다.
- [x] 엔티티 공개 진입점에 상태 타입과 서버 함수만 필요한 범위로 export합니다.

### Task 2: 동기화 실행 runner와 예약 경로

**Files:**

- Create: `src/entities/lottery-draw/server/run-lottery-draw-sync.ts`
- Create: `src/entities/lottery-draw/server/run-lottery-draw-sync.test.ts`
- Modify: `src/entities/lottery-draw/server/sync-lottery-draws.ts`
- Modify: `src/entities/lottery-draw/server/sync-lottery-draws.test.ts`
- Create: `src/app/api/cron/lottery-sync/route.ts`
- Create: `src/app/api/cron/lottery-sync/route.test.ts`
- Modify: `src/app/api/analysis/run/route.ts`
- Modify: `src/features/generation/server/run-generation.ts`
- Modify: `src/entities/saved-combination/server/store.ts`
- Modify: `src/entities/lottery-draw/index.ts`
- Modify: `vercel.json`
- Modify: `.env.example`

**Interface:**

- `runLotteryDrawSync({ maxAttempts }: { maxAttempts: number }): Promise<Awaited<ReturnType<typeof syncLotteryDraws>>>`; callers use `maxAttempts: 1`, Cron uses `maxAttempts: 3`.
- Cron endpoint: `GET /api/cron/lottery-sync`, Vercel `Authorization: Bearer <CRON_SECRET>` 인증.

- [x] 유효한 secret 없이는 runner가 실행되지 않고 MongoDB 상태도 바뀌지 않는 route 테스트를 작성합니다.
- [x] secret이 일치하면 runner를 한 번 실행하고 성공 JSON과 최신 회차를 반환하는 테스트를 작성합니다.
- [x] 일시 네트워크 오류·HTTP 429·5xx는 재시도 대상으로, 빈 결과·JSON 형식·스키마·회차 연속성 오류는 재시도 불가 대상으로 분류하는 테스트를 작성합니다.
- [x] 일시 네트워크 실패는 최대 3회 시도하고, 실패 상태를 남기며 일반적인 오류 요약만 응답하는 runner 테스트를 작성합니다.
- [x] `runLotteryDrawSync`가 시작 상태를 기록하고 최종 성공/실패 상태를 기록하도록 구현합니다. Cron 호출은 총 3회까지 시도하고 실패 사이에 1초, 2초 대기합니다. 검증 오류는 재시도하지 않습니다.
- [x] 분석, 생성, 저장 조합의 기존 동기화 호출도 runner의 `maxAttempts: 1`을 사용해 성공·실패 시각을 공유 상태에 반영합니다.
- [x] Cron route는 `CRON_SECRET` 누락 또는 Bearer token 불일치면 401을 반환하고 runner를 호출하지 않습니다.
- [x] 성공하며 데이터가 변경된 경우 `WEEKLY_ANALYSIS_CACHE_TAG`와 `LOTTERY_DRAW_HISTORY_CACHE_TAG`를 만료합니다.
- [x] `vercel.json`에 `0 12 * * 6` 스케줄을 선언하고 `.env.example`에는 실제 값 없이 `CRON_SECRET=`만 추가합니다.

### Task 3: 상태 API, 예정 시각, 회차 화면

**Files:**

- Create: `src/entities/lottery-draw/server/next-sync-time.ts`
- Create: `src/entities/lottery-draw/server/next-sync-time.test.ts`
- Create: `src/app/api/lottery-draws/sync-status/route.ts`
- Create: `src/app/api/lottery-draws/sync-status/route.test.ts`
- Create: `src/features/analysis/hooks/use-lottery-sync-status.ts`
- Create: `src/features/analysis/components/lottery-sync-status.tsx`
- Create: `src/features/analysis/components/lottery-sync-status.test.tsx`
- Modify: `src/features/analysis/components/lottery-draw-history.tsx`
- Modify: `src/features/analysis/components/lottery-draw-history.test.tsx`

**Interface:**

- `getNextLotterySyncAt(now: Date): Date`: 다음 KST 토요일 21:00 예정 시각.
- `GET /api/lottery-draws/sync-status`: `{ lastAttemptAt: string | null; lastSuccessAt: string | null; state: "idle" | "running" | "success" | "failed"; latestRound: number | null; errorSummary: string | null; nextExpectedAt: string }`.
- `useLotterySyncStatus(): UseQueryResult<LotterySyncStatusResponse>` with query key `['lottery-sync-status']` and stale time 60 seconds.

- [x] 금요일, 토요일 20:59, 토요일 21:00, 토요일 21:01, 일요일에서 다음 실행 시각이 맞는 테스트를 작성합니다.
- [x] 상태 API에서 미인증 요청은 401, 인증 요청은 상태와 ISO 날짜 응답을 반환하는 테스트를 작성합니다.
- [x] 상태 컴포넌트가 첫 실행 대기, 실행 중, 성공(최근 회차·마지막 성공), 실패(마지막 성공 보존·분석 화면 복구 안내)를 구분하는 테스트를 작성합니다.
- [x] 훅에서 상태 API를 호출하고 공통 데이터 키로 60초 캐시하도록 구현합니다.
- [x] 사용자별 정보가 없는 상태 응답은 Next.js 서버 캐시로 공유하고, 인증 쿠키가 포함된 API 응답 자체에는 사용자 데이터나 공개 캐시 헤더를 넣지 않습니다.
- [x] 회차 이력 화면 상단에 상태 컴포넌트를 배치하고, 이미 로드한 회차 목록의 기존 로딩·오류 흐름을 바꾸지 않습니다.
- [x] 표시 시각은 `Intl.DateTimeFormat`의 `Asia/Seoul`로 포맷합니다.

### Task 4: 제품·기술 문서 갱신

**Files:**

- Modify: `spec.md` §4.6
- Modify: `architecture.md` §2, §6, §7, §8

- [x] `spec.md`에 토요일 21시대 자동 갱신, 상태 표시, 실패 시 분석 화면에서 복구, 실제 반영 지연 가능성을 기록합니다.
- [x] `architecture.md`의 미정 예약작업 항목을 삭제하고 Vercel Cron, KST 스케줄, `CRON_SECRET`, 단일 상태 문서와 재시도·중복 처리 원칙을 기록합니다.
- [x] `architecture.md`에서 출처를 동행복권 공식 결과 페이지의 공개 JSON 응답으로 설명하되, 별도 공식 Open API 또는 명시적 재사용 허가를 확인한 것으로 표현하지 않습니다.
- [x] 공개 회차 자료와 공통 동기화 상태의 서버 캐시 적용 및 인증 API 응답 정책이 기존 캐시 원칙과 일치하는지 확인합니다.

### Task 5: 기능 검증

- [x] `npm test` 실행 후 전체 테스트가 통과하는지 확인합니다. (62개 파일, 336개 테스트)
- [x] `npm run typecheck` 실행 후 통과를 확인합니다.
- [x] `npm run lint` 실행 후 통과를 확인합니다.
- [x] `npm run build` 실행 후 통과를 확인합니다.
- [x] UI 포함 기능이므로 `ux-review`를 실행하고 결과를 반영한 뒤 로컬 검증을 다시 수행합니다. (코드 기반 검토; 브라우저 화면은 확인하지 않음)
- [x] Vercel Production 환경에서 손 대표님이 `CRON_SECRET`을 직접 설정해야 함을 PR 본문에 안내합니다. 비밀값 자체를 묻거나 저장소에 추가하지 않습니다.

> 배포 전 설정: Vercel Production 환경 변수에 `CRON_SECRET`을 직접 등록해야 합니다. 로컬에 실값을 기록하거나 이 저장소에 추가하지 않았습니다.
