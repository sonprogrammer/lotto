# 비로그인 홈 랜딩 경험 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비로그인 홈을 사주 숫자 로그인 혜택과 무작위 번호 체험을 함께 보여주는 반응형 랜딩 화면으로 바꾸고, 브라우저별 랜덤 생성을 3회로 제한합니다.

**Architecture:** Next.js 홈의 세션 분기는 유지합니다. 게스트 횟수는 별도 preview 훅에서 `localStorage`로 관리하고, 로그인 숫자·서버/API 동작은 추가하지 않습니다. 기존 공 회전·순차 공개 애니메이션과 `SiteHeader`, Sonner를 재사용합니다.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, 기존 CSS, Sonner, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-guest-landing-experience-design.md`, `spec.md`, `architecture.md`

## Completed Before Implementation

- Approved requirements are reflected in `spec.md` and `architecture.md`.
- The design document status is approved.

## Global Constraints

- 로그인 전에는 통계 분석이나 AI 번호 추천을 제공하지 않습니다.
- 게스트 무작위 번호는 서로 다른 1~45 숫자 6개이며 기존 순차 공개 애니메이션을 유지합니다.
- 게스트 생성 횟수는 브라우저별 최대 3회이며 `localStorage`에 보관합니다. 계정·서버·IP 기준 제한으로 표현하지 않습니다.
- 3회를 사용한 뒤의 시도는 새 번호를 만들지 않고 로그인 안내 Sonner 알림을 표시합니다.
- 로그인한 사용자의 오늘의 사주 화면과 추천 흐름은 변경하지 않습니다.
- 애니메이션은 `prefers-reduced-motion` 설정을 따르며, 번호 공을 뒤집지 않습니다.
- 컴포넌트와 커스텀 훅은 각각 역할에 맞는 파일로 분리하고, 기존 UI와 로그인을 재사용합니다.

## Review Focus

- 저장 횟수가 3회보다 크거나 숫자가 아닌 값이면 3회로 보정하고, 없는 값은 0회로 시작한다. (Task 1)
- 브라우저 저장소를 읽기 전에는 생성 버튼을 사용할 수 없다. (Task 1)
- 생성 클릭 시 애니메이션 종료를 기다리지 않고 사용 횟수를 기록한다. (Task 1)
- 세 번째 생성 뒤 네 번째 클릭은 번호 생성 없이 로그인 안내만 표시한다. (Task 2)
- 저장소 접근이 차단돼도 화면이 오류로 멈추지 않으며, 시스템 모션 감소 설정에서 기존 공 효과가 즉시 완성된다. (Task 1, Task 2)

---

### Task 1: 게스트 생성 횟수 상태

**Files:**

- Create: `src/features/preview/lib/guest-draw-quota.ts`
- Create: `src/features/preview/lib/guest-draw-quota.test.ts`
- Create: `src/features/preview/hooks/use-guest-draw-limit.ts`
- Create: `src/features/preview/hooks/use-guest-draw-limit.test.ts`

**Interfaces:**

- `MAX_GUEST_DRAWS: number`는 `3`입니다.
- `getGuestDrawCount(value: string | null): number`는 저장 값이 없거나 유효하지 않으면 `0`, 유효한 값은 정수로 읽고 3으로 제한합니다.
- `useGuestDrawLimit()`은 `{ drawCount: number, isReady: boolean, tryRecordDraw: () => boolean }`을 반환합니다. `tryRecordDraw()`는 저장된 횟수를 다시 확인하고, 3회 미만일 때만 횟수를 기록한 뒤 `true`를 반환합니다.
- `localStorage` 접근 예외는 잡아 화면 오류를 막습니다. 저장소가 차단된 경우 현재 화면 세션 안에서만 횟수를 관리합니다.

- [x] **Step 1: 실패하는 횟수 파서 테스트 작성**
  - 0·1·3, null·문자열·음수·소수·3 초과 입력을 검증합니다.
- [x] **Step 2: 파서 테스트 실행해 실패 확인**
  - Run: `npm test -- --run src/features/preview/lib/guest-draw-quota.test.ts`
  - Expected: `getGuestDrawCount` 미구현 실패.
- [x] **Step 3: 파서와 상수 구현**
  - `MAX_GUEST_DRAWS = 3`; 잘못된 값은 0, 유효 정수는 0~3으로 제한합니다.
- [x] **Step 4: 훅 테스트 작성 후 실패 확인**
  - 초기 저장값 복원, 준비 전 비활성 상태, 3회까지만 기록, 저장소 예외 시 세션 내 동작을 검증합니다.
- [x] **Step 5: `useGuestDrawLimit` 구현**
  - 저장소를 `useEffect`에서 읽고 준비 여부를 노출합니다. 시도마다 현재 저장 값을 확인하고 기록합니다.
- [x] **Step 6: 훅 테스트 실행해 통과 확인**
  - Run: `npm test -- --run src/features/preview/lib/guest-draw-quota.test.ts src/features/preview/hooks/use-guest-draw-limit.test.ts`
  - Expected: 모든 횟수 경계·복원·예외 테스트 통과.

### Task 2: 랜딩 화면과 번호 생성 제한 연결

**Files:**

- Create: `src/features/preview/components/guest-daily-saju-promo.tsx`
- Modify: `src/features/preview/components/lotto-number-preview.tsx`
- Modify: `src/features/preview/components/lotto-number-preview.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- `GuestDailySajuPromo`은 `{ isConfigured: boolean }`을 받고 로그인 혜택 문구와 카카오 로그인 동작을 제공합니다.
- `LottoNumberPreview`는 기존 이름과 역할을 유지하고, 게스트 사용 제한 훅과 랜딩 섹션을 조합합니다.
- 훅의 `tryRecordDraw()`가 `false`이면 생성·애니메이션 상태를 변경하지 않고 `toast.info`로 로그인 안내를 표시합니다.

- [x] **Step 1: 컴포넌트 회귀 테스트 추가**
  - 사주 숫자 로그인 혜택, 진행 횟수, 최대 3회 생성, 네 번째 시도에서 번호 미생성 및 toast, 기존 1~6번 순차 공개를 검증합니다.
- [x] **Step 2: 대상 테스트 실행해 새 제한 테스트의 실패 확인**
  - Run: `npm test -- --run src/features/preview/components/lotto-number-preview.test.tsx`
  - Expected: 랜딩 혜택 및 쿼터 제한 테스트 실패.
- [x] **Step 3: 사주 혜택 카드 구현**
  - 로그인 사용자의 화면·사주 API를 호출하지 않고, 승인된 소개 문구와 기존 카카오 로그인 시작 훅만 사용합니다.
- [x] **Step 4: 홈 레이아웃과 제한 연결**
  - 데스크톱은 왼쪽 소개·오른쪽 체험, 작은 화면은 체험 후 소개 순서로 표시합니다. 기존 공 애니메이션은 유지합니다.
- [x] **Step 5: 테스트 실행해 통과 확인**
  - Run: `npm test -- --run src/features/preview/components/lotto-number-preview.test.tsx`
  - Expected: 랜딩·제한·기존 애니메이션 테스트 통과.

### Task 3: UX 검토와 전체 검증

**Files:**

- Review: `src/features/preview/components/lotto-number-preview.tsx`
- Review: `src/features/preview/components/guest-daily-saju-promo.tsx`
- Review: `src/app/globals.css`
- Review: related tests and docs

- [x] `ux-review` 스킬로 첫 방문, 1~3회 체험, 횟수 초과 로그인 안내, 작은 화면, reduced-motion 흐름을 검토하고 필요한 수정 반영.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` 실행.
- [x] `git diff --check` 확인 후 PR을 생성하고 병합은 하지 않습니다.
