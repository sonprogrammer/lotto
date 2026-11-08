# 로또 분석 서비스

로또 6/45의 과거 통계를 살펴보고 번호 조합을 만들고 저장하기 위한 PWA 프로젝트입니다. 분석과 추천은 참고용이며 당첨을 예측하거나 보장하지 않습니다.

## 현재 구현

- 로그인 전에는 무작위 번호 6개 미리보기만 이용할 수 있습니다. 번호 공이 돌아간 뒤 한 개씩 순서대로 공개됩니다.
- 카카오 OAuth로 로그인하고, 로그인 상태는 MongoDB에 해시로 저장한 자체 세션으로 관리합니다.
- 세션은 로그인 후 30일에 만료되며 자동 연장하지 않습니다. 로그아웃하면 현재 기기의 세션을 폐기합니다.
- 로그인 후 통계 분석, 번호 조합, 조합 저장 등 제품 기능을 추가할 예정입니다.
- 카카오 및 MongoDB 자격 증명이 설정되지 않은 로컬 환경에서는 실제 로그인을 확인할 수 없습니다.

## 실행 환경

- Node.js 22.13 이상 (22.x, 24.x 또는 26 이상)
- npm 10 이상

`.nvmrc`에 지정된 Node.js 버전을 선택하고 의존성을 설치합니다.

```sh
npm install
cp .env.example .env.local
npm run dev
```

## 환경 변수와 로그인 설정

`.env.local`과 배포 환경의 서버 전용 변수에 다음 값을 설정합니다.

| 변수                  | 설명                                |
| --------------------- | ----------------------------------- |
| `MONGODB_URI`         | MongoDB 연결 문자열                 |
| `MONGODB_DB_NAME`     | 사용할 데이터베이스 이름            |
| `KAKAO_REST_API_KEY`  | Kakao Developers 앱의 REST API 키   |
| `KAKAO_CLIENT_SECRET` | Kakao Developers 앱의 Client Secret |
| `KAKAO_REDIRECT_URI`  | 카카오 앱에 등록한 콜백 주소        |

`KAKAO_REDIRECT_URI`는 로컬에서는 `http://localhost:3000/api/auth/kakao/callback`, 배포에서는 해당 서비스 도메인의 `/api/auth/kakao/callback` 주소를 사용합니다. Kakao Developers 콘솔의 Redirect URI와 환경 변수 값을 정확히 일치시켜야 합니다.

MongoDB 제공처와 운영 요금제는 아직 선택하지 않았습니다. 제공처에서 데이터베이스와 연결 문자열을 준비한 뒤 설정하세요. 모든 인증 정보와 MongoDB 연결 문자열은 서버 전용입니다. 비밀 값을 `NEXT_PUBLIC_` 변수로 만들거나 저장소에 올리지 마세요.

## 자주 쓰는 명령

```sh
npm run dev          # 로컬 개발 서버 실행
npm run build        # 배포용 빌드 만들기
npm run start        # 배포용 빌드 실행
npm run lint         # ESLint 검사
npm run typecheck    # TypeScript 검사
npm test             # 테스트 실행
npm run test:watch   # 파일 변경을 감시하며 테스트 실행
npm run format       # 코드 형식 정리
npm run format:check # 코드 형식 확인
```

## 커밋 전 검사와 GitHub CI

- Husky와 lint-staged가 커밋 대상 파일을 검사하고 포맷합니다.
- GitHub Actions는 Pull Request와 `main` 변경에서 포맷, 린트, 타입, 테스트, 빌드를 확인합니다.
- hook이 동작하지 않으면 `npm run prepare`를 실행하세요.

## 프로젝트 문서

- [기능 요구사항](./spec.md)
- [기술 구조와 미결정 항목](./architecture.md)
