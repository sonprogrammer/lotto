# 분석 기간 선택과 공통 분석 캐시 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 분석 기간을 전체 또는 최근 N회로 선택하고, 같은 공개 회차 자료의 분석 결과와 회차 목록을 캐시해 반복 조회 비용을 줄입니다.

**Architecture:** MongoDB는 공개 회차 원본의 저장소로 유지합니다. 분석 요청은 로그인 여부를 확인한 뒤 최신 회차만 확인하고, 새 회차가 있을 때만 전체 자료를 동기화합니다. 통계 결과는 최신 회차, 최신 회차 자료의 지문, 선택 기간을 키로 한 Next.js 기본 서버 캐시에 두며, 회차 목록도 자료 버전별 Next.js 서버 캐시로 제공합니다. TanStack Query는 브라우저의 회차 목록을 재사용합니다.

**Tech Stack:** Next.js 16 Cache Components, MongoDB, TanStack Query, Zod, TypeScript, Vitest.

**Spec:** GitHub issue #24, #28; `architecture.md`의 6절 캐시 원칙.

## Global Constraints

- 공통 공개 데이터는 Next.js 서버 캐시를 사용하고, 이 작업에서는 추가 유료 캐시 저장소를 사용하지 않습니다.
- 통계는 선택한 회차 자료만으로 계산하며 같은 입력에서 같은 결과를 냅니다.
- 최근 N회는 가장 최근 완료된 회차를 포함합니다. 기본 선택은 최근 30회이며 직접 입력 범위는 1회부터 보유 회차 수까지입니다.
- 인증 확인은 캐시된 공통 분석 함수 바깥에서 수행합니다.
- 로그인하지 않은 사용자는 분석 API를 이용할 수 없습니다.
- 오류·로딩·빈 상태는 분리하고 임의 결과를 보여주지 않습니다.
- 분석은 당첨 확률 상승이나 예측을 보장한다고 표현하지 않습니다.

## Review Focus

- 최근 N이 1, 15, 30, 보유 회차 수와 같을 때 시작·기준 회차와 통계가 정확한지 검사합니다.
- 최근 N이 0, 소수, 숫자가 아닌 값, 보유 회차 수보다 큰 값이면 이해 가능한 오류를 주는지 검사합니다.
- 선택 기간에 나오지 않은 번호를 전체 역사에 한 번도 나온 적 없다는 의미로 표시하지 않는지 검사합니다.
- 같은 최신 회차·기간은 캐시를 재사용하고, 새 회차가 동기화되면 다른 캐시 키와 최신 회차 목록을 사용하는지 검사합니다.
- 요청 중 기간 변경이나 실패 뒤 재시도에서도 선택한 값을 유지하고 결과 범위를 정확히 표시하는지 검사합니다.

---

### Task 1: 기간 입력과 분석 계산 계약

**Files:**

- Create: `src/features/analysis/model/analysis-period.ts`
- Create: `src/features/analysis/lib/select-analysis-draws.ts`
- Test: 각 파일의 테스트 파일
- Modify: `src/features/analysis/index.ts`

**Interfaces:**

- `AnalysisPeriod = { type: "all" } | { type: "recent"; count: number }`
- 기간 선택 함수는 회차 목록과 기간을 받고, 선택된 회차 목록과 실제 범위 메타데이터를 반환합니다.
- 요청 검증은 Zod로 하며 양의 정수만 허용하고, 전체 보유 회차 수 상한은 요청 처리 시 확인합니다.

- [x] 선택 범위와 입력값 검증을 설명하는 실패 테스트를 먼저 작성하고 테스트가 실패하는지 확인합니다.
- [x] 전체·최근 N회 선택과 시작/기준 회차 메타데이터를 구현합니다.
- [x] 작은 목록, 빈 목록, 잘못된 입력 경계를 테스트합니다.

### Task 2: 기간별 서버 분석 API와 캐시

**Files:**

- Modify: `src/entities/lottery-draw/server/sync-lottery-draws.ts`
- Modify: `src/entities/lottery-draw/server/list-lottery-draws.ts`
- Create: 공통 분석을 제공하는 서버 캐시 함수
- Modify: `src/app/api/analysis/run/route.ts`
- Modify: `src/app/api/lottery-draws/route.ts` 및 관련 테스트

**Interfaces:**

- 분석 요청 본문: `{ period: AnalysisPeriod }`
- 성공 응답: `{ analysis, period: { type, count, drawCount, firstRound, latestRound }, availableDrawCount }`
- 캐시 키 입력: 검증한 최신 회차 번호, 최신 회차 자료 지문, 기간 유형·횟수

- [x] 요청 기간 검증, 기간별 계산, 최신 회차 조회만으로 기존 자료를 재사용하는 실패 테스트를 작성합니다.
- [x] 같은 최신 회차에 대한 요청은 최신 회차 조회 후 분석 캐시를 사용하고, 최신 회차가 바뀐 경우에만 전체 자료를 동기화합니다.
- [x] Next.js 기본 인스턴스별 캐시를 사용하며 캐시된 함수에는 `cacheLife`와 태그를 둡니다. 인증 정보는 캐시 함수에 전달하지 않습니다.
- [x] 회차 목록 페이지는 페이지 범위를 키로 Next.js 서버 캐시에 두고, 새 회차 반영 시 관련 태그를 재검증합니다.
- [x] 실패·미완료 자료·기존 기록보다 오래된 제공처 응답 테스트를 유지합니다.

### Task 3: 기간 선택 UI와 브라우저 회차 목록 캐시

**Files:**

- Create: `src/features/analysis/components/analysis-period-selector.tsx`
- Modify: `src/features/analysis/components/analysis-dashboard.tsx`
- Modify: `src/features/analysis/hooks/use-run-weekly-analysis.ts`
- Modify: `src/features/analysis/hooks/use-lottery-draw-history.ts`
- Modify: 분석·회차 목록 관련 컴포넌트 테스트와 필요한 CSS

- [x] 드롭다운에 전체, 최근 10·15·20·30회, 직접 입력을 제공하는 실패 테스트를 작성합니다.
- [x] 첫 분석의 기본 기간을 최근 30회로 둡니다. 직접 입력은 양의 정수로 제한하고 보유 회차보다 큰 입력은 서버 검증 오류로 안내합니다.
- [x] 분석 버튼은 현재 선택 기간을 API에 보내고, 결과에는 실제 시작·기준 회차 및 분석한 회차 수를 표시합니다.
- [x] 선택 기간에 출현이 없으면 `기록 없음` 대신 선택 기간 내 미출현임을 명확히 표시합니다.
- [x] 분석 실행 중 기존 스켈레톤과 중복 요청 방지를 유지하고 오류 후 재시도 때 선택한 기간을 보존합니다.
- [x] 회차 목록 TanStack Query에 명시적인 유효 시간을 두고, 분석 동기화 성공 시 목록 캐시를 무효화합니다.

### Task 4: UX 검토와 전체 검증

- [x] UX-review 스킬로 기간 선택, 입력 오류, 결과 범위, 로딩·오류 상태와 모바일·키보드 흐름을 검토합니다.
- [x] 검토 후 `npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`를 실행합니다.
- [x] 관련 이슈 #24와 #28을 PR에서 연결하고, 사용자가 검토할 수 있도록 동작 범위와 검증 결과를 설명합니다.
