# 실데이터 분석·회차 조회·인증 로딩 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 사용자가 버튼을 눌러 실당첨 이력을 동기화하고 전체 통계를 계산하며, 회차별 결과를 확인하고 새로고침 때 로그인 상태가 깜빡이지 않도록 한다.

**Architecture:** 서버에서 동행복권 회차 묶음 조회를 한 번 호출해 응답을 검증한 뒤 회차별 upsert로 MongoDB에 저장한다. 분석 실행과 회차 목록 API는 세션을 확인하고, 화면은 기존 FSD 구조와 표준 `fetch`를 사용한다. 홈은 인증을 확인한 서버 렌더링 결과만 보여주며, 로딩 UI는 게스트 상태 대신 중립 스켈레톤을 쓴다.

**Tech Stack:** Next.js App Router, React, TypeScript, MongoDB, Zod, native fetch, Vitest, React Testing Library.

**Spec:** `spec.md`, `architecture.md`, GitHub issue #22.

## Global Constraints

- 통계는 저장된 공개 회차를 사용하고, 빈 자료를 예시 통계로 대체하지 않는다.
- 회차 upsert와 화면 요청은 재시도되어도 중복 자료를 만들지 않는다.
- 서버 자격 증명을 클라이언트에 전달하지 않는다.
- 코드 구조는 FSD, 컴포넌트·훅은 역할별 파일 하나씩 유지한다.
- 사용자 흐름 변경은 PR 전 `ux-review`를 수행한다.

## Review Focus

- 외부 응답이 HTML/오류/잘못된 번호면 DB에 쓰지 않고 재시도 가능한 오류를 보여준다.
- 최신 회차가 외부 데이터에서 누락되거나 중복되면 분석 기준 회차를 잘못 표시하지 않는다.
- MongoDB 실패 때 오류를 빈 데이터처럼 표시하지 않는다.
- 페이지네이션 cursor가 잘못된 값이면 검증 오류를 반환한다.
- 기존 세션은 게스트 UI로 먼저 렌더링하지 않으며, 닉네임이 없는 계정에는 이름 갱신 절차를 안내한다.

---

### Task 1: 당첨 자료 검증과 MongoDB 동기화

**Files:**

- Modify: `src/entities/lottery-draw/model/document.ts`
- Create: `src/entities/lottery-draw/server/source-response.ts`
- Create: `src/entities/lottery-draw/server/sync-lottery-draws.ts`
- Test: matching model and server test files

**Interfaces:** `syncLotteryDraws(): Promise<{ drawCount: number; latestRound: number }>`.

- [x] 원천 응답 파싱, 번호·일자·등위별 상금 검증, 중복 회차 upsert 테스트를 먼저 작성하고 실패를 확인한다.
- [x] 성공 응답에 `data.list`가 없거나 유효성 검사에서 실패하면 DB 변경이 없음을 테스트한다.
- [x] 검증된 1회~최신 회차를 MongoDB `lottery_draws`에 회차별 upsert한다.
- [x] 테스트 파일에서 동기화 테스트를 통과시킨다.

### Task 2: 인증 분석 API와 회차 목록 API

**Files:**

- Create: `src/app/api/analysis/run/route.ts` and tests
- Create: `src/app/api/lottery-draws/route.ts` and tests
- Create/modify: `src/entities/lottery-draw/server/list-lottery-draws.ts` and tests

**Interfaces:** 분석 API는 `{ analysis, drawCount, latestRound }`를 반환한다. 목록 API는 `{ draws, nextCursor }`를 반환하고 최신 회차부터 조회한다.

- [x] 비로그인 차단, 동기화·분석 호출, API 오류 테스트를 먼저 작성하고 실패를 확인한다.
- [x] 회차 목록 cursor와 페이지 크기 검증 및 정렬 테스트를 먼저 작성하고 실패를 확인한다.
- [x] API 구현 후 각 경로 테스트를 통과시킨다.

### Task 3: 분석·회차 조회 UI와 비동기 상태

**Files:**

- Modify: `src/features/analysis/components/analysis-dashboard.tsx` and tests
- Create: focused components/hooks under `src/features/analysis/`
- Create: `src/app/history/page.tsx` and route tests
- Modify: `src/app/globals.css`

- [x] 버튼 전 상태, 진행 중, 성공 결과, 빈 결과, 실패/재시도 UI 테스트를 먼저 작성한다.
- [x] 회차 화면의 최신순 목록·다음 페이지 로드·로딩/실패/빈 상태 테스트를 먼저 작성한다.
- [x] 서버 응답을 사용해 분석 실행과 회차 내역 화면을 구현한다.
- [x] 접근 가능한 로딩 표식, 버튼 비활성화, 모바일 레이아웃을 확인한다.

### Task 4: 세션 깜빡임 및 닉네임 갱신 안내

**Files:**

- Modify: `src/app/page.tsx`
- Create: `src/app/loading.tsx`
- Modify: `src/features/auth/components/auth-aware-preview.tsx` and tests
- Modify: auth header/control only if required

- [x] 홈 페이지가 인증된 서버 결과를 기다리고 중립 로딩 화면을 쓰는 테스트를 먼저 작성한다.
- [x] 저장된 닉네임이 없을 때 재로그인 없이 복구가 불가능한 이유를 고려해 카카오 프로필 갱신 동작을 안내하는 테스트를 작성한다.
- [x] 기존 세션 유지와 갱신 안내를 구현한다.

### Task 5: 문서·UX 검토·로컬 검증

- [x] `AGENTS.md`에 비동기 화면 스켈레톤, 로딩, 빈 상태, 오류·재시도 규칙을 기록한다.
- [x] 데이터 출처와 수집 제한을 `architecture.md`에 기록한다.
- [x] `ux-review` 결과를 반영한다.
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`를 실행한다.
