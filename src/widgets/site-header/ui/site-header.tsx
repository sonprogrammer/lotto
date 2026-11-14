"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthControl } from "@/features/auth/components/auth-control";
import { SavedPromptManagerDialog } from "@/features/saved-prompt/components/saved-prompt-manager-dialog";
import { NotificationBell } from "@/features/notification/components/notification-bell";
import { PushPermissionPrompt } from "@/features/notification/components/push-permission-prompt";

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
  const pathname = usePathname() ?? "";

  function isCurrentPage(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="preview-header">
        <Link
          className="brand"
          href="/"
          aria-label="로또 6/45 홈"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="brand-mark" aria-hidden="true">
            6
          </span>
          <span>LOTTO 6/45</span>
        </Link>
        {isSignedIn && (
          <nav className="site-navigation" aria-label="주요 메뉴">
            <Link
              className="analysis-link"
              href="/generate"
              aria-current={isCurrentPage("/generate") ? "page" : undefined}
            >
              번호 생성
            </Link>
            <Link
              className="analysis-link"
              href="/analysis"
              aria-current={isCurrentPage("/analysis") ? "page" : undefined}
            >
              이번 주 분석
            </Link>
            <Link
              className="analysis-link"
              href="/history"
              aria-current={isCurrentPage("/history") ? "page" : undefined}
            >
              당첨 내역
            </Link>
            <Link
              className="analysis-link"
              href="/saved"
              aria-current={isCurrentPage("/saved") ? "page" : undefined}
            >
              저장한 번호
            </Link>
            {userId && (
              <NotificationBell
                userId={userId}
                isActive={isCurrentPage("/notifications")}
              />
            )}
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
      <PushPermissionPrompt isSignedIn={isSignedIn} />
    </>
  );
}
