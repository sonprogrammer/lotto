"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthControl } from "@/features/auth/components/auth-control";
import { SavedPromptManagerDialog } from "@/features/saved-prompt/components/saved-prompt-manager-dialog";

type SiteHeaderProps = {
  displayName?: string;
  userId?: string;
  isConfigured: boolean;
  isSignedIn: boolean;
};

export function SiteHeader({
  displayName,
  userId,
  isConfigured,
  isSignedIn,
}: SiteHeaderProps) {
  const [isPromptSettingsOpen, setPromptSettingsOpen] = useState(false);

  return (
    <>
      <header className="preview-header">
        <Link className="brand" href="/" aria-label="로또 6/45 홈">
          <span className="brand-mark" aria-hidden="true">
            6
          </span>
          <span>LOTTO 6/45</span>
        </Link>
        {isSignedIn && (
          <nav className="site-navigation" aria-label="주요 메뉴">
            <Link className="analysis-link" href="/generate">
              번호 생성
            </Link>
            <Link className="analysis-link" href="/analysis">
              이번 주 분석
            </Link>
            <Link className="analysis-link" href="/history">
              당첨 내역
            </Link>
            <Link className="analysis-link" href="/saved">
              저장한 번호
            </Link>
            {userId && (
              <button
                className="analysis-link site-navigation-button"
                type="button"
                aria-expanded={isPromptSettingsOpen}
                aria-controls="saved-prompt-dialog"
                onClick={() => setPromptSettingsOpen(true)}
              >
                프롬프트 설정
              </button>
            )}
          </nav>
        )}
        <AuthControl
          displayName={displayName}
          isConfigured={isConfigured}
          isSignedIn={isSignedIn}
        />
      </header>
      {isSignedIn && userId && (
        <SavedPromptManagerDialog
          open={isPromptSettingsOpen}
          userId={userId}
          onClose={() => setPromptSettingsOpen(false)}
        />
      )}
    </>
  );
}
