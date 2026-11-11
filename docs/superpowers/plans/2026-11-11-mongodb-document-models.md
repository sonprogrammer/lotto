# MongoDB 문서 모델 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이슈 #20에 따라 인증과 MVP 기능에서 사용하는 MongoDB 문서 모델·검증 스키마를 추가하고 기존 DB 코드와 연결합니다.

**Architecture:** FSD `entities`에 사용자, 추첨 회차, 저장 조합, 저장 프롬프트 모델을 둡니다. 인증 세션은 인증 기능 내부에 둡니다. MongoDB BSON 문서 타입과 Zod 입력 검증을 함께 정의하고, 기존 저장소는 공용 문서 타입을 사용합니다.

**Tech Stack:** TypeScript, MongoDB Node.js Driver, Zod, Vitest

**Spec:** `spec.md`의 4.2, 4.3, 4.4, 4.5와 `architecture.md`의 5–9절 및 이슈 #20

## Global Constraints

- 비밀 키와 외부 서비스 자격 증명은 서버에만 둡니다.
- 사용자 소유 자료는 검증된 로그인 세션의 사용자 ID로 범위를 제한합니다.
- 문서에 정하지 않은 필드와 정책은 임의로 확정하지 않습니다.
- 새 의존성을 추가하지 않습니다.
- 파일마다 한 가지 책임을 갖게 하고 FSD 폴더 구조를 유지합니다.

## Review Focus

- MongoDB에서 읽은 잘못된 배열·숫자·날짜가 도메인 모델로 들어오지 않도록 검증합니다.
- 당첨 번호 6개는 1–45 범위의 서로 다른 정수여야 합니다.
- 사용자 소유 문서가 다른 사용자 ID로 조회되지 않게 합니다.
- 사용자별 프롬프트 최대 5개 제한은 문서 단위 Zod 검사만으로 보장된다고 오해하지 않게 책임을 구분합니다.
- 현재 사용 중인 `userId` 표현(ObjectId hex 문자열)과 새 문서 모델이 일치해야 합니다.

---

## 승인된 모델 결정

대표님이 추천안을 승인했습니다.

1. 저장한 번호는 조합마다 문서 하나를 둡니다. 여러 조합을 한 번에 저장할 때는 bulk insert를 사용하고, 회차·등수 결과를 조합별로 독립 처리합니다.
2. 각 조합 문서는 저장 시점의 다음 회차 번호, 6개 번호, 생성 방식, 간단한 분석 요약, 저장 시각을 가집니다. 프롬프트 참조와 상세 통계 원본은 MVP 문서에 넣지 않습니다.
3. 등수·당첨금은 추첨 문서의 보너스 번호와 등수별 결과를 기준으로 계산합니다. 조합 문서에는 결과를 복제하지 않고 연결된 회차를 통해 표시합니다. 결과 정정 정책은 별도 결정으로 남깁니다.
4. 사용자 ID는 현재 세션 모델과 호환되도록 24자리 ObjectId hex 문자열로 통일합니다. MongoDB `_id`만 ObjectId로 둡니다.
5. 당첨 번호 문서는 `roundNumber`, 6개 `numbers`, `bonusNumber`, 등수별 `prizesByRank`를 가집니다. 각 상금 항목은 등수, 당첨자 수, 1인당 당첨금으로 구성합니다. 추첨일과 제공처 메타데이터는 제공처 결정 뒤 추가합니다.
6. 프롬프트는 별도 문서로 두고 사용자 ID, 본문, 정렬 순서, 생성·수정 시각을 저장합니다. 화면에서 본문 일부를 목록 라벨로 사용합니다. 5개 제한은 개별 문서 스키마가 아닌 저장 서비스의 동시성 안전한 규칙으로 다룹니다.
7. `prizesByRank`는 현재 제공된 등수만 저장할 수 있게 합니다. 각 등수는 1–5 범위에서 중복되면 안 되며, 제공처가 정해지면 모든 등수 제공 여부를 확인합니다.

## Task 1: 인증 문서 모델

**Files:**

- Create: `src/entities/user/model/document.ts`
- Create: `src/entities/user/model/document.test.ts`
- Create: `src/entities/user/index.ts`
- Create: `src/features/auth/server/session-document.ts`
- Create: `src/features/auth/server/session-document.test.ts`
- Modify: `src/features/auth/server/user-store.ts`
- Modify: `src/features/auth/server/session-store.ts`

**Interfaces:**

- Produces `KakaoUserDocument` with `_id`, `kakaoId`, optional legacy `nickname`, `createdAt`.
- Produces `AppSessionDocument` with `userId`, `tokenHash`, `createdAt`, `expiresAt`.

- [x] `document.test.ts`에서 새 사용자 문서는 통과하고, 닉네임 없는 기존 사용자 문서는 통과하며, 빈 `kakaoId`·빈 닉네임·잘못된 `_id`·문자열 날짜는 거부하는 RED 테스트를 작성합니다.
- [x] `session-document.test.ts`에서 정상 세션 문서는 통과하고, 잘못된 `userId`·빈 `tokenHash`·만료 시각이 생성 시각보다 이르거나 같은 문서는 거부하는 RED 테스트를 작성합니다.
- [x] 예상된 검증 실패를 확인한 뒤 스키마를 구현하고 인증 저장소 테스트를 통과시킵니다.
- [x] Zod 스키마와 `z.infer` 문서 타입을 추가하고 user/session 저장소에서 문서 타입을 재사용합니다.
- [x] 관련 테스트를 통과시킵니다.

## Task 2: 회차·저장 자료 모델

**Files:**

- Create: `src/entities/lottery-draw/model/document.ts`
- Create: `src/entities/lottery-draw/model/document.test.ts`
- Create: `src/entities/saved-combination/model/document.ts`
- Create: `src/entities/saved-combination/model/document.test.ts`
- Create: `src/entities/saved-combination/index.ts`
- Create: `src/entities/saved-prompt/model/document.ts`
- Create: `src/entities/saved-prompt/model/document.test.ts`
- Create: `src/entities/saved-prompt/index.ts`
- Modify: `src/entities/lottery-draw/server/list-lottery-draws.ts`

**Interfaces:**

- `LotteryDrawDocument` is the MongoDB representation; current analysis projection remains `LotteryDraw`.
- `SavedCombinationDocument` represents one saved combination, its target round, generation method, and brief analysis summary. Result data is derived from its referenced draw.
- `SavedPromptDocument` represents one user-owned prompt; its text excerpt is the display label and the maximum count is a collection-level operation rule.

- [x] 회차 테스트에서 양의 정수 회차와 1–45 범위의 서로 다른 정수 6개는 통과하고, 잘못된 회차·개수·중복·범위 밖 숫자는 거부하는 RED 테스트를 작성합니다.
- [x] 저장 조합 테스트에서 사용자 ID, 회차, 6개 번호와 생성 정보가 모두 유효할 때 통과하고, 번호·사용자 ID·회차가 유효하지 않으면 거부하는 RED 테스트를 작성합니다.
- [x] 프롬프트 테스트에서 사용자 ID, 본문, 정렬 순서, 생성·수정 시각의 유효 문서는 통과하고 빈 본문과 잘못된 날짜는 거부하는 RED 테스트를 작성합니다.
- [x] 예상된 검증 실패를 확인한 뒤 각 문서 Zod 스키마와 추론 타입을 추가합니다.
- [x] 회차 조회 함수에서 분석 projection의 문서 스키마를 재사용하고 잘못된 저장 자료를 거부합니다.
- [x] 관련 테스트를 통과시킵니다.

## Task 3: 인덱스 기준 및 문서 동기화

**Files:**

- Modify: `architecture.md`
- Modify: `docs/superpowers/plans/2026-11-11-mongodb-document-models.md`

- [x] 기존 사용자·세션 인덱스와 새 컬렉션에 필요한 고유/복합 인덱스 후보를 문서에 구분해 기록합니다.
- [x] 미구현 저장소의 인덱스 후보는 실제 인덱스 적용으로 표현하지 않습니다.
- [x] UX 없는 데이터 모델 변경에 대해 `ux-review`를 생략합니다.
- [x] 타입 검사, 린트, 전체 테스트, 포맷 검사, 빌드를 통과시킵니다.
- [x] 커밋하고 PR #21을 엽니다. PR #19가 열려 있어 해당 브랜치를 base로 사용하는 stacked PR로 만들었습니다.
