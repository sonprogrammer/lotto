import { connection } from "next/server";
import { AuthAwarePreview } from "@/features/auth/components/auth-aware-preview";

export default async function Home() {
  await connection();
  return <AuthAwarePreview />;
}
