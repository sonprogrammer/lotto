"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SavedPromptCreateSchema } from "@/entities/saved-prompt/model/input";
import type { SavedPrompt } from "@/entities/saved-prompt/model/prompt";
import {
  useCreateSavedPrompt,
  useDeleteSavedPrompt,
  useSavedPrompts,
  useUpdateSavedPrompt,
} from "../hooks";
import "./saved-prompt-manager-dialog.css";

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
};

export function SavedPromptManagerDialog({ open, userId, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const promptsQuery = useSavedPrompts(userId);
  const createPrompt = useCreateSavedPrompt(userId);
  const updatePrompt = useUpdateSavedPrompt(userId);
  const deletePrompt = useDeleteSavedPrompt(userId);
  const prompts = promptsQuery.data ?? [];
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const isSaving = createPrompt.isPending || updatePrompt.isPending;
  const isBusy = isSaving || deletePrompt.isPending;
  const mutationError =
    createPrompt.error ?? updatePrompt.error ?? deletePrompt.error;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  function resetForm() {
    setFormOpen(false);
    setEditingPrompt(null);
    setTitle("");
    setContent("");
    setTitleError("");
    setContentError("");
    createPrompt.reset();
    updatePrompt.reset();
  }

  function startCreate() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(prompt: SavedPrompt) {
    resetForm();
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setFormOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const parsed = SavedPromptCreateSchema.safeParse({ title, content });
    if (!parsed.success) {
      setTitleError(
        parsed.error.issues.find((issue) => issue.path[0] === "title")
          ?.message ?? "",
      );
      setContentError(
        parsed.error.issues.find((issue) => issue.path[0] === "content")
          ?.message ?? "",
      );
      return;
    }
    setTitleError("");
    setContentError("");
    const onSaved = () => resetForm();
    if (editingPrompt) {
      updatePrompt.mutate(
        { id: editingPrompt.id, input: parsed.data },
        { onSuccess: onSaved },
      );
    } else {
      createPrompt.mutate(parsed.data, { onSuccess: onSaved });
    }
  }

  function close() {
    if (!isBusy) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="saved-prompt-dialog"
      id="saved-prompt-dialog"
      aria-labelledby="saved-prompt-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="saved-prompt-dialog-header">
        <div>
          <p className="saved-prompt-dialog-eyebrow">MY PROMPTS</p>
          <h2 id="saved-prompt-dialog-title">프롬프트 설정</h2>
          <p>자주 쓰는 의견을 저장해 다음 생성 때 다시 사용할 수 있어요.</p>
        </div>
        <button
          className="saved-prompt-dialog-close"
          type="button"
          aria-label="프롬프트 설정 닫기"
          disabled={isBusy}
          onClick={close}
        >
          ×
        </button>
      </div>

      <div className="saved-prompt-dialog-count" aria-live="polite">
        {prompts.length} / 5개 저장됨
      </div>

      {promptsQuery.isPending ? (
        <div className="saved-prompt-list-skeleton" role="status">
          저장 프롬프트를 불러오는 중이에요.
        </div>
      ) : promptsQuery.isError ? (
        <div className="saved-prompt-dialog-error" role="alert">
          <p>저장 프롬프트를 불러오지 못했어요.</p>
          <button type="button" onClick={() => void promptsQuery.refetch()}>
            다시 불러오기
          </button>
        </div>
      ) : prompts.length === 0 ? (
        <div className="saved-prompt-empty">
          <p>아직 저장한 프롬프트가 없어요.</p>
          <span>원하는 분석 의견을 저장해두고 조합 생성 때 사용해 보세요.</span>
          <button type="button" onClick={startCreate}>
            첫 프롬프트 추가
          </button>
        </div>
      ) : (
        <ul className="saved-prompt-list">
          {prompts.map((prompt) => (
            <li className="saved-prompt-list-item" key={prompt.id}>
              <div className="saved-prompt-list-copy">
                <h3>{prompt.title}</h3>
                <p>{prompt.content}</p>
              </div>
              <div className="saved-prompt-list-actions">
                <button
                  type="button"
                  aria-label={`수정: ${prompt.title}`}
                  disabled={isBusy}
                  onClick={() => startEdit(prompt)}
                >
                  수정
                </button>
                <button
                  type="button"
                  aria-label={`삭제: ${prompt.title}`}
                  disabled={isBusy}
                  onClick={() => setDeletingPromptId(prompt.id)}
                >
                  삭제
                </button>
              </div>
              {deletingPromptId === prompt.id && (
                <div className="saved-prompt-delete-confirm" role="group">
                  <span>이 프롬프트를 삭제할까요?</span>
                  <button
                    type="button"
                    disabled={deletePrompt.isPending}
                    onClick={() => setDeletingPromptId(null)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    aria-label={`삭제 확인: ${prompt.title}`}
                    disabled={deletePrompt.isPending}
                    onClick={() =>
                      deletePrompt.mutate(prompt.id, {
                        onSuccess: () => setDeletingPromptId(null),
                      })
                    }
                  >
                    {deletePrompt.isPending ? "삭제 중" : "삭제 확인"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {mutationError && (
        <p className="saved-prompt-dialog-error" role="alert">
          {mutationError.message}
        </p>
      )}

      {formOpen && (
        <form className="saved-prompt-form" onSubmit={submit}>
          <h3>{editingPrompt ? "프롬프트 수정" : "새 프롬프트"}</h3>
          <label htmlFor="saved-prompt-title">제목</label>
          <input
            id="saved-prompt-title"
            autoFocus
            disabled={isSaving}
            value={title}
            maxLength={30}
            aria-invalid={Boolean(titleError)}
            aria-describedby={
              titleError ? "saved-prompt-title-error" : undefined
            }
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError("");
            }}
          />
          {titleError && (
            <p id="saved-prompt-title-error" role="alert">
              {titleError}
            </p>
          )}
          <span className="saved-prompt-character-count">
            {title.length}/30자
          </span>
          <label htmlFor="saved-prompt-content">내용</label>
          <textarea
            id="saved-prompt-content"
            disabled={isSaving}
            value={content}
            maxLength={300}
            rows={4}
            aria-invalid={Boolean(contentError)}
            aria-describedby={
              contentError ? "saved-prompt-content-error" : undefined
            }
            onChange={(event) => {
              setContent(event.target.value);
              setContentError("");
            }}
          />
          {contentError && (
            <p id="saved-prompt-content-error" role="alert">
              {contentError}
            </p>
          )}
          <span className="saved-prompt-character-count">
            {content.length}/300자
          </span>
          <div className="saved-prompt-form-actions">
            <button type="button" disabled={isSaving} onClick={resetForm}>
              취소
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "저장 중" : editingPrompt ? "수정 저장" : "저장하기"}
            </button>
          </div>
        </form>
      )}

      <div className="saved-prompt-dialog-footer">
        {prompts.length > 0 && !formOpen && (
          <button
            type="button"
            disabled={prompts.length >= 5 || promptsQuery.isPending}
            onClick={startCreate}
          >
            새 프롬프트 추가
          </button>
        )}
        <button type="button" disabled={isBusy} onClick={close}>
          닫기
        </button>
      </div>
    </dialog>
  );
}
