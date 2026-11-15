import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/features/auth/server/current-session";
import { ProtectedAppShell } from "@/widgets/protected-app-shell";

export async function ProtectedLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return <ProtectedAppShell user={user}>{children}</ProtectedAppShell>;
}
