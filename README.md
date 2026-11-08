# 로또 분석 서비스

로또 6/45의 과거 통계를 살펴보고 번호를 만들고 저장하는 PWA 프로젝트입니다. 추천은 참고용이며 당첨을 예측하거나 보장하지 않습니다.

## 현재 진행 상황

- 로그인 전 무작위 번호 6개 미리보기와 공 번호 애니메이션이 구현돼 있습니다.
- 카카오 로그인은 현재 Supabase Auth 코드로 구현돼 있습니다.
- 손 대표님은 MongoDB를 사용하고, 카카오 토큰 확인 후 우리 서비스가 자체 세션을 만드는 방식으로 정했습니다.
- 현재 실행 코드는 아직 Supabase Auth를 사용합니다. 새 로그인 구조는 설계 문서만 갱신됐고 구현은 시작하지 않았습니다.
- MongoDB 연결과 카카오 로그인을 아직 설정하지 않았으므로 실제 로그인은 확인되지 않았습니다.

## 실행에 필요한 환경

- Node.js: 22.13 이상인 22.x, 24.x 또는 26 이상
- npm: 10 이상

`.nvmrc`에 맞는 Node.js 버전을 선택한 뒤 의존성을 설치합니다.

```sh
npm install
```

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

- 커밋할 때 Husky가 lint-staged를 실행합니다. 이번 커밋에 올린 코드 파일은 ESLint와 Prettier로 확인하고, 문서와 설정 파일은 Prettier로 정리합니다.
- GitHub Actions는 `main`에 코드를 올리거나 Pull Request를 만들 때 전체 포맷, 린트, 타입, 테스트, 빌드를 확인합니다.
- 의존성을 설치하면 Husky가 Git hook을 설정합니다. hook이 동작하지 않으면 `npm run prepare`를 실행하세요.

## 환경 변수와 로그인

현재 `.env.example`은 기존 Supabase 로그인 코드에서 사용하던 변수 예시입니다. MongoDB와 자체 세션을 연결하는 구현이 승인되면 필요한 환경 변수와 카카오 콜백 주소를 이 안내에 추가해야 합니다. 카카오 Client Secret과 MongoDB 연결 문자열은 서버 전용 환경 변수에만 둡니다.

비밀 키와 데이터베이스 연결 문자열은 `.env.local` 또는 배포 서비스의 서버 전용 환경 변수에만 저장합니다. 실제 비밀 값을 저장소에 올리지 마세요.

## 프로젝트 문서

- [기능 요구사항](./spec.md)
- [기술 구조와 미결정 항목](./architecture.md)
