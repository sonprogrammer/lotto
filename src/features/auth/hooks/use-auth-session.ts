"use client";

import { useContext } from "react";
import { AuthSessionContext } from "../model/auth-session-context";

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("AuthSessionProvider is missing");
  return session;
}
