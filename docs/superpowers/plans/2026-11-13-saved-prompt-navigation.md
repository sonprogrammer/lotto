# Saved Prompt Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make saved prompt management available from the signed-in site navigation, using a bottom sheet on mobile/tablet and a right-side panel on desktop.

**Architecture:** Keep saved prompt CRUD and user-scoped data fetching in the existing saved-prompt feature. Move the management surface to the shared signed-in site header, pass the authenticated user ID to that header, and leave generation with prompt mode selection and custom input only.

**Tech Stack:** Next.js, React, TypeScript, TanStack Query, Vitest, existing CSS and native dialog.

**Spec:** Existing issue 7 saved-prompt behavior and the user-approved responsive navigation design.

## Global Constraints

- Saved prompts remain private to the authenticated user and capped at five.
- Existing prompt title/content validation and CRUD behavior remain unchanged.
- Follow FSD and keep one React component per file.
- Do not read environment or credential files.

## Review Focus

- Header opened from every signed-in route receives the correct user ID.
- Dialog closes accessibly and keeps CRUD controls usable at narrow and wide viewports.
- Generation still selects default, saved, or custom prompt and no longer owns manager state.

---

### Task 1: Move management entry to the shared header

**Files:**

- Modify `src/widgets/site-header/ui/site-header.tsx`
- Modify authenticated page/dashboard prop paths to provide the existing `userId`
- Modify `src/features/generation/components/generation-dashboard.tsx`
- Modify `src/features/generation/hooks/use-generation-form.ts`
- Modify `src/features/generation/components/generation-prompt-control.tsx`
- Modify related tests

- [ ] Add tests proving signed-in header exposes the prompt settings action and generation no longer renders an in-form manager action.
- [ ] Run focused tests and confirm they fail for the expected missing behavior.
- [ ] Connect header action to the existing user-scoped prompt manager; remove manager open/close state from the generation hook and component.
- [ ] Run focused tests and confirm they pass.

### Task 2: Make the manager responsive

**Files:**

- Modify `src/features/saved-prompt/components/saved-prompt-manager-dialog.css`
- Modify manager and header tests as needed

- [ ] Add assertions for dialog accessibility and close behavior if not already covered.
- [ ] Style the native dialog as a bottom sheet through tablet widths and as a fixed right-side panel on desktop; preserve existing form, list, loading, error, and empty states.
- [ ] Run focused tests, then the project verification commands required by `AGENTS.md`.
- [ ] Run the `ux-review` skill before updating the PR.
