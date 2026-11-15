"use client";

import type { ReactNode } from "react";
import type { AuthSessionUser } from "../model/auth-session";
import { AuthSessionContext } from "../model/auth-session-context";

type AuthSessionProviderProps = {
  user: AuthSessionUser;
  children: ReactNode;
};

export function AuthSessionProvider({
  user,
  children,
}: AuthSessionProviderProps) {
  return (
    <AuthSessionContext.Provider value={user}>
      {children}
    </AuthSessionContext.Provider>
  );
}
