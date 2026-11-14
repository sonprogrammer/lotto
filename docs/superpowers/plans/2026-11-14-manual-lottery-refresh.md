# 회차별 당첨 번호 수동 확인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회차별 당첨 내역 화면에서 사용자가 현재 공개된 당첨 번호를 직접 확인할 수 있도록 합니다.

**Architecture:** 인증된 `POST /api/lottery-draws/sync`가 기존 정기 작업과 같은 `syncAndReconcileSavedCombinationDrawResults` 함수를 호출합니다. 기존 회차 자료가 바뀌면 Next.js 공통 캐시와 화면의 TanStack Query 캐시를 갱신합니다.

**Tech Stack:** Next.js Route Handler, MongoDB 기존 동기화 서비스, TanStack Query, TypeScript, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-14-manual-lottery-refresh-design.md`, `spec.md`, `architecture.md`

## Global Constraints

- 사용자 개인 데이터는 현재 인증 사용자로 제한하고, 회차 자료와 분석 자료는 공통 데이터로 처리합니다.
- 동기화는 기존 회차 검증과 중복 방지 구현을 재사용합니다.
- 버튼은 요청 중 중복 실행할 수 없고, 성공·변경 없음·실패 상태를 분명히 표시합니다.

## Review Focus

- 로그인 세션이 없는 요청은 외부 자료 조회 전에 거부되어야 합니다.
- 새 회차가 없어도 현재 최신 회차를 성공 상태로 알려야 합니다.
- 새 회차가 저장되면 회차 내역·분석 캐시가 갱신되어야 합니다.
- 동기화가 실패하면 기존 회차 자료는 그대로 남고 사용자가 재시도할 수 있어야 합니다.
- 요청 중 버튼 연타로 중복 동기화를 실행하지 않아야 합니다.

---

### Task 1: 인증된 수동 동기화 API

**Files:**

- Create: `src/app/api/lottery-draws/sync/route.ts`
- Create: `src/app/api/lottery-draws/sync/route.test.ts`
- Modify: `spec.md`
- Modify: `architecture.md`

**Interfaces:**

- `POST /api/lottery-draws/sync`는 로그인 사용자의 요청만 허용합니다.
- 성공 응답: `{ changed: boolean, latestRound: number }`
- 실패 응답은 안전한 한국어 메시지를 담고 원본 제공처 응답을 노출하지 않습니다.
- 기존 `syncAndReconcileSavedCombinationDrawResults({ maxAttempts: 1 })`를 재사용합니다.

- [x] 미로그인 차단, 새 자료 반영 시 두 공통 캐시 태그 갱신, 변경 없음 시 태그 미갱신, 실패 응답을 검증하는 라우트 테스트를 작성하고 RED를 확인합니다.
- [x] 인증 확인 후 기존 동기화 서비스를 실행하는 POST Route Handler를 추가합니다.
- [x] 요구사항 문서에 수동 확인 동작과 캐시 반영을 기록합니다.
- [x] 라우트 테스트를 실행해 GREEN을 확인합니다.

### Task 2: 회차 내역 화면의 확인 버튼

**Files:**

- Create: `src/features/analysis/hooks/use-manual-lottery-sync.ts`
- Modify: `src/features/analysis/components/lottery-sync-status.tsx`
- Modify: `src/features/analysis/components/lottery-draw-history.tsx`
- Modify: 관련 컴포넌트 테스트

**Interfaces:**

- `useManualLotterySync()`는 `{ isPending, message, errorMessage, sync }`를 제공합니다.
- 성공 시 상태 조회를 항상 갱신하고, `changed`가 참이면 회차 내역과 주간 분석 캐시도 갱신합니다.
- 버튼은 `당첨 번호 확인`과 처리 중 `확인 중...`을 표시하고 처리 중 비활성화됩니다.
- 성공·변경 없음은 `role="status"`, 실패는 `role="alert"`로 안내합니다.

- [x] 버튼의 처리 중·성공·변경 없음·실패 상태를 검증하는 컴포넌트 테스트를 작성하고 RED를 확인합니다.
- [x] 커스텀 훅에서 API 요청과 TanStack Query 캐시 갱신을 처리합니다.
- [x] 당첨 내역 화면에 버튼과 접근 가능한 결과 메시지를 연결합니다.
- [x] 관련 컴포넌트 테스트를 실행해 GREEN을 확인합니다.
