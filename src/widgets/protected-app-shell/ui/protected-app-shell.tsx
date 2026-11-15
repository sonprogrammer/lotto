"use client";

import type { ReactNode } from "react";
import type { AuthSessionUser } from "@/features/auth/model/auth-session";
import { AuthSessionProvider } from "@/features/auth/providers/auth-session-provider";
import { SiteHeader } from "@/widgets/site-header";

type ProtectedAppShellProps = {
  user: AuthSessionUser;
  children: ReactNode;
};

export function ProtectedAppShell({ user, children }: ProtectedAppShellProps) {
  return (
    <AuthSessionProvider user={user}>
      <SiteHeader
        displayName={user.nickname ?? undefined}
        userId={user.userId}
        isConfigured
        isSignedIn
        isSharedLayout
      />
      {children}
    </AuthSessionProvider>
  );
}
