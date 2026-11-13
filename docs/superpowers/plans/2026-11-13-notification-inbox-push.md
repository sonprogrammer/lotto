# 사이트 알림함과 PWA 푸시 구현 계획

> **For agentic workers:** 구현은 `superpowers:executing-plans`로 작업 단위마다 테스트를 먼저 작성해 진행하고 체크박스로 추적합니다.

**Goal:** 저장 조합의 1~5등 결과를 사용자별 알림함에 기록하고, 당시 구독된 기기에는 중복 없이 Web Push를 보냅니다.

**Architecture:** `entities/notification`은 사용자 알림, 구독, 기기별 전송 시도를 MongoDB에서 관리합니다. 회차 결과 동기화 뒤 최신 회차 알림을 멱등하게 조정하고, pending 전송을 at-most-once 시도로 처리합니다. `features/notification`은 사이트 알림함과 브라우저별 최초 안내·기기 구독 흐름을 제공하며, 서비스 워커가 푸시 표시와 클릭 이동을 담당합니다.

**Tech Stack:** Next.js App Router, TypeScript, MongoDB, Zod, TanStack Query, `web-push`/VAPID, Vitest, React Testing Library, Tailwind CSS.

**Spec:** `spec.md` §4.7, `architecture.md` §7–8, `docs/superpowers/specs/2026-11-13-pwa-notifications-design.md`, GitHub issue #11.

## Global Constraints

- 로그인하지 않은 사용자는 알림함과 구독 API를 사용할 수 없습니다.
- 알림 조회·변경·구독 삭제는 세션에서 확인한 `userId`로 범위를 제한합니다.
- 푸시 권한 요청은 사용자의 `알림 켜기` 클릭에서만 시작합니다.
- 로그아웃은 현재 브라우저 endpoint 구독만 삭제하고, 다른 기기 구독은 유지합니다.
- 알림함 고유 키는 `{ userId, savedCombinationId, roundNumber }`입니다.
- 기기별 전송 고유 키는 `{ notificationId, subscriptionId }`입니다. 상태 `attempted`, `sent`, `failed`는 재전송하지 않습니다.
- 알림 생성 당시 활성 구독만 푸시 대상이며, 뒤늦게 구독한 기기에는 과거 푸시를 보내지 않습니다.
- VAPID 비밀 키와 subject는 서버 환경 변수에만 두고, 공개 키는 공개 설정 API로 전달합니다.
- API와 기능 흐름은 커스텀 훅으로 분리하고 컴포넌트는 파일당 하나, UI는 Tailwind와 기존 공통 UI를 우선합니다.

## Review Focus

- 두 동기화 요청이 동시에 같은 당첨을 처리 → 고유 인덱스·upsert와 중복 푸시 방지 테스트.
- 푸시 선점 직후 프로세스 종료 또는 provider 응답 유실 → 재전송 없는 상태 전이와 알림함 보존 테스트.
- endpoint를 조작한 다른 사용자의 요청 → `userId` 포함 삭제·조회 테스트.
- 로그아웃 body의 endpoint와 인증 사용자 불일치 → 타 계정·타 기기 구독이 보존되는 API 테스트.
- 권한 거부·미지원 브라우저·빈 목록·오류 → 화면의 각각 다른 상태 안내 테스트.

## 파일 구조

- `src/entities/notification/model/document.ts`: 알림·구독·전송 문서 Zod 스키마 및 타입.
- `src/entities/notification/model/notification.ts`: 클라이언트 응답 스키마.
- `src/entities/notification/server/notification-store.ts`: 알림 페이지, unread count, 읽음 처리, 고유 인덱스.
- `src/entities/notification/server/push-subscription-store.ts`: endpoint upsert, 현재 사용자·endpoint 구독 삭제, 고유 인덱스.
- `src/entities/notification/server/push-delivery-store.ts`: pending 기기 발송 기록 생성·선점·상태 갱신.
- `src/entities/notification/server/reconcile-draw-notifications.ts`: 최신 회차 알림 생성과 기존 알림의 정정 상태 갱신.
- `src/entities/notification/server/send-pending-push-deliveries.ts`: VAPID 설정과 at-most-once Web Push 전송.
- `src/entities/notification/server/vapid-config.ts`: 서버 전용 VAPID 환경 변수 검증.
- `src/entities/notification/index.ts`: 알림 엔티티 공개 API.
- `src/features/notification/api/notification-api.ts`: 알림·구독·공개 키 HTTP 요청.
- `src/features/notification/hooks/use-notifications.ts`: 사용자별 알림·읽지 않은 개수 Query.
- `src/features/notification/hooks/use-manage-notification.ts`: 읽음 처리와 캐시 무효화.
- `src/features/notification/hooks/use-push-subscription.ts`: 서비스 워커 등록, 사용자 클릭 기반 구독·해지.
- `src/features/notification/hooks/use-first-push-prompt.ts`: 브라우저별 최초 안내 상태.
- `src/features/notification/components/notification-inbox.tsx`: 목록·읽음·빈·오류·로딩 UI.
- `src/features/notification/components/push-permission-prompt.tsx`: 첫 안내 및 알림함 구독 조작 UI.
- `src/features/notification/components/notification-bell.tsx`: 헤더 알림 진입과 읽지 않은 개수.
- `src/features/notification/components/notification-settings.tsx`: 현재 브라우저 구독 상태와 해지.
- `src/features/notification/components/notification-dashboard.tsx`: 알림함 화면 구성.
- `src/features/notification/hooks/use-scroll-to-saved-combination.ts`: 알림에서 연 저장 조합 카드로 목록 패널을 이동.
- `src/app/notifications/page.tsx`: 로그인 확인 및 알림함 라우트.
- `src/app/api/notifications/route.ts`: 인증된 알림 페이지 응답.
- `src/app/api/notifications/unread-count/route.ts`: 읽지 않은 알림 수 응답.
- `src/app/api/notifications/[id]/read/route.ts`: 사용자 소유 알림 읽음 처리.
- `src/app/api/push-subscriptions/route.ts`: 현재 기기 구독 등록·해지.
- `src/app/api/push/public-key/route.ts`: VAPID 공개 키 전달.
- `src/app/api/auth/logout/route.ts`, `src/features/auth/hooks/use-auth-control.ts`: 현재 endpoint 구독 삭제 후 로그아웃.
- `src/entities/saved-combination/server/sync-and-reconcile-draw-results.ts`: 결과 조정 다음 알림 조정·pending 푸시 처리.
- `src/entities/saved-combination/server/store.ts`, `src/app/saved/page.tsx`, `src/features/saved-combination/components/saved-combinations-dashboard.tsx`, `src/features/saved-combination/components/saved-combinations-panel.tsx`: `combinationId` 링크로 대상 저장 조합 페이지를 표시.
- `src/app/manifest.ts`, `public/sw.js`: PWA 설치 메타데이터, 푸시 표시 및 클릭 이동.
- `.env.example`: VAPID 환경 변수 이름과 예시 자리표시자만 기록.
- `package.json`, `package-lock.json`: `web-push`, 필요한 타입 패키지, 아키텍처에서 정한 `lucide-react` 의존성 추가.
- `architecture.md`, `spec.md`: 승인된 동작과 실제 자료 구조를 반영.

## 작업

### Task 1: 알림·구독·전송 데이터 모델과 저장소

**Interfaces:**

- `listNotifications(userId, page, pageSize): Promise<NotificationPage>`
- `countUnreadNotifications(userId): Promise<number>`
- `markNotificationRead(userId, id): Promise<NotificationDocument | null>`
- `upsertPushSubscription(userId, subscription): Promise<void>`
- `deletePushSubscription(userId, endpoint): Promise<boolean>`
- `getSavedCombinationPage(userId, combinationId, pageSize): Promise<number | null>`

- [x] 해당 문서 필드와 Zod 검증(알림 status, nullable rank, 구독 endpoint/keys, delivery status) 테스트를 먼저 작성합니다.
- [x] 사용자 범위, 기본 최신순, 읽음 처리, 고유 인덱스, endpoint 계정 이전·현재 사용자 endpoint 삭제 테스트를 작성합니다.
- [x] 모델과 저장소를 구현하고 모든 MongoDB 필터에 인증된 `userId`를 포함합니다.
- [x] `getSavedCombinationPage`는 `{ createdAt desc, _id desc }` 정렬에서 대상 조합 앞의 문서 수를 계산해 페이지를 반환하고, 다른 사용자의 ID에는 `null`을 반환합니다.
- [x] 대상 단위 테스트를 실행해 통과시킵니다.

### Task 2: 결과 회차 알림 생성과 정정 조정

**Interface:**

- `reconcileDrawNotifications({ latestRound }): Promise<{ createdCount: number; updatedCount: number }>`
- 최신 회차만 새 알림을 만들고, 이미 존재하는 회차 알림은 현재 저장 조합의 `drawResults`에 맞춰 갱신합니다.
- 당첨 취소는 `status: "corrected"`, `rank: null`, `amountPerWinner: 0`으로 남깁니다. 과거 회차 알림을 새로 backfill하지 않습니다.

- [x] 최신 회차의 각 등수 조합에 알림 하나씩 생성, 무승부 미생성, 동기화 재실행 무중복 테스트를 먼저 작성합니다.
- [x] 이미 있는 알림의 등수·상금 정정, 당첨 취소, 다른 사용자·다른 조합 격리를 테스트합니다.
- [x] 알림 생성 시점의 구독만 대상으로 pending delivery를 upsert하는 저장 흐름을 구현합니다. 부분 실패 재실행은 같은 시점의 구독 누락분을 복구하고, 뒤늦게 등록한 구독에는 과거 푸시를 만들지 않습니다.
- [x] 대상 테스트를 실행해 통과시킵니다.

### Task 3: 멱등 Web Push 전송과 동기화 연결

**Interfaces:**

- `sendPendingPushDeliveries(): Promise<{ sentCount: number; failedCount: number }>`
- `reconcileDrawNotifications({ latestRound })` 뒤 pending 배송을 처리하며 기존 `syncAndReconcileSavedCombinationDrawResults`의 반환 형태를 유지합니다.

- [x] pending 선점, 성공, 실패, 재실행 시 재전송하지 않는 상태 전이 테스트를 작성합니다.
- [x] 404/410 구독 삭제, 실패 코드의 안전한 저장, 다른 구독·사용자 보존 테스트를 작성합니다.
- [x] VAPID 설정 검증과 `web-push` provider 호출을 구현하고 실환경 발송 없이 mock으로 검증합니다.
- [x] 결과 동기화 runner, Cron, 분석·생성·저장 요청에서 기존 캐시 무효화 조건을 유지하며 알림 처리를 연결합니다.
- [x] 대상 서버 테스트를 실행해 통과시킵니다.

### Task 4: 알림·구독 API와 로그아웃 해지

- [x] 알림 목록/읽지 않은 개수/읽음 처리의 인증·입력·소유권 테스트를 작성합니다.
- [x] 구독 등록·해지와 공개 VAPID 키 API의 인증·실패·응답 형식 테스트를 작성합니다.
- [x] 로그아웃 요청에서 endpoint를 검증하고 현재 사용자 구독만 삭제한 뒤 세션을 종료하는 테스트를 작성합니다. 구독 삭제 실패 시 세션은 유지합니다.
- [x] API 라우트와 비밀값이 제거된 `.env.example` 항목을 구현합니다.
- [x] API·세션 저장소 관련 테스트를 실행해 통과시킵니다.

### Task 5: 브라우저별 알림 권한과 PWA 서비스 워커

- [x] 푸시 미지원, permission 상태별 분기, 사용자 클릭 안에서만 권한 요청, 구독 성공·실패 테스트를 작성합니다.
- [x] 로그인된 브라우저에서만 최초 안내를 한 번 표시하고 `나중에`를 기억하는 hook을 구현합니다. 저장 키는 기능 전용 이름으로 둡니다.
- [x] 사용자의 클릭에서 service worker 등록, VAPID 공개 키 조회, `PushManager.subscribe`, 서버 저장을 연결합니다.
- [x] 현재 device 해지 시 서버 삭제 후 브라우저 구독을 해지합니다.
- [x] `src/app/manifest.ts`와 `public/sw.js`를 구현합니다. 서비스 워커는 일반 문구로 알림을 표시하고 클릭 시 `/notifications`를 엽니다.
- [x] 대상 브라우저 hook 테스트와 타입 검사를 실행합니다.

### Task 6: 알림함, 헤더 배지, 구독 관리 UI

- [x] 알림 목록의 로딩·오류·빈·읽지 않음·정정 상태와 항목 열람/읽음 처리를 검증하는 컴포넌트 테스트를 작성합니다.
- [x] `notification-inbox`, `notification-bell`, `notification-settings`, `push-permission-prompt`를 각각 단일 컴포넌트 파일로 구현합니다.
- [x] 상단 메뉴에 알림함 진입점과 읽지 않은 개수를 표시하고 알림 링크를 `/saved?combinationId=<id>`로 만듭니다.
- [x] 저장 페이지는 해당 조합이 속한 목록 페이지를 열고 대상 카드를 스크롤·강조합니다. 존재하지 않거나 다른 사용자 소유인 ID는 기본 페이지를 보여줍니다.
- [x] `/notifications`에 목록과 현재 브라우저 푸시 설정을 구성합니다. 모바일 세로 화면과 긴 목록 스크롤을 고려합니다.
- [x] 앱 화면 테스트를 실행하고 `ux-review`에서 키보드·모바일·권한 거부·에러 흐름을 검토합니다.

### Task 7: 최종 검증과 PR 준비

- [x] `.env.example`에는 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` 이름만 두고 실제 비밀값이 들어가지 않았는지 확인합니다.
- [x] `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`를 순차 실행해 통과합니다.
- [x] 모바일 브라우저·설치 PWA에서 실제 구독/표시/클릭 흐름을 확인할 수 없으면 그 한계를 PR 본문에 적고, 손 대표님이 설정할 Vercel 변수와 수동 확인 단계를 안내합니다.
- [x] 사용자 데이터 필터, 중복 방지 인덱스, 푸시 at-most-once 정책을 최종 점검합니다.
