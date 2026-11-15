import { createContext } from "react";
import type { AuthSessionUser } from "./auth-session";

export const AuthSessionContext = createContext<AuthSessionUser | null>(null);
