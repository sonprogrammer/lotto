# 저장 조합 당첨 결과 계산 구현 계획

> **For agentic workers:** 구현은 `superpowers:executing-plans`를 사용해 작업 단위로 진행하고 체크박스로 추적합니다.

**Goal:** 저장 조합을 적용 회차 범위에 따라 공개 당첨 결과와 대조하고, 회차별 등수·당첨금 이력을 중복 없이 유지합니다.

**Architecture:** 당첨 판정은 순수 함수로 계산하고, 저장소 서비스가 전체 회차와 저장 조합을 대조해 결과 배열을 멱등하게 갱신합니다. Cron과 분석·생성·저장 흐름에서 같은 조정 서비스를 호출해 새 회차와 정정 이력을 반영합니다.

**Tech Stack:** Next.js 16, TypeScript, MongoDB, Zod, Vitest, React Testing Library.

**Spec:** `spec.md` §4.5, `architecture.md` §7, GitHub issue #10.

## Global Constraints

- 같은 저장 조합과 공개 회차 입력에는 항상 같은 당첨 결과를 계산합니다.
- 조합의 `numberVersions` 적용 기간을 지키며 수정 전후 번호를 다른 회차에 적용합니다.
- 저장 조합과 결과 조회·수정 범위는 MongoDB 문서의 `userId`로 보호합니다.
- 재실행과 외부 결과 정정은 기존 회차 결과를 중복 생성하지 않고 올바르게 갱신합니다.
- 알림 생성과 전송은 이슈 #11에서 구현합니다.
- 한 파일에는 하나의 컴포넌트 또는 훅만 두고 FSD 레이어 및 Tailwind 우선 원칙을 따릅니다.

## Review Focus

- 보너스 번호로 2등·3등이 갈리는 경계 → 순수 계산기 테스트.
- `trackingStartRound` 이전·이후와 `numberVersions` 경계 회차 → 번호 선택 테스트.
- 재실행 및 일부 문서 저장 실패 후 재시도 → 회차 고유성·누락 복구 테스트.
- 과거 당첨 번호와 상금 정정 → 기존 동일 회차 결과 갱신 테스트.
- 동시 조합 수정 중 오래된 계산 결과가 최신 사용자 수정값을 덮어쓰는 상황 → 조건부 업데이트 테스트.

---

## 파일 구조

- `src/entities/saved-combination/lib/calculate-draw-result.ts`: 한 조합과 한 회차의 일치 수, 보너스 일치, 등수, 당첨금을 결정적으로 계산.
- `src/entities/saved-combination/lib/calculate-draw-result.test.ts`: 등수 경계와 회차 번호 스냅샷 계산 테스트.
- `src/entities/saved-combination/server/reconcile-draw-results.ts`: 공개 회차와 저장 조합 전체를 대조하고 결과 배열을 멱등하게 저장.
- `src/entities/saved-combination/server/reconcile-draw-results.test.ts`: 신규 회차, 재실행, 수정, 정정, 사용자별 문서 보존 테스트.
- `src/entities/saved-combination/server/sync-and-reconcile-draw-results.ts`: 기존 동기화 runner 실행 후 결과 대조를 조정하는 서버 유스케이스.
- `src/entities/saved-combination/server/sync-and-reconcile-draw-results.test.ts`: runner 옵션과 재조정 연계 테스트.
- `src/entities/saved-combination/index.ts`: 새 서버 유스케이스 공개.
- `src/app/api/cron/lottery-sync/route.ts`: Cron 동기화 뒤 결과 조정 실행.
- `src/app/api/analysis/run/route.ts`: 분석 동기화 뒤 결과 조정 실행.
- `src/features/generation/server/run-generation.ts`: 생성 동기화 뒤 결과 조정 실행.
- `src/entities/saved-combination/server/store.ts`: 저장·수정 전 동기화 뒤 기존 회차 결과를 반영.
- `src/features/saved-combination/components/saved-combination-card.tsx`: 최신 회차 결과를 카드에서 바로 확인하고 상세 이력은 기존 접기 영역에서 유지.
- `src/features/saved-combination/components/saved-combination-card.test.tsx`: 당첨·미당첨·결과 없음 상태 확인.
- `src/features/saved-combination/components/saved-combinations-dashboard.test.tsx` 또는 기존 패널 테스트: 목록 데이터가 결과를 표시하는지 확인.
- `architecture.md`: 저장 결과 갱신 흐름이 실제 구현과 다른 경우에만 보완.

## 작업

### Task 1: 회차별 판정 함수

**Interface:**

- `calculateSavedCombinationDrawResult(input): SavedCombinationDrawResult`
- 입력은 적용된 저장 번호, 회차 번호·날짜, 당첨 번호, 보너스 번호, 등수별 당첨금 자료.
- 결과는 기존 문서 스키마의 `roundNumber`, `drawDate`, `numbersSnapshot`, `matchedNumberCount`, `bonusMatched`, `rank`, `amountPerWinner`를 반환.
- 당첨 판정: 6개 일치 1등, 5개와 보너스 일치 2등, 5개 일치 3등, 4개 일치 4등, 3개 일치 5등, 그 외 등수 `null` 및 당첨금 `0`.

- [x] 각 당첨 등수와 미당첨, 보너스 번호 경계를 검증하는 실패 테스트를 작성하고 실행합니다.
- [x] 회차별 당첨금 자료에서 해당 등수의 `amountPerWinner`를 가져오는 계산 함수를 구현합니다.
- [x] 번호 버전 목록과 `trackingStartRound`를 받아 회차에 적용할 번호를 고르는 순수 함수를 테스트와 함께 구현합니다.
- [x] 대상 테스트를 다시 실행해 모두 통과시킵니다.

### Task 2: 멱등 결과 재조정 저장소

**Interface:**

- `reconcileSavedCombinationDrawResults({ historyChanged }: { historyChanged: boolean }): Promise<{ updatedCount: number }>`
- 변경된 회차 이력이 있으면 해당 조합의 모든 적용 회차를 다시 계산해 과거 정정도 반영합니다.
- 회차 이력이 바뀌지 않았으면 아직 결과가 없는 적용 회차를 채워 이전 처리 실패를 복구합니다.

- [x] 신규 결과 저장, 동일 입력 재실행, 부분 실패 뒤 누락 결과 복구를 검증하는 저장소 테스트를 작성합니다.
- [x] 동시 조합 수정 중 변경 전 계산이 최신 번호 설정을 덮어쓰지 않도록 조건부 MongoDB 업데이트를 테스트합니다.
- [x] 번호 버전별 적용 범위에 맞는 `numbersSnapshot`을 생성하고 회차당 결과가 하나만 존재하는지 테스트합니다.
- [x] 당첨 번호 또는 등수별 당첨금이 정정되면 같은 회차 결과를 갱신하고 다른 회차 결과를 유지하는 테스트를 작성합니다.
- [x] 저장소 서비스를 구현하고 내용이 달라진 문서만 `userId`와 스냅샷 조건을 함께 사용해 갱신합니다.
- [x] 대상 저장소 테스트를 다시 실행해 모두 통과시킵니다.

### Task 3: 동기화 흐름 연결

**Interface:**

- `syncAndReconcileSavedCombinationDrawResults({ maxAttempts }: { maxAttempts: number }): Promise<LotteryDrawSyncResult>`
- 내부에서 기존 `runLotteryDrawSync`를 호출하고 결과 이력을 재조정한 뒤 동기화 결과를 반환합니다.
- Cron은 `maxAttempts: 3`, 분석·생성·저장 요청은 `maxAttempts: 1`을 전달합니다.

- [x] 동기화 성공 후 재조정이 실행되고 동기화 실패 시 재조정을 건너뛰는 테스트를 작성합니다.
- [x] Cron, 분석, 생성, 저장·수정 흐름에서 기존 직접 동기화 호출을 새 유스케이스로 바꿉니다.
- [x] 결과 이력 재조정이 끝나도 기존 분석·회차 캐시 무효화 조건이 유지되는지 확인합니다.
- [x] 해당 API와 서버 유스케이스 테스트를 실행해 모두 통과시킵니다.

### Task 4: 저장 조합의 최신 결과 표시

- [x] 결과가 있는 조합의 최신 회차·당첨/미당첨·등수·당첨금을 기본 카드에서 확인하는 테스트를 작성합니다.
- [x] 결과가 아직 없는 경우 기존의 다음 추첨 안내를 유지하는 테스트를 작성합니다.
- [x] 카드에 최신 결과 요약을 표시하고 모든 회차 이력은 기존 펼침 영역에서 조회되게 구현합니다.
- [x] 카드와 저장 조합 목록 테스트를 실행해 모두 통과시킵니다.

### Task 5: 기능 검증과 문서

- [x] 전체 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`를 실행합니다.
- [x] UI 흐름의 로딩·빈·오류·당첨 상태를 `ux-review`로 검토하고 필요한 수정 후 검증을 다시 실행합니다.
- [x] 구현과 달라진 경우에만 `architecture.md`의 결과 처리 흐름을 갱신합니다.
- [x] PR 전 전체 테스트 결과와 사용자별 범위 보호를 다시 확인합니다.
