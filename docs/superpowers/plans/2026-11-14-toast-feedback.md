# 작업 완료 토스트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 저장·수정·삭제가 완료된 뒤 사라지는 성공 피드백을 Sonner 토스트로 일관되게 알린다.

**Architecture:** Sonner `Toaster`를 앱 루트에 두고, 네이티브 프롬프트 모달에는 전용 Toaster를 둔다. 각 기능의 성공 콜백에서 성공 토스트를 띄우며 조치가 필요한 오류는 기존 인라인 안내를 유지한다.

**Tech Stack:** Next.js App Router, React, TypeScript, Sonner

**Spec:** `docs/superpowers/specs/2026-11-14-toast-feedback-design.md`

## Global Constraints

- 기능 전용 흐름과 API 상태는 기존 커스텀 훅·FSD 구조를 유지한다.
- 실제 API 오류는 화면 안에 남겨 재시도 방법을 제공한다.
- 생성 결과에 이미 성공 표시가 있는 경우 중복 토스트를 추가하지 않는다.

## Review Focus

- 여러 저장 작업 성공 시 중복 토스트나 잘못된 문구가 발생하지 않는지 확인한다.
- 토스트가 보여도 오류 문구와 재시도 동작은 기존처럼 유지되는지 확인한다.
- 로그인·비로그인 화면에서 일반 Toaster가 표시되고, 프롬프트 모달의 성공 알림이 모달 안에 표시되는지 확인한다.

---

### Task 1: Sonner 전역 표시 영역

**Files:**

- Modify: `package.json`, lockfile
- Modify: `src/app/layout.tsx`

- [ ] Sonner를 설치하고 앱 루트에 상단 중앙 Toaster를 한 번 배치한다.
- [ ] 포맷·타입·린트 검사로 설정 오류를 확인한다.

### Task 2: 저장 성공 피드백 연결

**Files:**

- Modify: `src/features/saved-combination/components/manual-combination-form.tsx`
- Modify: `src/features/saved-combination/components/saved-combinations-panel.tsx`
- Modify: `src/features/saved-prompt/components/saved-prompt-manager-dialog.tsx`

- [ ] 수동 조합 저장, 조합 수정·삭제, 프롬프트 생성·수정·삭제 성공에 한국어 토스트를 연결한다.
- [ ] 프롬프트 성공 토스트는 모달 안의 전용 Toaster로 보낸다.
- [ ] 실패 안내는 기존 인라인 오류 상태에 남긴다.
- [ ] 생성 결과의 기존 저장 완료 표시에는 중복 토스트를 추가하지 않는다.
- [ ] 변경 파일의 포맷·타입·린트를 확인하고 주요 성공·오류 흐름을 코드 기준으로 점검한다.
