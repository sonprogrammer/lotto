"use client";

import Link from "next/link";
import { AuthControl } from "@/features/auth/components/auth-control";

type SiteHeaderProps = {
  displayName?: string;
  isConfigured: boolean;
  isSignedIn: boolean;
};

export function SiteHeader({
  displayName,
  isConfigured,
  isSignedIn,
}: SiteHeaderProps) {
  return (
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
        </nav>
      )}
      <AuthControl
        displayName={displayName}
        isConfigured={isConfigured}
        isSignedIn={isSignedIn}
      />
    </header>
  );
}
