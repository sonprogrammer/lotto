import type { SavedPrompt } from "@/entities/saved-prompt/model/prompt";
import type { GenerationPromptMode } from "../hooks/use-generation-form";

type Props = {
  mode: GenerationPromptMode;
  prompt: string;
  savedPromptId: string;
  savedPrompts: SavedPrompt[];
  isLoading: boolean;
  isError: boolean;
  disabled: boolean;
  onModeChange: (mode: GenerationPromptMode) => void;
  onPromptChange: (value: string) => void;
  onSavedPromptChange: (id: string) => void;
  onManage: () => void;
  onRetry: () => void;
};

const modes: Array<{ id: GenerationPromptMode; label: string }> = [
  { id: "default", label: "기본 프롬프트" },
  { id: "saved", label: "저장 프롬프트" },
  { id: "custom", label: "새 의견" },
];

export function GenerationPromptControl({
  mode,
  prompt,
  savedPromptId,
  savedPrompts,
  isLoading,
  isError,
  disabled,
  onModeChange,
  onPromptChange,
  onSavedPromptChange,
  onManage,
  onRetry,
}: Props) {
  return (
    <fieldset className="generation-fieldset generation-prompt">
      <legend>
        AI 의견 <span className="generation-hint">선택 사항</span>
      </legend>
      <div
        className="generation-prompt-modes"
        role="group"
        aria-label="의견 선택 방식"
      >
        {modes.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            aria-pressed={mode === id}
            disabled={disabled || (id === "saved" && isLoading)}
            onClick={() => onModeChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "default" && (
        <p className="generation-helper">
          별도 의견을 고르지 않으면 기본 프롬프트로 과거 통계를 분석해요.
        </p>
      )}
      {mode === "saved" && (
        <div className="generation-control generation-prompt-selection">
          <label htmlFor="generation-saved-prompt">저장 프롬프트 선택</label>
          {isLoading ? (
            <div
              className="generation-prompt-skeleton"
              role="status"
              aria-label="저장 프롬프트 불러오는 중"
            />
          ) : isError ? (
            <div className="generation-prompt-error" role="alert">
              <span>저장 프롬프트를 불러오지 못했어요.</span>
              <button type="button" disabled={disabled} onClick={onRetry}>
                다시 불러오기
              </button>
            </div>
          ) : savedPrompts.length ? (
            <select
              id="generation-saved-prompt"
              value={savedPromptId}
              disabled={disabled}
              onChange={(event) => onSavedPromptChange(event.target.value)}
            >
              <option value="">프롬프트를 선택해 주세요</option>
              {savedPrompts.map((savedPrompt) => (
                <option key={savedPrompt.id} value={savedPrompt.id}>
                  {savedPrompt.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="generation-helper">
              저장한 프롬프트가 없어요. 먼저 프롬프트를 추가해 주세요.
            </p>
          )}
        </div>
      )}
      {mode === "custom" && (
        <div className="generation-control">
          <label htmlFor="generation-prompt">새 의견 입력</label>
          <textarea
            id="generation-prompt"
            disabled={disabled}
            maxLength={500}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="원하는 조합 방향이나 참고할 점을 적어주세요. 예: 홀수가 3개 정도면 좋겠어요."
            rows={3}
          />
          <p className="generation-helper">{prompt.length}/500자</p>
        </div>
      )}
      <div className="generation-prompt-footer">
        <p className="generation-helper">
          의견은 통계와 함께 고려해 추천해요. 당첨을 예측하지는 않아요.
        </p>
        <button
          type="button"
          className="generation-prompt-manage"
          disabled={disabled}
          onClick={onManage}
        >
          프롬프트 관리
        </button>
      </div>
    </fieldset>
  );
}
