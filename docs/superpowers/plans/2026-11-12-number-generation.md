# Number Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 사용자가 통계와 선택 조건으로 1~10개 조합을 만들고 요청당 AI 설명 1~2줄을 확인한다.

**Architecture:** 서버가 기간별 공개 통계를 읽어 후보 조합을 계산한다. Groq은 프롬프트 조건 해석과 조합 전체 설명에 사용하며, 응답은 검증한다. 화면은 단일 생성 요청과 결과를 표시한다.

**Tech Stack:** Next.js 16, TypeScript, Zod, MongoDB, TanStack Query, Groq HTTP API

**Spec:** `docs/superpowers/specs/2026-11-12-number-generation-design.md`

## Global Constraints

- 로그인 전에는 무작위 미리보기만 제공한다.
- 번호는 1~45의 서로 다른 정수 6개, 요청 개수는 1~10개이며 기본 5개다.
- 비밀 키는 서버에만 둔다. 당첨 확률 상승을 암시하지 않는다.
- AI 요청은 생성당 한 번이고, 설명은 조합 전체에 대해 1~2줄이다.
- 각 React 컴포넌트와 커스텀 훅은 별도 파일에 둔다.

## Review Focus

- 고정 번호 중복·범위 초과 입력은 요청 단계에서 거절한다.
- 고정 번호 6개와 요청 개수 2개 이상은 거절한다.
- 프롬프트 조건이 고정 번호와 충돌하면 조합을 만들지 않고 이유를 알린다.
- Groq 실패·한도 초과는 AI 설명을 지어내지 않고 오류와 재시도를 표시한다.
- 연속 클릭은 중복 요청을 만들지 않는다.

---

### Task 1: 입력과 통계 기반 조합 계산

**Files:** `src/features/generation/model/generation-request.ts`, `src/features/generation/lib/generate-combinations.ts`, 각 `.test.ts`

**Interfaces:** `GenerationRequestSchema`는 방식, 기간, 고정 번호, 개수, 프롬프트를 검증한다. `generateCombinations({analysis, fixedNumbers, count, seed, constraints})`는 중복 없는 조합과 적용 점수를 반환한다.

- [ ] 실패 테스트: 잘못된 고정 번호, 6개 고정 시 여러 개 요청, 결과 내 중복, 같은 시드의 재현, 조건 충돌.
- [ ] 테스트 실패 확인.
- [ ] Zod 입력 스키마와 결정적 후보 생성·통계 점수 계산 구현.
- [ ] 단위 테스트 통과.

### Task 2: Groq 조건 해석과 요청별 설명

**Files:** `src/features/generation/server/groq-recommendation.ts`, `.test.ts`

**Interfaces:** `getGroqRecommendation({prompt, fixedNumbers, analysisSummary})`는 검증된 조건과 1~2줄 설명을 반환한다.

- [ ] 실패 테스트: Groq 요청 1회, 서버 키만 사용, 잘못된 응답 거절, 429·타임아웃 처리.
- [ ] 테스트 실패 확인.
- [ ] `GROQ_API_KEY`로 서버에서 HTTP 호출하고 Zod로 응답 검증.
- [ ] 단위 테스트 통과.

### Task 3: 로그인 보호 생성 API

**Files:** `src/app/api/generation/route.ts`, `.test.ts`, `src/features/generation/server/run-generation.ts`

**Interfaces:** `POST /api/generation`은 인증·입력 검증 뒤 최신 공개 회차의 선택 기간 통계를 사용해 생성 결과, 기준 회차, 적용 조건, 공통 AI 설명을 반환한다.

- [ ] 실패 테스트: 비로그인 401, 잘못된 요청 400, 정상 요청, 제공처·AI 실패.
- [ ] 테스트 실패 확인.
- [ ] 기존 분석·캐시 함수를 재사용해 API 연결.
- [ ] 라우트 테스트 통과.

### Task 4: 생성 화면과 문서

**Files:** `src/app/generate/page.tsx`, `src/features/generation/components/*`, `src/features/generation/hooks/use-generate-combinations.ts`, 관련 테스트, `spec.md`, `architecture.md`, `.env.example`

**Interfaces:** 로그인 화면에서 방법·번호·기간·개수·프롬프트를 고르고 생성한다. 요청별 결과와 공통 설명을 표시한다.

- [ ] 실패 테스트: 기본 5개, 입력 오류, 로딩·재시도, 요청별 AI 설명 1개.
- [ ] 테스트 실패 확인.
- [ ] 화면·훅과 문서·환경변수 이름 연결.
- [ ] `ux-review` 검토 후 수정.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run format:check` 통과.
- [ ] PR 생성. GitHub Actions 상태는 조회하지 않는다.
